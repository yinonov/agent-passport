import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { MemoryItemSchema } from '@agent-passport/schema';
import type { MemoryItem, MemoryCategory } from '@agent-passport/schema';
import { PassportGenerator } from '@agent-passport/core';
import { findPassportFile, readPassportFile } from './passport-file.js';

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

export interface PassportClientOptions {
  /** Path to `.agentpassport` file or `passport.json` */
  passportPath?: string;
  /** Agent identifier for permission tracking */
  agentId?: string;
  /** Allowed memory categories for this agent */
  allowedCategories?: MemoryCategory[];
}

export interface GetContextOptions {
  /** Memory categories to include. Merged with constructor allowedCategories. */
  categories?: MemoryCategory[];
  /** Scope label to include in the context block. */
  scope?: string;
  /** Approximate max tokens. Drops lowest-confidence items first. */
  maxTokens?: number;
}

// ---------------------------------------------------------------------------
// PassportClient
// ---------------------------------------------------------------------------

export class PassportClient {
  private readonly passportPath: string;
  private readonly agentId: string | undefined;
  private readonly allowedCategories: MemoryCategory[] | undefined;
  private items: MemoryItem[] = [];
  private loaded = false;

  constructor(options?: PassportClientOptions) {
    this.agentId = options?.agentId;
    this.allowedCategories = options?.allowedCategories;

    if (options?.passportPath) {
      this.passportPath = path.resolve(options.passportPath);
    } else {
      // Try .agentpassport walking up from cwd, then fall back to home dir
      const found = findPassportFile();
      if (found) {
        this.passportPath = found;
      } else {
        this.passportPath = path.join(
          os.homedir(),
          '.agent-passport',
          'passport.json',
        );
      }
    }
  }

  // -----------------------------------------------------------------------
  // Loading
  // -----------------------------------------------------------------------

  /**
   * Load the passport from disk. Parses JSON and validates every item
   * against the Zod schema. Throws a clear error when the file is missing.
   */
  async load(): Promise<void> {
    if (!fs.existsSync(this.passportPath)) {
      throw new Error(
        `Passport file not found: ${this.passportPath}. ` +
          'Create one with `createPassportFile()` or specify a path via `passportPath`.',
      );
    }

    this.items = readPassportFile(this.passportPath);
    this.loaded = true;
  }

  /** Whether the passport has been successfully loaded. */
  isLoaded(): boolean {
    return this.loaded;
  }

  // -----------------------------------------------------------------------
  // Querying
  // -----------------------------------------------------------------------

  /**
   * Return raw memory items, optionally filtered by category.
   */
  getMemories(filter?: { category?: MemoryCategory }): MemoryItem[] {
    this.ensureLoaded();

    let result = this.items;
    if (filter?.category) {
      result = result.filter((item) => item.category === filter.category);
    }
    return result;
  }

  /** Shorthand for `getMemories({ category: 'PROFILE' })`. */
  getProfile(): MemoryItem[] {
    return this.getMemories({ category: 'PROFILE' });
  }

  /** Shorthand for `getMemories({ category: 'PREFERENCE' })`. */
  getPreferences(): MemoryItem[] {
    return this.getMemories({ category: 'PREFERENCE' });
  }

  // -----------------------------------------------------------------------
  // Context generation
  // -----------------------------------------------------------------------

  /**
   * Return a formatted context prompt string from the loaded passport.
   *
   * Categories are filtered by the intersection of constructor-level
   * `allowedCategories` and the per-call `categories` option. When
   * `maxTokens` is specified the lowest-confidence items are dropped first.
   */
  getContext(options?: GetContextOptions): string {
    this.ensureLoaded();

    let filtered = this.applyCategories(
      this.items,
      options?.categories,
    );

    if (options?.maxTokens !== undefined) {
      filtered = this.truncateToTokenBudget(filtered, options.maxTokens);
    }

    return this.formatContext(filtered, options?.scope);
  }

  /**
   * Generate a system-prompt-ready context block.
   * Uses `PassportGenerator` internally.
   */
  toSystemPrompt(options?: { scope?: string }): string {
    this.ensureLoaded();

    const generator = new PassportGenerator();
    const pack = generator.generate({
      items: this.applyCategories(this.items),
      targetPlatform: 'claude',
      scope: options?.scope ?? 'general',
    });
    return pack.contextPrompt;
  }

  // -----------------------------------------------------------------------
  // Private helpers
  // -----------------------------------------------------------------------

  private ensureLoaded(): void {
    if (!this.loaded) {
      throw new Error(
        'Passport not loaded. Call `await client.load()` first.',
      );
    }
  }

  /**
   * Filter items to only the categories the agent is allowed to see.
   * If both constructor-level and per-call categories are given, only
   * items matching **both** are kept.
   */
  private applyCategories(
    items: MemoryItem[],
    callCategories?: MemoryCategory[],
  ): MemoryItem[] {
    const allowed = this.resolveAllowedCategories(callCategories);
    if (!allowed) {
      return items;
    }
    return items.filter((item) => allowed.has(item.category));
  }

  private resolveAllowedCategories(
    callCategories?: MemoryCategory[],
  ): Set<MemoryCategory> | null {
    if (!this.allowedCategories && !callCategories) {
      return null; // no restriction
    }

    if (this.allowedCategories && callCategories) {
      // Intersection of constructor-level and call-level categories
      const constructorSet = new Set<MemoryCategory>(this.allowedCategories);
      return new Set(callCategories.filter((c) => constructorSet.has(c)));
    }

    return new Set<MemoryCategory>(
      this.allowedCategories ?? callCategories ?? [],
    );
  }

  /**
   * Rough token estimation: ~4 characters per token.
   * Drop lowest-confidence items until we fit within the budget.
   */
  private truncateToTokenBudget(
    items: MemoryItem[],
    maxTokens: number,
  ): MemoryItem[] {
    // Sort descending by confidence so we keep the best items
    const sorted = [...items].sort((a, b) => b.confidence - a.confidence);
    const result: MemoryItem[] = [];
    let tokenEstimate = 0;

    for (const item of sorted) {
      const itemTokens = Math.ceil(item.content.length / 4);
      if (tokenEstimate + itemTokens > maxTokens) {
        break;
      }
      result.push(item);
      tokenEstimate += itemTokens;
    }

    return result;
  }

  private formatContext(items: MemoryItem[], scope?: string): string {
    if (items.length === 0) {
      return '';
    }

    const lines: string[] = [
      '=== Agent Passport Context ===',
      'The following is verified context about the user. Use it to personalize responses.',
      '',
    ];

    // Group by category
    const grouped = new Map<MemoryCategory, MemoryItem[]>();
    for (const item of items) {
      const group = grouped.get(item.category) ?? [];
      group.push(item);
      grouped.set(item.category, group);
    }

    const CATEGORY_LABELS: Record<MemoryCategory, string> = {
      PROFILE: 'Profile',
      PREFERENCE: 'Preferences',
      PROJECT: 'Project',
      TASK: 'Tasks',
      DECISION: 'Decisions',
      PERSON: 'People',
      CONSTRAINT: 'Constraints',
      RECURRING: 'Recurring',
    };

    const CATEGORY_ORDER: MemoryCategory[] = [
      'PROFILE',
      'PREFERENCE',
      'PROJECT',
      'TASK',
      'DECISION',
      'PERSON',
      'CONSTRAINT',
      'RECURRING',
    ];

    for (const category of CATEGORY_ORDER) {
      const categoryItems = grouped.get(category);
      if (!categoryItems || categoryItems.length === 0) {
        continue;
      }
      lines.push(`## ${CATEGORY_LABELS[category]}`);
      for (const item of categoryItems) {
        lines.push(`- ${item.content}`);
      }
      lines.push('');
    }

    if (scope) {
      lines.push('## Task Context');
      lines.push(`Current scope: ${scope}`);
    }

    lines.push('=== End Agent Passport ===');
    return lines.join('\n');
  }
}

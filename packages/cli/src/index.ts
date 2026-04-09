#!/usr/bin/env node

import { PassportGenerator } from '@agent-passport/core';
import type { MemoryCategory, ReviewDecision } from '@agent-passport/schema';
import { FileStore } from './file-store.js';
import {
  bold,
  dim,
  green,
  heading,
  success,
  error,
  warn,
  formatMemory,
  formatTable,
} from './formatter.js';
import * as fs from 'node:fs';
import * as path from 'node:path';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Print an error message and exit — typed as `never` so TS narrows correctly */
function die(message: string): never {
  console.log(error(message));
  return process.exit(1);
}

// ---------------------------------------------------------------------------
// Argument parsing
// ---------------------------------------------------------------------------

interface ParsedArgs {
  command: string;
  positional: string[];
  flags: Record<string, string>;
}

function parseArgs(argv: string[]): ParsedArgs {
  // Skip node + script path
  const args = argv.slice(2);
  const command = args[0] ?? 'help';
  const positional: string[] = [];
  const flags: Record<string, string> = {};

  let i = 1;
  while (i < args.length) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const next = args[i + 1];
      if (next !== undefined && !next.startsWith('--')) {
        flags[key] = next;
        i += 2;
      } else {
        flags[key] = 'true';
        i += 1;
      }
    } else {
      positional.push(arg);
      i += 1;
    }
  }

  return { command, positional, flags };
}

// Exported so tests can exercise it
export { parseArgs };

// ---------------------------------------------------------------------------
// Valid categories / states for validation
// ---------------------------------------------------------------------------

const VALID_CATEGORIES: MemoryCategory[] = [
  'PROFILE',
  'PREFERENCE',
  'PROJECT',
  'TASK',
  'DECISION',
  'PERSON',
  'CONSTRAINT',
  'RECURRING',
];

const VALID_STATES: ReviewDecision[] = [
  'APPROVED',
  'REJECTED',
  'EDITED',
  'PENDING',
];

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

async function cmdStatus(store: FileStore): Promise<void> {
  const mem = store.getStore();
  const all = mem.query({});

  console.log(heading('Agent Passport Status'));
  console.log('');

  // Count by state
  const byState: Record<string, number> = {};
  for (const item of all) {
    byState[item.reviewState] = (byState[item.reviewState] ?? 0) + 1;
  }

  const stateRows: string[][] = [
    [bold('State'), bold('Count')],
  ];
  for (const s of VALID_STATES) {
    if (byState[s]) {
      stateRows.push([s, String(byState[s])]);
    }
  }
  console.log(formatTable(stateRows));
  console.log('');

  // Count by category
  const byCat: Record<string, number> = {};
  for (const item of all) {
    byCat[item.category] = (byCat[item.category] ?? 0) + 1;
  }

  const catRows: string[][] = [
    [bold('Category'), bold('Count')],
  ];
  for (const c of VALID_CATEGORIES) {
    if (byCat[c]) {
      catRows.push([c, String(byCat[c])]);
    }
  }
  console.log(formatTable(catRows));
  console.log('');

  console.log(dim(`Total memories: ${all.length}`));
  console.log(dim(`File: ${store.getFilePath()}`));
}

async function cmdList(store: FileStore, flags: Record<string, string>): Promise<void> {
  const mem = store.getStore();

  const filters: {
    category?: MemoryCategory;
    reviewState?: ReviewDecision;
  } = {};

  if (flags.category) {
    const cat = flags.category.toUpperCase() as MemoryCategory;
    if (!VALID_CATEGORIES.includes(cat)) {
      console.log(dim(`Valid categories: ${VALID_CATEGORIES.join(', ')}`));
      die(`Invalid category: ${flags.category}`);
    }
    filters.category = cat;
  }

  if (flags.state) {
    const st = flags.state.toUpperCase() as ReviewDecision;
    if (!VALID_STATES.includes(st)) {
      console.log(dim(`Valid states: ${VALID_STATES.join(', ')}`));
      die(`Invalid state: ${flags.state}`);
    }
    filters.reviewState = st;
  }

  const items = mem.query(filters);

  if (items.length === 0) {
    console.log(warn('No memories found matching the given filters.'));
    return;
  }

  console.log(heading(`Memories (${items.length})`));
  console.log('');

  for (const item of items) {
    console.log(formatMemory(item));
    console.log('');
  }
}

async function cmdAdd(
  store: FileStore,
  positional: string[],
  flags: Record<string, string>,
): Promise<void> {
  const content = positional.join(' ').trim();
  if (!content) {
    console.log(dim('Usage: passport add <content> --category <CATEGORY>'));
    die('No content provided.');
  }

  const catRaw = flags.category;
  if (!catRaw) {
    console.log(dim(`Valid categories: ${VALID_CATEGORIES.join(', ')}`));
    die('Missing --category flag.');
  }

  const category = catRaw.toUpperCase() as MemoryCategory;
  if (!VALID_CATEGORIES.includes(category)) {
    console.log(dim(`Valid categories: ${VALID_CATEGORIES.join(', ')}`));
    die(`Invalid category: ${catRaw}`);
  }

  const mem = store.getStore();
  const item = mem.add({
    category,
    content,
    source: 'cli',
    confidence: 1.0,
    tags: flags.tags ? flags.tags.split(',').map((t) => t.trim()) : [],
  });

  await store.save();

  console.log(success(`Memory added ${dim(`(${item.id.slice(0, 8)})`)}`));
  console.log('');
  console.log(formatMemory(item));
}

function findByPrefix(store: FileStore, prefix: string): string {
  const mem = store.getStore();
  const all = mem.query({});
  const matches = all.filter((item) => item.id.startsWith(prefix));

  if (matches.length === 0) {
    die(`No memory found with ID starting with "${prefix}".`);
  }
  if (matches.length > 1) {
    for (const m of matches) {
      console.log(dim(`  ${m.id}`));
    }
    die(`Ambiguous ID prefix "${prefix}" — matches ${matches.length} items.`);
  }

  return matches[0].id;
}

async function cmdApprove(store: FileStore, positional: string[]): Promise<void> {
  const prefix = positional[0];
  if (!prefix) {
    console.log(dim('Usage: passport approve <id>'));
    die('No memory ID provided.');
  }

  const id = findByPrefix(store, prefix);
  const mem = store.getStore();
  const updated = mem.approve(id);
  await store.save();

  console.log(success(`Memory ${dim(id.slice(0, 8))} approved.`));
  console.log('');
  console.log(formatMemory(updated));
}

async function cmdReject(store: FileStore, positional: string[]): Promise<void> {
  const prefix = positional[0];
  if (!prefix) {
    console.log(dim('Usage: passport reject <id>'));
    die('No memory ID provided.');
  }

  const id = findByPrefix(store, prefix);
  const mem = store.getStore();
  mem.reject(id);
  await store.save();

  console.log(success(`Memory ${dim(id.slice(0, 8))} rejected.`));
}

async function cmdInject(store: FileStore, flags: Record<string, string>): Promise<void> {
  const target = flags.target;
  if (!target) {
    console.log(dim('Usage: passport inject --target <platform> [--scope <scope>] [--categories <cat1,cat2>]'));
    die('Missing --target flag.');
  }

  const validTargets = ['chatgpt', 'claude', 'perplexity', 'gemini', 'copilot'] as const;
  type TargetPlatform = typeof validTargets[number];
  if (!(validTargets as readonly string[]).includes(target)) {
    console.log(dim(`Valid targets: ${validTargets.join(', ')}`));
    die(`Invalid target: ${target}`);
  }

  const scope = flags.scope ?? 'general';
  const mem = store.getStore();
  let items = mem.getApproved();

  // Filter by categories if specified
  if (flags.categories) {
    const cats = flags.categories.split(',').map((c) => c.trim().toUpperCase());
    items = items.filter((item) => cats.includes(item.category));
  }

  if (items.length === 0) {
    console.log(warn('No approved memories to inject.'));
    return;
  }

  const generator = new PassportGenerator();
  const pack = generator.generate({
    items,
    targetPlatform: target as TargetPlatform,
    scope,
  });

  console.log(heading('Generated Context Prompt'));
  console.log('');
  console.log(pack.contextPrompt);
}

async function cmdExport(store: FileStore, flags: Record<string, string>): Promise<void> {
  const outPath = flags.file ?? path.resolve('agent-passport.json');
  const mem = store.getStore();
  const data = mem.export();

  fs.writeFileSync(outPath, data, 'utf-8');
  console.log(success(`Exported ${mem.size} memories to ${dim(outPath)}`));
}

async function cmdImport(store: FileStore, positional: string[]): Promise<void> {
  const filePath = positional[0];
  if (!filePath) {
    console.log(dim('Usage: passport import <file>'));
    die('No file path provided.');
  }

  const resolved = path.resolve(filePath);
  if (!fs.existsSync(resolved)) {
    die(`File not found: ${resolved}`);
  }

  const raw = fs.readFileSync(resolved, 'utf-8');
  const mem = store.getStore();
  const count = mem.import(raw);
  await store.save();

  console.log(success(`Imported ${count} memories from ${dim(resolved)}`));
}

async function cmdInit(store: FileStore): Promise<void> {
  const outPath = path.resolve('.agentpassport');
  const mem = store.getStore();
  const approved = mem.getApproved();

  if (approved.length === 0) {
    console.log(warn('No approved memories to write. Approve some memories first.'));
    return;
  }

  const lines: string[] = [
    '# Agent Passport — project context file',
    `# Generated at ${new Date().toISOString()}`,
    '#',
    `# ${approved.length} approved memories`,
    '',
  ];

  // Group by category
  const grouped = new Map<string, typeof approved>();
  for (const item of approved) {
    const existing = grouped.get(item.category) ?? [];
    existing.push(item);
    grouped.set(item.category, existing);
  }

  for (const [category, items] of grouped) {
    lines.push(`## ${category}`);
    for (const item of items) {
      lines.push(`- ${item.content}`);
    }
    lines.push('');
  }

  fs.writeFileSync(outPath, lines.join('\n'), 'utf-8');
  console.log(success(`Created ${dim(outPath)} with ${approved.length} memories.`));
}

function cmdHelp(): void {
  console.log(heading('Agent Passport CLI'));
  console.log('');
  console.log(`${bold('Usage:')} passport <command> [options]`);
  console.log('');
  console.log(bold('Commands:'));
  console.log('');

  const commands: string[][] = [
    ['status', 'Show passport summary (counts, file location)'],
    ['list', 'List memories [--category <cat>] [--state <state>]'],
    ['add <content>', 'Add a memory --category <CATEGORY> [--tags <t1,t2>]'],
    ['approve <id>', 'Approve a pending memory (accepts ID prefix)'],
    ['reject <id>', 'Reject a memory (accepts ID prefix)'],
    ['inject', 'Generate context prompt --target <platform> [--scope <scope>] [--categories <c1,c2>]'],
    ['export', 'Export to JSON [--file <path>]'],
    ['import <file>', 'Import memories from a JSON file'],
    ['init', 'Create .agentpassport file with approved memories'],
    ['help', 'Show this help text'],
  ];

  console.log(
    formatTable(
      commands.map(([cmd, desc]) => [`  ${green(cmd!)}`, dim(desc!)]),
    ),
  );

  console.log('');
  console.log(bold('Examples:'));
  console.log('');
  console.log(dim('  passport add "Prefers TypeScript" --category PREFERENCE'));
  console.log(dim('  passport list --category PREFERENCE --state PENDING'));
  console.log(dim('  passport approve 3a7f'));
  console.log(dim('  passport inject --target claude --scope coding'));
  console.log(dim('  passport export --file ~/backup.json'));
  console.log('');
  console.log(dim(`Data stored at: ~/.agent-passport/passport.json`));
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const { command, positional, flags } = parseArgs(process.argv);

  if (command === 'help' || flags.help === 'true') {
    cmdHelp();
    return;
  }

  const store = new FileStore();
  await store.load();

  switch (command) {
    case 'status':
      await cmdStatus(store);
      break;
    case 'list':
      await cmdList(store, flags);
      break;
    case 'add':
      await cmdAdd(store, positional, flags);
      break;
    case 'approve':
      await cmdApprove(store, positional);
      break;
    case 'reject':
      await cmdReject(store, positional);
      break;
    case 'inject':
      await cmdInject(store, flags);
      break;
    case 'export':
      await cmdExport(store, flags);
      break;
    case 'import':
      await cmdImport(store, positional);
      break;
    case 'init':
      await cmdInit(store);
      break;
    default:
      console.log('');
      cmdHelp();
      die(`Unknown command: ${command}`);
  }
}

main().catch((err: unknown) => {
  console.error(error(err instanceof Error ? err.message : String(err)));
  process.exit(1);
});

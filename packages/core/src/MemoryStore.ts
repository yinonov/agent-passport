import { randomUUID } from 'crypto';
import type { MemoryItem, Passport } from '@agent-passport/schema';
import { MemoryItemSchema, PassportSchema } from '@agent-passport/schema';

export class MemoryStore {
  private passport: Passport;

  constructor(initial?: Partial<Passport>) {
    const now = new Date().toISOString();
    this.passport = {
      version: '1.0',
      id: initial?.id ?? randomUUID(),
      createdAt: initial?.createdAt ?? now,
      updatedAt: now,
      identity: initial?.identity ?? {},
      memories: initial?.memories ?? [],
      permissions: initial?.permissions ?? [],
      metadata: initial?.metadata,
    };
  }

  /** Load from serialised JSON (e.g. chrome.storage) */
  static fromJSON(raw: unknown): MemoryStore {
    const parsed = PassportSchema.parse(raw);
    return new MemoryStore(parsed);
  }

  toJSON(): Passport {
    return structuredClone(this.passport);
  }

  getAll(): MemoryItem[] {
    return [...this.passport.memories];
  }

  getByCategory(category: MemoryItem['category']): MemoryItem[] {
    return this.passport.memories.filter((m) => m.category === category);
  }

  add(item: Omit<MemoryItem, 'id' | 'createdAt' | 'updatedAt'>): MemoryItem {
    const now = new Date().toISOString();
    const full: MemoryItem = MemoryItemSchema.parse({
      ...item,
      id: randomUUID(),
      createdAt: now,
      updatedAt: now,
    });
    this.passport.memories.push(full);
    this.passport.updatedAt = now;
    return full;
  }

  update(id: string, patch: Partial<Omit<MemoryItem, 'id' | 'createdAt'>>): MemoryItem | null {
    const idx = this.passport.memories.findIndex((m) => m.id === id);
    if (idx === -1) return null;
    const existing = this.passport.memories[idx]!;
    const now = new Date().toISOString();
    const updated: MemoryItem = MemoryItemSchema.parse({
      ...existing,
      ...patch,
      id,
      updatedAt: now,
    });
    this.passport.memories[idx] = updated;
    this.passport.updatedAt = now;
    return updated;
  }

  remove(id: string): boolean {
    const before = this.passport.memories.length;
    this.passport.memories = this.passport.memories.filter((m) => m.id !== id);
    if (this.passport.memories.length !== before) {
      this.passport.updatedAt = new Date().toISOString();
      return true;
    }
    return false;
  }

  search(query: string): MemoryItem[] {
    const q = query.toLowerCase();
    return this.passport.memories.filter(
      (m) =>
        m.content.toLowerCase().includes(q) ||
        m.tags.some((t) => t.toLowerCase().includes(q))
    );
  }
}

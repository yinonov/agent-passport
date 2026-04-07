import {
  MemoryItem,
  MemoryItemCreate,
  MemoryCategory,
  ReviewState,
  Passport,
  PassportPack,
} from '@agent-passport/schema';

type ChangeListener = (memories: MemoryItem[]) => void;

export class MemoryStore {
  private memories: Map<string, MemoryItem> = new Map();
  private listeners: Set<ChangeListener> = new Set();
  private ownerId: string;

  constructor(ownerId?: string) {
    this.ownerId = ownerId ?? crypto.randomUUID();
  }

  add(item: MemoryItemCreate): MemoryItem {
    const memory: MemoryItem = {
      ...item,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      reviewState: item.reviewState ?? ReviewState.PENDING,
      tags: item.tags ?? [],
    };
    this.memories.set(memory.id, memory);
    this.notify();
    return memory;
  }

  approve(id: string): MemoryItem {
    const item = this.getOrThrow(id);
    const updated: MemoryItem = { ...item, reviewState: ReviewState.APPROVED };
    this.memories.set(id, updated);
    this.notify();
    return updated;
  }

  reject(id: string): MemoryItem {
    const item = this.getOrThrow(id);
    const updated: MemoryItem = { ...item, reviewState: ReviewState.REJECTED };
    this.memories.set(id, updated);
    this.notify();
    return updated;
  }

  edit(
    id: string,
    patch: Partial<Pick<MemoryItem, 'content' | 'tags' | 'category'>>,
  ): MemoryItem {
    const item = this.getOrThrow(id);
    const updated: MemoryItem = {
      ...item,
      ...patch,
      reviewState: ReviewState.EDITED,
    };
    this.memories.set(id, updated);
    this.notify();
    return updated;
  }

  remove(id: string): boolean {
    const existed = this.memories.has(id);
    if (existed) {
      this.memories.delete(id);
      this.notify();
    }
    return existed;
  }

  getById(id: string): MemoryItem | undefined {
    return this.memories.get(id);
  }

  queryByCategory(category: MemoryCategory): MemoryItem[] {
    return Array.from(this.memories.values()).filter(
      (m) => m.category === category,
    );
  }

  getApproved(): MemoryItem[] {
    return Array.from(this.memories.values()).filter(
      (m) =>
        m.reviewState === ReviewState.APPROVED ||
        m.reviewState === ReviewState.EDITED,
    );
  }

  getPending(): MemoryItem[] {
    return Array.from(this.memories.values()).filter(
      (m) => m.reviewState === ReviewState.PENDING,
    );
  }

  export(): Passport {
    const now = new Date().toISOString();
    return {
      version: '1',
      owner: { id: this.ownerId },
      memories: this.getApproved(),
      createdAt: now,
      updatedAt: now,
    };
  }

  importPassport(pack: PassportPack): void {
    for (const memory of pack.passport.memories) {
      if (!this.memories.has(memory.id)) {
        this.memories.set(memory.id, memory);
      }
    }
    this.notify();
  }

  onChange(listener: ChangeListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  toJSON(): string {
    return JSON.stringify({
      ownerId: this.ownerId,
      memories: Array.from(this.memories.values()),
    });
  }

  static fromJSON(json: string): MemoryStore {
    const data = JSON.parse(json) as {
      ownerId?: string;
      memories: MemoryItem[];
    };
    const store = new MemoryStore(data.ownerId);
    for (const memory of data.memories) {
      store.memories.set(memory.id, memory);
    }
    return store;
  }

  private getOrThrow(id: string): MemoryItem {
    const item = this.memories.get(id);
    if (!item) throw new Error(`Memory item not found: ${id}`);
    return item;
  }

  private notify(): void {
    const all = Array.from(this.memories.values());
    for (const listener of this.listeners) {
      listener(all);
    }
  }
}

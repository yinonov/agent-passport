import { MemoryItemSchema } from '@agent-passport/schema';
import type {
  MemoryItem,
  MemoryCategory,
  ReviewDecision,
} from '@agent-passport/schema';

export class MemoryStore {
  private items: Map<string, MemoryItem> = new Map();

  add(
    item: Omit<MemoryItem, 'id' | 'timestamp' | 'reviewState'>,
  ): MemoryItem {
    const memoryItem: MemoryItem = {
      ...item,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      reviewState: 'PENDING',
    };
    this.items.set(memoryItem.id, memoryItem);
    return memoryItem;
  }

  approve(id: string): MemoryItem {
    const item = this.items.get(id);
    if (!item) {
      throw new Error(`Memory item not found: ${id}`);
    }
    const updated: MemoryItem = { ...item, reviewState: 'APPROVED' };
    this.items.set(id, updated);
    return updated;
  }

  reject(id: string): void {
    const item = this.items.get(id);
    if (!item) {
      throw new Error(`Memory item not found: ${id}`);
    }
    const updated: MemoryItem = { ...item, reviewState: 'REJECTED' };
    this.items.set(id, updated);
  }

  edit(
    id: string,
    updates: Partial<Pick<MemoryItem, 'content' | 'category' | 'tags'>>,
  ): MemoryItem {
    const item = this.items.get(id);
    if (!item) {
      throw new Error(`Memory item not found: ${id}`);
    }
    const updated: MemoryItem = {
      ...item,
      ...updates,
      reviewState: 'EDITED',
    };
    this.items.set(id, updated);
    return updated;
  }

  get(id: string): MemoryItem | undefined {
    return this.items.get(id);
  }

  query(filters: {
    category?: MemoryCategory;
    reviewState?: ReviewDecision;
    tags?: string[];
  }): MemoryItem[] {
    let results = Array.from(this.items.values());

    if (filters.category) {
      results = results.filter((item) => item.category === filters.category);
    }
    if (filters.reviewState) {
      results = results.filter(
        (item) => item.reviewState === filters.reviewState,
      );
    }
    if (filters.tags && filters.tags.length > 0) {
      results = results.filter((item) =>
        filters.tags!.some((tag) => item.tags.includes(tag)),
      );
    }

    return results;
  }

  getApproved(): MemoryItem[] {
    return Array.from(this.items.values()).filter(
      (item) =>
        item.reviewState === 'APPROVED' || item.reviewState === 'EDITED',
    );
  }

  getPending(): MemoryItem[] {
    return Array.from(this.items.values()).filter(
      (item) => item.reviewState === 'PENDING',
    );
  }

  export(): string {
    return JSON.stringify(Array.from(this.items.values()));
  }

  import(json: string): number {
    const parsed: unknown[] = JSON.parse(json);
    let count = 0;

    for (const entry of parsed) {
      const result = MemoryItemSchema.safeParse(entry);
      if (result.success) {
        this.items.set(result.data.id, result.data);
        count++;
      }
    }

    return count;
  }

  clear(): void {
    this.items.clear();
  }

  get size(): number {
    return this.items.size;
  }
}

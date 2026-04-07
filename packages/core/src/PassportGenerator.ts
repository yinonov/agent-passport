import { MemoryItem, MemoryCategory } from '@agent-passport/schema';

const CATEGORY_LABELS: Record<MemoryCategory, string> = {
  [MemoryCategory.PROFILE]: 'Profile',
  [MemoryCategory.PREFERENCE]: 'Preferences',
  [MemoryCategory.PROJECT]: 'Projects',
  [MemoryCategory.TASK]: 'Tasks',
  [MemoryCategory.DECISION]: 'Decisions',
  [MemoryCategory.PERSON]: 'People',
  [MemoryCategory.CONSTRAINT]: 'Constraints',
  [MemoryCategory.RECURRING]: 'Recurring Patterns',
};

export class PassportGenerator {
  generate(
    memories: MemoryItem[],
    platform: string,
    scope?: MemoryCategory[],
  ): string {
    const filtered = scope
      ? memories.filter((m) => scope.includes(m.category))
      : memories;

    if (filtered.length === 0) return '';

    const grouped = this.groupByCategory(filtered);
    const now = new Date().toISOString();

    const lines: string[] = [
      '# Agent Passport Context',
      `Platform: ${platform}`,
      `Generated: ${now}`,
      '',
    ];

    for (const [category, items] of Object.entries(grouped)) {
      if (!items) continue;
      const label = CATEGORY_LABELS[category as MemoryCategory] ?? category;
      lines.push(`## ${label}`);
      for (const item of items) {
        const confidenceNote =
          item.confidence < 1
            ? ` (confidence: ${(item.confidence * 100).toFixed(0)}%)`
            : '';
        lines.push(`- ${item.content}${confidenceNote}`);
      }
      lines.push('');
    }

    lines.push('---');
    lines.push(
      '*This context was injected by Agent Passport. Respect the user\'s established preferences.*',
    );

    return lines.join('\n');
  }

  generateCompact(memories: MemoryItem[], platform: string): string {
    if (memories.length === 0) return '';
    const snippets = memories.map((m) => m.content).join(' | ');
    return `[Agent Passport @ ${platform}]: ${snippets}`;
  }

  estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  private groupByCategory(
    memories: MemoryItem[],
  ): Partial<Record<MemoryCategory, MemoryItem[]>> {
    const groups: Partial<Record<MemoryCategory, MemoryItem[]>> = {};
    for (const memory of memories) {
      if (!groups[memory.category]) {
        groups[memory.category] = [];
      }
      groups[memory.category]!.push(memory);
    }
    return groups;
  }
}

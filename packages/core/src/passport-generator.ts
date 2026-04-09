import type { MemoryItem, MemoryCategory, PassportPack } from '@agent-passport/schema';

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

export class PassportGenerator {
  generate(params: {
    items: MemoryItem[];
    targetPlatform: 'chatgpt' | 'claude' | 'perplexity' | 'gemini' | 'copilot';
    scope: string;
  }): PassportPack {
    const { items, targetPlatform, scope } = params;

    // Group items by category
    const grouped = new Map<MemoryCategory, MemoryItem[]>();
    for (const item of items) {
      const existing = grouped.get(item.category) ?? [];
      existing.push(item);
      grouped.set(item.category, existing);
    }

    // Build context prompt
    const lines: string[] = [
      '=== Agent Passport Context ===',
      'The following is verified context about the user. Use it to personalize responses.',
      '',
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

    lines.push('## Task Context');
    lines.push(`Current scope: ${scope}`);
    lines.push('=== End Agent Passport ===');

    const contextPrompt = lines.join('\n');
    const generatedAt = new Date().toISOString();

    return {
      targetPlatform,
      scope,
      items,
      contextPrompt,
      generatedAt,
    };
  }
}

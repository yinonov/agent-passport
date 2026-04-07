import type { MemoryItem } from '@agent-passport/schema';

type Platform = MemoryItem['source'];

interface ExtractionRule {
  pattern: RegExp;
  category: MemoryItem['category'];
  confidence: number;
}

const EXTRACTION_RULES: ExtractionRule[] = [
  { pattern: /my name is ([^.,!?]+)/i, category: 'identity', confidence: 0.95 },
  { pattern: /i(?:'m| am) ([a-z]+ (?:developer|engineer|designer|manager|researcher|founder|ceo|cto|director))/i, category: 'identity', confidence: 0.9 },
  { pattern: /i work(?:ing)? (?:at|for|with) ([^.,!?]+)/i, category: 'identity', confidence: 0.85 },
  { pattern: /i (?:love|prefer|like|enjoy|use) ([^.,!?]+)/i, category: 'preference', confidence: 0.8 },
  { pattern: /i(?:'m| am) (?:good at|skilled in|experienced with) ([^.,!?]+)/i, category: 'skill', confidence: 0.85 },
  { pattern: /i(?:'m| am) (?:working on|building|developing) ([^.,!?]+)/i, category: 'project', confidence: 0.85 },
  { pattern: /my goal is to ([^.,!?]+)/i, category: 'goal', confidence: 0.85 },
  { pattern: /i want to ([^.,!?]+)/i, category: 'goal', confidence: 0.75 },
];

export class MemoryExtractor {
  constructor(private readonly platform: Platform) {}

  extractFromText(text: string): MemoryItem[] {
    const results: MemoryItem[] = [];
    const now = new Date().toISOString();

    for (const rule of EXTRACTION_RULES) {
      const matches = text.matchAll(new RegExp(rule.pattern, 'gi'));
      for (const match of matches) {
        const content = match[0]?.trim();
        if (!content || content.length < 5) continue;
        results.push({
          id: crypto.randomUUID(),
          content,
          category: rule.category,
          tags: [],
          source: this.platform,
          confidence: rule.confidence,
          createdAt: now,
          updatedAt: now,
          extractedFrom: text.slice(0, 100),
        });
      }
    }

    return results;
  }

  /** Extract memories from a conversation array [{role, content}] */
  extractFromConversation(
    messages: Array<{ role: 'user' | 'assistant'; content: string }>
  ): MemoryItem[] {
    const userMessages = messages
      .filter((m) => m.role === 'user')
      .map((m) => m.content)
      .join(' ');
    return this.extractFromText(userMessages);
  }
}

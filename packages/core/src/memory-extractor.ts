import type { MemoryItem, MemoryCategory } from '@agent-passport/schema';

interface ExtractionPattern {
  regex: RegExp;
  category: MemoryCategory;
  confidence: number;
  extractContent: (match: RegExpMatchArray) => string;
}

const PATTERNS: ExtractionPattern[] = [
  // Profile patterns
  {
    regex: /my name is ([A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*)/gi,
    category: 'PROFILE',
    confidence: 0.9,
    extractContent: (m) => `Name: ${m[1]}`,
  },
  {
    regex: /I am a ([^.,!?]+)/gi,
    category: 'PROFILE',
    confidence: 0.7,
    extractContent: (m) => `Role: ${m[1].trim()}`,
  },
  {
    regex: /I work at ([^.,!?]+)/gi,
    category: 'PROFILE',
    confidence: 0.9,
    extractContent: (m) => `Works at: ${m[1].trim()}`,
  },
  {
    regex: /I live in ([^.,!?]+)/gi,
    category: 'PROFILE',
    confidence: 0.8,
    extractContent: (m) => `Lives in: ${m[1].trim()}`,
  },

  // Preference patterns
  {
    regex: /I prefer ([^.,!?]+)/gi,
    category: 'PREFERENCE',
    confidence: 0.8,
    extractContent: (m) => `Prefers: ${m[1].trim()}`,
  },
  {
    regex: /I like ([^.,!?]+)/gi,
    category: 'PREFERENCE',
    confidence: 0.7,
    extractContent: (m) => `Likes: ${m[1].trim()}`,
  },
  {
    regex: /I always use ([^.,!?]+)/gi,
    category: 'PREFERENCE',
    confidence: 0.8,
    extractContent: (m) => `Always uses: ${m[1].trim()}`,
  },
  {
    regex: /I don't like ([^.,!?]+)/gi,
    category: 'PREFERENCE',
    confidence: 0.8,
    extractContent: (m) => `Dislikes: ${m[1].trim()}`,
  },
  {
    regex: /please always ([^.!?]+)/gi,
    category: 'PREFERENCE',
    confidence: 0.8,
    extractContent: (m) => `Always: ${m[1].trim()}`,
  },
  {
    regex: /never ([a-z]+ my (?:code|files|work)[^.!?]*)/gi,
    category: 'PREFERENCE',
    confidence: 0.7,
    extractContent: (m) => `Never: ${m[1].trim()}`,
  },

  // Project patterns
  {
    regex: /working on ([^.,!?]+)/gi,
    category: 'PROJECT',
    confidence: 0.8,
    extractContent: (m) => `Working on: ${m[1].trim()}`,
  },
  {
    regex: /the project uses ([^.,!?]+)/gi,
    category: 'PROJECT',
    confidence: 0.8,
    extractContent: (m) => `Project uses: ${m[1].trim()}`,
  },
  {
    regex: /our stack is ([^.,!?]+)/gi,
    category: 'PROJECT',
    confidence: 0.8,
    extractContent: (m) => `Stack: ${m[1].trim()}`,
  },
  {
    regex: /we use ([^.,!?]+)/gi,
    category: 'PROJECT',
    confidence: 0.7,
    extractContent: (m) => `Uses: ${m[1].trim()}`,
  },

  // Decision patterns
  {
    regex: /let's go with ([^.,!?]+)/gi,
    category: 'DECISION',
    confidence: 0.8,
    extractContent: (m) => `Decision: go with ${m[1].trim()}`,
  },
  {
    regex: /I decided to ([^.,!?]+)/gi,
    category: 'DECISION',
    confidence: 0.9,
    extractContent: (m) => `Decided to: ${m[1].trim()}`,
  },
  {
    regex: /we chose ([^.,!?]+)/gi,
    category: 'DECISION',
    confidence: 0.8,
    extractContent: (m) => `Chose: ${m[1].trim()}`,
  },

  // Constraint patterns
  {
    regex: /don't ([^.!?]+)/gi,
    category: 'CONSTRAINT',
    confidence: 0.6,
    extractContent: (m) => `Don't: ${m[1].trim()}`,
  },
  {
    regex: /must always ([^.!?]+)/gi,
    category: 'CONSTRAINT',
    confidence: 0.8,
    extractContent: (m) => `Must always: ${m[1].trim()}`,
  },
  {
    regex: /never ([^.!?]+)/gi,
    category: 'CONSTRAINT',
    confidence: 0.7,
    extractContent: (m) => `Never: ${m[1].trim()}`,
  },
  {
    regex: /requirement:\s*([^.!?\n]+)/gi,
    category: 'CONSTRAINT',
    confidence: 0.9,
    extractContent: (m) => `Requirement: ${m[1].trim()}`,
  },

  // Recurring task patterns
  {
    regex: /every week I ([^.,!?]+)/gi,
    category: 'RECURRING',
    confidence: 0.8,
    extractContent: (m) => `Weekly: ${m[1].trim()}`,
  },
  {
    regex: /I regularly ([^.,!?]+)/gi,
    category: 'RECURRING',
    confidence: 0.7,
    extractContent: (m) => `Regularly: ${m[1].trim()}`,
  },
  {
    regex: /daily ([^.,!?]+)/gi,
    category: 'RECURRING',
    confidence: 0.8,
    extractContent: (m) => `Daily: ${m[1].trim()}`,
  },
];

export class MemoryExtractor {
  extract(
    text: string,
  ): Array<Omit<MemoryItem, 'id' | 'timestamp' | 'reviewState'>> {
    const results: Array<Omit<MemoryItem, 'id' | 'timestamp' | 'reviewState'>> = [];
    const seen = new Set<string>();

    for (const pattern of PATTERNS) {
      // Reset regex lastIndex for global patterns
      pattern.regex.lastIndex = 0;

      let match: RegExpExecArray | null;
      while ((match = pattern.regex.exec(text)) !== null) {
        const content = pattern.extractContent(match);

        // Deduplicate by content
        if (seen.has(content)) {
          continue;
        }
        seen.add(content);

        results.push({
          category: pattern.category,
          content,
          source: 'conversation-extract',
          confidence: pattern.confidence,
          tags: [],
        });
      }
    }

    return results;
  }
}

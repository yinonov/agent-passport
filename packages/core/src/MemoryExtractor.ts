import {
  MemoryItemCreate,
  MemoryCategory,
  Provenance,
} from '@agent-passport/schema';

interface ExtractionPattern {
  regex: RegExp;
  confidence: number;
}

export class MemoryExtractor {
  extract(text: string, platform: string): MemoryItemCreate[] {
    const provenance: Provenance = {
      platform,
      extractedAt: new Date().toISOString(),
      rawSnippet: text.slice(0, 200),
    };

    const results: MemoryItemCreate[] = [
      ...this.extractProfileFacts(text, provenance),
      ...this.extractPreferences(text, provenance),
      ...this.extractProjects(text, provenance),
      ...this.extractConstraints(text, provenance),
      ...this.extractDecisions(text, provenance),
    ];

    return this.deduplicate(results);
  }

  private extractProfileFacts(
    text: string,
    provenance: Provenance,
  ): MemoryItemCreate[] {
    const patterns: ExtractionPattern[] = [
      { regex: /(?:my name is|i(?:'m| am)) ([A-Z][a-z]+ [A-Z][a-z]+)/gi, confidence: 0.95 },
      { regex: /(?:i(?:'m| am)) (?:a |an )?([a-z][\w\s]{3,40}(?:developer|engineer|designer|manager|founder|cto|ceo|researcher|scientist|writer|consultant))/gi, confidence: 0.9 },
      { regex: /i work (?:at|for|with) ([\w\s]{2,40})/gi, confidence: 0.85 },
      { regex: /i(?:'m| am) (?:based in|located in|from) ([\w\s,]{2,40})/gi, confidence: 0.85 },
    ];

    return this.matchPatterns(text, patterns, MemoryCategory.PROFILE, provenance);
  }

  private extractPreferences(
    text: string,
    provenance: Provenance,
  ): MemoryItemCreate[] {
    const patterns: ExtractionPattern[] = [
      { regex: /i (?:prefer|like|love|enjoy) ([\w\s]{3,100})/gi, confidence: 0.8 },
      { regex: /i always use ([\w\s]{2,60})/gi, confidence: 0.85 },
      { regex: /i never use ([\w\s]{2,60})/gi, confidence: 0.85 },
      { regex: /my (?:favorite|preferred) ([\w\s]{2,80})/gi, confidence: 0.8 },
      { regex: /i (?:don't|do not) like ([\w\s]{3,80})/gi, confidence: 0.8 },
    ];

    return this.matchPatterns(text, patterns, MemoryCategory.PREFERENCE, provenance);
  }

  private extractProjects(
    text: string,
    provenance: Provenance,
  ): MemoryItemCreate[] {
    const patterns: ExtractionPattern[] = [
      { regex: /(?:working on|building|developing) (?:a |an |the )?([\w\s]{3,80}(?:app|system|platform|tool|service|api|website|project))/gi, confidence: 0.8 },
      { regex: /(?:my |our )(?:project|app|system|platform|product)(?: called| named| is)? ([\w\s"']{2,60})/gi, confidence: 0.8 },
      { regex: /the project(?: is| uses| requires| needs) ([\w\s]{3,100})/gi, confidence: 0.7 },
    ];

    return this.matchPatterns(text, patterns, MemoryCategory.PROJECT, provenance);
  }

  private extractConstraints(
    text: string,
    provenance: Provenance,
  ): MemoryItemCreate[] {
    const patterns: ExtractionPattern[] = [
      { regex: /(?:must|need to|required to|have to) ([\w\s]{3,100})/gi, confidence: 0.75 },
      { regex: /(?:cannot|can't|must not|mustn't|never) ([\w\s]{3,100})/gi, confidence: 0.8 },
      { regex: /(?:constraint|requirement|rule)(?:s)?(?:: | is | are )([\w\s]{3,100})/gi, confidence: 0.85 },
      { regex: /(?:always|strictly) ([\w\s]{3,80})/gi, confidence: 0.7 },
    ];

    return this.matchPatterns(text, patterns, MemoryCategory.CONSTRAINT, provenance);
  }

  private extractDecisions(
    text: string,
    provenance: Provenance,
  ): MemoryItemCreate[] {
    const patterns: ExtractionPattern[] = [
      { regex: /(?:i |we )?decided(?: to| on)? ([\w\s]{3,100})/gi, confidence: 0.85 },
      { regex: /(?:i |we )?chose ([\w\s]{2,80})/gi, confidence: 0.85 },
      { regex: /going with ([\w\s]{2,80})/gi, confidence: 0.8 },
      { regex: /we (?:will|are going to) use ([\w\s]{2,80})/gi, confidence: 0.8 },
    ];

    return this.matchPatterns(text, patterns, MemoryCategory.DECISION, provenance);
  }

  private matchPatterns(
    text: string,
    patterns: ExtractionPattern[],
    category: MemoryCategory,
    provenance: Provenance,
  ): MemoryItemCreate[] {
    const results: MemoryItemCreate[] = [];

    for (const { regex, confidence } of patterns) {
      let match: RegExpExecArray | null;
      regex.lastIndex = 0;
      while ((match = regex.exec(text)) !== null) {
        const content = match[0].trim();
        if (content.length > 5 && content.length <= 500) {
          results.push({
            category,
            content,
            source: provenance.platform,
            confidence,
            tags: [],
            provenance,
          });
        }
      }
    }

    return results;
  }

  private deduplicate(items: MemoryItemCreate[]): MemoryItemCreate[] {
    const seen = new Set<string>();
    return items.filter((item) => {
      const key = item.content.toLowerCase().replace(/\s+/g, ' ').trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
}

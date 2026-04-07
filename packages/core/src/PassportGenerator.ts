import type { MemoryItem, Passport, PassportPack, PermissionGrant } from '@agent-passport/schema';
import { PassportPackSchema } from '@agent-passport/schema';

type Platform = PassportPack['platform'];

const PLATFORM_PREAMBLES: Record<Platform, string> = {
  chatgpt: 'You are talking with a user who has shared their Agent Passport. Use this context to personalise every response.',
  claude: 'The following is the user\'s Agent Passport — a structured personal context document. Incorporate this naturally into your responses.',
  perplexity: 'User context from Agent Passport:',
  gemini: 'User\'s personal context (Agent Passport):',
  grok: 'User Agent Passport context:',
  generic: 'User context:',
};

export class PassportGenerator {
  constructor(private readonly passport: Passport) {}

  private filterByPermission(
    memories: MemoryItem[],
    grants: PermissionGrant[],
    platform: Platform
  ): MemoryItem[] {
    const applicable = grants.filter(
      (g) => g.active && (g.platform === platform || g.platform === '*')
    );
    if (applicable.length === 0) return [];

    const allScopes = applicable.flatMap((g) => g.scope);
    const hasAll = allScopes.includes('read:all');

    return memories.filter((m) => {
      if (hasAll) return true;
      const categoryScope = `read:${m.category}` as const;
      return allScopes.includes(categoryScope as never);
    });
  }

  generate(platform: Platform, maxTokens = 1500): PassportPack {
    const allowed = this.filterByPermission(
      this.passport.memories,
      this.passport.permissions,
      platform
    );

    const identity = this.passport.identity;
    const lines: string[] = [PLATFORM_PREAMBLES[platform], ''];

    if (identity.name) lines.push(`Name: ${identity.name}`);
    if (identity.role) lines.push(`Role: ${identity.role}`);
    if (identity.timezone) lines.push(`Timezone: ${identity.timezone}`);
    if (identity.language) lines.push(`Preferred language: ${identity.language}`);
    if (lines.length > 2) lines.push('');

    const grouped = new Map<string, MemoryItem[]>();
    for (const m of allowed) {
      const arr = grouped.get(m.category) ?? [];
      arr.push(m);
      grouped.set(m.category, arr);
    }

    for (const [cat, items] of grouped) {
      lines.push(`## ${cat.charAt(0).toUpperCase() + cat.slice(1)}`);
      for (const item of items) {
        lines.push(`- ${item.content}`);
      }
      lines.push('');
    }

    const systemPrompt = lines.join('\n').trim();
    const approxTokens = Math.ceil(systemPrompt.length / 4);

    return PassportPackSchema.parse({
      version: '1.0',
      passportId: this.passport.id,
      generatedAt: new Date().toISOString(),
      platform,
      systemPrompt,
      memories: allowed,
      tokenCount: approxTokens,
    });
  }
}

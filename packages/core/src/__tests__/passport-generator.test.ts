import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { PassportGenerator } from '../passport-generator.js';
import { MemoryStore } from '../memory-store.js';
import type { MemoryItem, MemoryCategory } from '@agent-passport/schema';

function makeApprovedItem(category: MemoryCategory, content: string): MemoryItem {
  const store = new MemoryStore();
  const item = store.add({
    category,
    content,
    source: 'test',
    confidence: 0.9,
    tags: [],
  });
  return store.approve(item.id);
}

describe('PassportGenerator', () => {
  it('generates contextPrompt with correct sections', () => {
    const generator = new PassportGenerator();
    const items = [
      makeApprovedItem('PROFILE', 'Name: Alice'),
      makeApprovedItem('PREFERENCE', 'Prefers dark mode'),
      makeApprovedItem('PROJECT', 'Working on Agent Passport'),
    ];

    const pack = generator.generate({
      items,
      targetPlatform: 'claude',
      scope: 'general',
    });

    assert.ok(pack.contextPrompt.includes('=== Agent Passport Context ==='));
    assert.ok(pack.contextPrompt.includes('=== End Agent Passport ==='));
    assert.ok(pack.contextPrompt.includes('## Profile'));
    assert.ok(pack.contextPrompt.includes('- Name: Alice'));
    assert.ok(pack.contextPrompt.includes('## Preferences'));
    assert.ok(pack.contextPrompt.includes('- Prefers dark mode'));
    assert.ok(pack.contextPrompt.includes('## Project'));
    assert.ok(pack.contextPrompt.includes('- Working on Agent Passport'));
    assert.ok(pack.contextPrompt.includes('Current scope: general'));
  });

  it('only includes categories with items', () => {
    const generator = new PassportGenerator();
    const items = [
      makeApprovedItem('PROFILE', 'Name: Bob'),
    ];

    const pack = generator.generate({
      items,
      targetPlatform: 'chatgpt',
      scope: 'coding',
    });

    assert.ok(pack.contextPrompt.includes('## Profile'));
    assert.ok(!pack.contextPrompt.includes('## Preferences'));
    assert.ok(!pack.contextPrompt.includes('## Project'));
    assert.ok(!pack.contextPrompt.includes('## Decisions'));
    assert.ok(!pack.contextPrompt.includes('## Constraints'));
  });

  it('sets targetPlatform correctly', () => {
    const generator = new PassportGenerator();
    const items = [makeApprovedItem('PROFILE', 'Name: Carol')];

    const pack = generator.generate({
      items,
      targetPlatform: 'gemini',
      scope: 'research',
    });

    assert.equal(pack.targetPlatform, 'gemini');
    assert.equal(pack.scope, 'research');
    assert.ok(pack.generatedAt, 'should have generatedAt timestamp');
    assert.equal(pack.items.length, 1);
  });
});

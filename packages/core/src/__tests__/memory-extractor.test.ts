import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { MemoryExtractor } from '../memory-extractor.js';

describe('MemoryExtractor', () => {
  const extractor = new MemoryExtractor();

  it('extracts "my name is John" as PROFILE', () => {
    const results = extractor.extract('Hi, my name is John and I need help.');

    const profileItems = results.filter((r) => r.category === 'PROFILE');
    assert.ok(profileItems.length >= 1, 'should extract at least one PROFILE item');

    const nameItem = profileItems.find((r) => r.content.includes('John'));
    assert.ok(nameItem, 'should find a name item with John');
    assert.equal(nameItem.confidence, 0.9);
    assert.equal(nameItem.source, 'conversation-extract');
  });

  it('extracts "I prefer dark mode" as PREFERENCE', () => {
    const results = extractor.extract('I prefer dark mode for all editors.');

    const prefItems = results.filter((r) => r.category === 'PREFERENCE');
    assert.ok(prefItems.length >= 1, 'should extract at least one PREFERENCE item');

    const darkMode = prefItems.find((r) => r.content.includes('dark mode'));
    assert.ok(darkMode, 'should find a dark mode preference');
    assert.equal(darkMode.category, 'PREFERENCE');
  });

  it('extracts "working on Agent Passport" as PROJECT', () => {
    const results = extractor.extract(
      "I'm currently working on Agent Passport with my team.",
    );

    const projectItems = results.filter((r) => r.category === 'PROJECT');
    assert.ok(projectItems.length >= 1, 'should extract at least one PROJECT item');

    const passportItem = projectItems.find((r) =>
      r.content.includes('Agent Passport'),
    );
    assert.ok(passportItem, 'should find Agent Passport project');
  });

  it('returns empty array for unrelated text', () => {
    const results = extractor.extract(
      'The weather is nice today. The sky is blue.',
    );
    assert.equal(results.length, 0, 'should return no extractions');
  });

  it('sets source to conversation-extract', () => {
    const results = extractor.extract('my name is Alice');
    for (const item of results) {
      assert.equal(item.source, 'conversation-extract');
    }
  });

  it('extracts decisions', () => {
    const results = extractor.extract("Let's go with React for the frontend.");
    const decisions = results.filter((r) => r.category === 'DECISION');
    assert.ok(decisions.length >= 1, 'should extract at least one DECISION');
  });
});

import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import {
  MemoryItemSchema,
  PassportSchema,
  PassportPackSchema,
  PermissionGrantSchema,
} from '../schemas.js';
import {
  sampleMemoryItem,
  samplePassport,
  samplePassportPack,
  samplePermissionGrant,
} from '../fixtures.js';

// ---------------------------------------------------------------------------
// MemoryItemSchema
// ---------------------------------------------------------------------------

describe('MemoryItemSchema', () => {
  const validItem = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    category: 'PREFERENCE',
    content: 'Prefers dark mode in all editors.',
    source: 'user-stated',
    confidence: 0.85,
    timestamp: '2026-01-10T08:00:00Z',
  };

  it('should accept a valid MemoryItem', () => {
    const result = MemoryItemSchema.safeParse(validItem);
    assert.equal(result.success, true);
  });

  it('should reject a MemoryItem with missing content', () => {
    const invalid = { ...validItem, content: undefined };
    const result = MemoryItemSchema.safeParse(invalid);
    assert.equal(result.success, false);
  });

  it('should reject empty content', () => {
    const invalid = { ...validItem, content: '' };
    const result = MemoryItemSchema.safeParse(invalid);
    assert.equal(result.success, false);
  });

  it('should reject confidence below 0', () => {
    const invalid = { ...validItem, confidence: -0.1 };
    const result = MemoryItemSchema.safeParse(invalid);
    assert.equal(result.success, false);
  });

  it('should reject confidence above 1', () => {
    const invalid = { ...validItem, confidence: 1.5 };
    const result = MemoryItemSchema.safeParse(invalid);
    assert.equal(result.success, false);
  });

  it('should accept confidence at boundaries (0 and 1)', () => {
    const atZero = MemoryItemSchema.safeParse({ ...validItem, confidence: 0 });
    const atOne = MemoryItemSchema.safeParse({ ...validItem, confidence: 1 });
    assert.equal(atZero.success, true);
    assert.equal(atOne.success, true);
  });

  it('should default reviewState to PENDING', () => {
    const result = MemoryItemSchema.parse(validItem);
    assert.equal(result.reviewState, 'PENDING');
  });

  it('should default tags to an empty array', () => {
    const result = MemoryItemSchema.parse(validItem);
    assert.deepEqual(result.tags, []);
  });
});

// ---------------------------------------------------------------------------
// PassportSchema
// ---------------------------------------------------------------------------

describe('PassportSchema', () => {
  const validPassport = {
    id: '660e8400-e29b-41d4-a716-446655440000',
    userId: 'user_abc123',
    items: [],
    createdAt: '2026-03-01T00:00:00Z',
    version: 1,
  };

  it('should accept a valid Passport', () => {
    const result = PassportSchema.safeParse(validPassport);
    assert.equal(result.success, true);
  });

  it('should reject a Passport with non-positive version', () => {
    const invalid = { ...validPassport, version: 0 };
    const result = PassportSchema.safeParse(invalid);
    assert.equal(result.success, false);
  });

  it('should reject a Passport with non-integer version', () => {
    const invalid = { ...validPassport, version: 1.5 };
    const result = PassportSchema.safeParse(invalid);
    assert.equal(result.success, false);
  });
});

// ---------------------------------------------------------------------------
// PassportPackSchema
// ---------------------------------------------------------------------------

describe('PassportPackSchema', () => {
  const validPack = {
    targetPlatform: 'claude' as const,
    scope: 'coding',
    items: [],
    contextPrompt: 'User prefers TypeScript.',
    generatedAt: '2026-04-01T00:00:00Z',
  };

  it('should accept a valid PassportPack', () => {
    const result = PassportPackSchema.safeParse(validPack);
    assert.equal(result.success, true);
  });

  it('should reject an invalid platform', () => {
    const invalid = { ...validPack, targetPlatform: 'alexa' };
    const result = PassportPackSchema.safeParse(invalid);
    assert.equal(result.success, false);
  });

  it('should accept all valid platforms', () => {
    for (const platform of ['chatgpt', 'claude', 'perplexity', 'gemini', 'copilot']) {
      const result = PassportPackSchema.safeParse({ ...validPack, targetPlatform: platform });
      assert.equal(result.success, true, `Platform "${platform}" should be valid`);
    }
  });
});

// ---------------------------------------------------------------------------
// PermissionGrantSchema
// ---------------------------------------------------------------------------

describe('PermissionGrantSchema', () => {
  const validGrant = {
    agentId: 'agent_01',
    allowedCategories: ['PROFILE', 'PREFERENCE'],
  };

  it('should default scope to read', () => {
    const result = PermissionGrantSchema.parse(validGrant);
    assert.equal(result.scope, 'read');
  });

  it('should accept explicit scope values', () => {
    for (const scope of ['read', 'write', 'readwrite']) {
      const result = PermissionGrantSchema.safeParse({ ...validGrant, scope });
      assert.equal(result.success, true, `Scope "${scope}" should be valid`);
    }
  });

  it('should reject invalid scope', () => {
    const invalid = { ...validGrant, scope: 'admin' };
    const result = PermissionGrantSchema.safeParse(invalid);
    assert.equal(result.success, false);
  });

  it('should reject invalid categories', () => {
    const invalid = { ...validGrant, allowedCategories: ['INVALID'] };
    const result = PermissionGrantSchema.safeParse(invalid);
    assert.equal(result.success, false);
  });
});

// ---------------------------------------------------------------------------
// Fixtures validation
// ---------------------------------------------------------------------------

describe('Test fixtures', () => {
  it('sampleMemoryItem validates successfully', () => {
    const result = MemoryItemSchema.safeParse(sampleMemoryItem);
    assert.equal(result.success, true);
  });

  it('samplePassport validates successfully', () => {
    const result = PassportSchema.safeParse(samplePassport);
    assert.equal(result.success, true);
  });

  it('samplePassportPack validates successfully', () => {
    const result = PassportPackSchema.safeParse(samplePassportPack);
    assert.equal(result.success, true);
  });

  it('samplePermissionGrant validates successfully', () => {
    const result = PermissionGrantSchema.safeParse(samplePermissionGrant);
    assert.equal(result.success, true);
  });
});

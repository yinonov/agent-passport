import type { MemoryItem, Passport, PassportPack, PermissionGrant } from './types.js';

// ---------------------------------------------------------------------------
// Sample Memory Items
// ---------------------------------------------------------------------------

const profileItem: MemoryItem = {
  id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  category: 'PROFILE',
  content: 'Software engineer with 8 years of experience, specialising in distributed systems and developer tooling.',
  source: 'user-stated',
  confidence: 0.95,
  timestamp: '2026-01-15T10:30:00Z',
  reviewState: 'APPROVED',
  tags: ['bio', 'career'],
  provenance: {
    platform: 'claude',
    conversationId: 'conv-001',
    extractedAt: '2026-01-15T10:30:00Z',
    model: 'claude-opus-4-20250514',
  },
};

const preferenceItem: MemoryItem = {
  id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  category: 'PREFERENCE',
  content: 'Strongly prefers TypeScript over JavaScript. Always use strict mode and explicit return types.',
  source: 'inferred',
  confidence: 0.9,
  timestamp: '2026-02-10T14:20:00Z',
  reviewState: 'APPROVED',
  tags: ['language', 'typescript', 'coding-style'],
};

const projectItem: MemoryItem = {
  id: 'c3d4e5f6-a7b8-9012-cdef-123456789012',
  category: 'PROJECT',
  content: 'Currently building Agent Passport — a portable memory and permissions layer for AI assistants. Monorepo using pnpm workspaces.',
  source: 'user-stated',
  confidence: 1.0,
  timestamp: '2026-03-01T09:00:00Z',
  reviewState: 'APPROVED',
  tags: ['agent-passport', 'active-project'],
  provenance: {
    platform: 'claude',
    extractedAt: '2026-03-01T09:00:00Z',
  },
};

// ---------------------------------------------------------------------------
// Exported fixtures
// ---------------------------------------------------------------------------

export const sampleMemoryItem: MemoryItem = preferenceItem;

export const samplePassport: Passport = {
  id: 'd4e5f6a7-b8c9-0123-defa-234567890123',
  userId: 'user_2xKj9mPqRs',
  items: [profileItem, preferenceItem, projectItem],
  createdAt: '2026-03-15T08:00:00Z',
  version: 1,
};

export const samplePassportPack: PassportPack = {
  targetPlatform: 'claude',
  scope: 'coding-assistance',
  items: [preferenceItem, projectItem],
  contextPrompt:
    'The user is a senior engineer who prefers TypeScript with strict settings. They are currently working on Agent Passport, a monorepo project.',
  generatedAt: '2026-04-01T12:00:00Z',
};

export const samplePermissionGrant: PermissionGrant = {
  agentId: 'agent_claude_code_01',
  allowedCategories: ['PROFILE', 'PREFERENCE'],
  scope: 'read',
};

import { z } from 'zod';

// ────────────────────────────────────────────────────────────
// MemoryItem — a single piece of user memory
// ────────────────────────────────────────────────────────────
export const MemoryItemSchema = z.object({
  id: z.string().uuid(),
  content: z.string().min(1),
  category: z.enum([
    'identity',
    'preference',
    'skill',
    'project',
    'relationship',
    'goal',
    'context',
    'fact',
  ]),
  tags: z.array(z.string()).default([]),
  source: z.enum(['chatgpt', 'claude', 'perplexity', 'gemini', 'grok', 'manual']),
  confidence: z.number().min(0).max(1).default(1),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  extractedFrom: z.string().optional(),
});

export type MemoryItem = z.infer<typeof MemoryItemSchema>;

// ────────────────────────────────────────────────────────────
// PermissionGrant — scoped access control
// ────────────────────────────────────────────────────────────
export const PermissionGrantSchema = z.object({
  id: z.string().uuid(),
  platform: z.enum(['chatgpt', 'claude', 'perplexity', 'gemini', 'grok', '*']),
  scope: z.array(
    z.enum([
      'read:identity',
      'read:preference',
      'read:skill',
      'read:project',
      'read:relationship',
      'read:goal',
      'read:context',
      'read:fact',
      'read:all',
      'write:memory',
    ])
  ),
  grantedAt: z.string().datetime(),
  expiresAt: z.string().datetime().optional(),
  active: z.boolean().default(true),
});

export type PermissionGrant = z.infer<typeof PermissionGrantSchema>;

// ────────────────────────────────────────────────────────────
// Passport — full user identity document
// ────────────────────────────────────────────────────────────
export const PassportSchema = z.object({
  version: z.literal('1.0'),
  id: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  identity: z.object({
    name: z.string().optional(),
    role: z.string().optional(),
    timezone: z.string().optional(),
    language: z.string().optional(),
  }),
  memories: z.array(MemoryItemSchema),
  permissions: z.array(PermissionGrantSchema),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type Passport = z.infer<typeof PassportSchema>;

// ────────────────────────────────────────────────────────────
// PassportPack — minimal shareable context snapshot
// ────────────────────────────────────────────────────────────
export const PassportPackSchema = z.object({
  version: z.literal('1.0'),
  passportId: z.string().uuid(),
  generatedAt: z.string().datetime(),
  platform: z.enum(['chatgpt', 'claude', 'perplexity', 'gemini', 'grok', 'generic']),
  systemPrompt: z.string(),
  memories: z.array(MemoryItemSchema),
  tokenCount: z.number().int().nonnegative().optional(),
});

export type PassportPack = z.infer<typeof PassportPackSchema>;

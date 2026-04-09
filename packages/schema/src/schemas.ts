import { z } from 'zod';

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const MemoryCategoryEnum = z.enum([
  'PROFILE',
  'PREFERENCE',
  'PROJECT',
  'TASK',
  'DECISION',
  'PERSON',
  'CONSTRAINT',
  'RECURRING',
]);

export const ReviewDecisionEnum = z.enum([
  'APPROVED',
  'REJECTED',
  'EDITED',
  'PENDING',
]);

// ---------------------------------------------------------------------------
// Provenance
// ---------------------------------------------------------------------------

export const ProvenanceSchema = z.object({
  platform: z.string(),
  conversationId: z.string().optional(),
  extractedAt: z.string().datetime(),
  model: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Memory Item
// ---------------------------------------------------------------------------

export const MemoryItemSchema = z.object({
  id: z.string().uuid(),
  category: MemoryCategoryEnum,
  content: z.string().min(1).max(2000),
  source: z.string(),
  confidence: z.number().min(0).max(1),
  timestamp: z.string().datetime(),
  expiry: z.string().datetime().optional(),
  reviewState: ReviewDecisionEnum.default('PENDING'),
  tags: z.array(z.string()).default([]),
  provenance: ProvenanceSchema.optional(),
});

// ---------------------------------------------------------------------------
// Passport
// ---------------------------------------------------------------------------

export const PassportSchema = z.object({
  id: z.string().uuid(),
  userId: z.string(),
  items: z.array(MemoryItemSchema),
  createdAt: z.string().datetime(),
  version: z.number().int().positive(),
  signature: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Passport Pack
// ---------------------------------------------------------------------------

export const PassportPackSchema = z.object({
  targetPlatform: z.enum([
    'chatgpt',
    'claude',
    'perplexity',
    'gemini',
    'copilot',
  ]),
  scope: z.string(),
  items: z.array(MemoryItemSchema),
  contextPrompt: z.string(),
  generatedAt: z.string().datetime(),
});

// ---------------------------------------------------------------------------
// Permission Grant
// ---------------------------------------------------------------------------

export const PermissionGrantSchema = z.object({
  agentId: z.string(),
  allowedCategories: z.array(MemoryCategoryEnum),
  expiresAt: z.string().datetime().optional(),
  scope: z.enum(['read', 'write', 'readwrite']).default('read'),
});

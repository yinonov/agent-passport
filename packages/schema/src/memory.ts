import { z } from 'zod';

export enum MemoryCategory {
  PROFILE = 'PROFILE',
  PREFERENCE = 'PREFERENCE',
  PROJECT = 'PROJECT',
  TASK = 'TASK',
  DECISION = 'DECISION',
  PERSON = 'PERSON',
  CONSTRAINT = 'CONSTRAINT',
  RECURRING = 'RECURRING',
}

export enum ReviewState {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  EDITED = 'EDITED',
}

export enum ReviewDecision {
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  EDIT = 'EDIT',
}

export const ProvenanceSchema = z.object({
  platform: z.string(),
  sessionId: z.string().optional(),
  extractedAt: z.string().datetime(),
  rawSnippet: z.string().optional(),
});

export type Provenance = z.infer<typeof ProvenanceSchema>;

export const MemoryItemSchema = z.object({
  id: z.string().uuid(),
  category: z.nativeEnum(MemoryCategory),
  content: z.string().min(1).max(2000),
  source: z.string(),
  confidence: z.number().min(0).max(1),
  timestamp: z.string().datetime(),
  expiry: z.string().datetime().optional(),
  reviewState: z.nativeEnum(ReviewState).default(ReviewState.PENDING),
  tags: z.array(z.string()).default([]),
  provenance: ProvenanceSchema,
});

export type MemoryItem = z.infer<typeof MemoryItemSchema>;

export const MemoryItemCreateSchema = MemoryItemSchema.omit({
  id: true,
  timestamp: true,
  reviewState: true,
}).extend({
  reviewState: z.nativeEnum(ReviewState).optional(),
});

export type MemoryItemCreate = z.infer<typeof MemoryItemCreateSchema>;

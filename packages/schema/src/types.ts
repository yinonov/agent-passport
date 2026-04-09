import { z } from 'zod';
import {
  MemoryCategoryEnum,
  ReviewDecisionEnum,
  ProvenanceSchema,
  MemoryItemSchema,
  PassportSchema,
  PassportPackSchema,
  PermissionGrantSchema,
} from './schemas.js';

// ---------------------------------------------------------------------------
// Inferred types
// ---------------------------------------------------------------------------

export type Provenance = z.infer<typeof ProvenanceSchema>;
export type MemoryItem = z.infer<typeof MemoryItemSchema>;
export type Passport = z.infer<typeof PassportSchema>;
export type PassportPack = z.infer<typeof PassportPackSchema>;
export type PermissionGrant = z.infer<typeof PermissionGrantSchema>;

// ---------------------------------------------------------------------------
// Enum type unions
// ---------------------------------------------------------------------------

export type MemoryCategory = z.infer<typeof MemoryCategoryEnum>;
export type ReviewDecision = z.infer<typeof ReviewDecisionEnum>;

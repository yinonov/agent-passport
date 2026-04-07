import { z } from 'zod';
import { MemoryItemSchema } from './memory.js';

export const PassportSchema = z.object({
  version: z.string().default('1'),
  owner: z.object({
    id: z.string().uuid(),
    alias: z.string().optional(),
  }),
  memories: z.array(MemoryItemSchema),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  checksum: z.string().optional(),
});

export type Passport = z.infer<typeof PassportSchema>;

export const PassportPackSchema = z.object({
  passport: PassportSchema,
  signature: z.string().optional(),
  exportedAt: z.string().datetime(),
  format: z.enum(['json', 'compressed']).default('json'),
});

export type PassportPack = z.infer<typeof PassportPackSchema>;

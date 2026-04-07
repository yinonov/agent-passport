import { z } from 'zod';
import { MemoryCategory } from './memory.js';

export const PermissionGrantSchema = z.object({
  id: z.string().uuid(),
  grantedTo: z.string(),
  categories: z.array(z.nativeEnum(MemoryCategory)),
  scopes: z.array(z.enum(['read', 'write', 'inject'])),
  expiresAt: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
  revoked: z.boolean().default(false),
});

export type PermissionGrant = z.infer<typeof PermissionGrantSchema>;

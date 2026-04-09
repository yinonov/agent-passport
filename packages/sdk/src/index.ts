// ---------------------------------------------------------------------------
// SDK modules
// ---------------------------------------------------------------------------

export { PassportClient } from './passport-client.js';
export type { PassportClientOptions, GetContextOptions } from './passport-client.js';

export {
  findPassportFile,
  readPassportFile,
  writePassportFile,
  createPassportFile,
} from './passport-file.js';

export {
  passportMiddleware,
  getSystemMessage,
  withPassportContext,
} from './middleware.js';
export type { GetSystemMessageOptions } from './middleware.js';

// ---------------------------------------------------------------------------
// Re-export key types from @agent-passport/schema for convenience
// ---------------------------------------------------------------------------

export type {
  MemoryItem,
  MemoryCategory,
  Passport,
  PassportPack,
  PermissionGrant,
  Provenance,
  ReviewDecision,
} from '@agent-passport/schema';

export {
  MemoryItemSchema,
  PassportSchema,
  MemoryCategoryEnum,
} from '@agent-passport/schema';

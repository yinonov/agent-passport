import type { MemoryCategory } from '@agent-passport/schema';
import { PassportClient } from './passport-client.js';

// ---------------------------------------------------------------------------
// Express / Connect middleware
// ---------------------------------------------------------------------------

/**
 * Express/Connect-style middleware that loads the Agent Passport and
 * attaches the context string to `req.passportContext`.
 *
 * The passport is loaded once and cached for subsequent requests.
 *
 * @example
 * ```ts
 * import express from 'express';
 * import { passportMiddleware } from '@agent-passport/sdk';
 *
 * const app = express();
 * app.use(passportMiddleware());
 *
 * app.get('/chat', (req, res) => {
 *   const context = (req as any).passportContext;
 *   // use context in your LLM call...
 * });
 * ```
 */
export function passportMiddleware(
  options?: { passportPath?: string },
): (req: any, res: any, next: any) => void {
  let cachedContext: string | null = null;
  let loadError: Error | null = null;

  const client = new PassportClient({
    passportPath: options?.passportPath,
  });

  // Pre-load the passport asynchronously so it's ready for the first request
  const loadPromise = client
    .load()
    .then(() => {
      cachedContext = client.getContext();
    })
    .catch((err: unknown) => {
      loadError = err instanceof Error ? err : new Error(String(err));
    });

  return (req: any, _res: any, next: any) => {
    if (cachedContext !== null) {
      req.passportContext = cachedContext;
      next();
      return;
    }

    // If still loading, wait for it
    loadPromise
      .then(() => {
        if (loadError) {
          req.passportContext = null;
          req.passportError = loadError;
        } else {
          req.passportContext = cachedContext;
        }
        next();
      })
      .catch(() => {
        req.passportContext = null;
        next();
      });
  };
}

// ---------------------------------------------------------------------------
// LLM helpers
// ---------------------------------------------------------------------------

export interface GetSystemMessageOptions {
  passportPath?: string;
  scope?: string;
  categories?: MemoryCategory[];
}

/**
 * Get passport context as a system message string for LLM API calls.
 *
 * @example
 * ```ts
 * const systemMsg = await getSystemMessage({ scope: 'code-review' });
 * const response = await openai.chat.completions.create({
 *   messages: [{ role: 'system', content: systemMsg }, ...userMessages],
 * });
 * ```
 */
export async function getSystemMessage(
  options?: GetSystemMessageOptions,
): Promise<string> {
  const client = new PassportClient({
    passportPath: options?.passportPath,
  });
  await client.load();

  return client.getContext({
    scope: options?.scope,
    categories: options?.categories,
  });
}

/**
 * Enhance an LLM messages array by prepending passport context as
 * a system message.
 *
 * If the first message already has `role: 'system'`, the passport
 * context is prepended to its content rather than adding a new message.
 *
 * @example
 * ```ts
 * const messages = [{ role: 'user', content: 'Help me refactor this code' }];
 * const enhanced = await withPassportContext(messages);
 * ```
 */
export async function withPassportContext(
  messages: Array<{ role: string; content: string }>,
  options?: { passportPath?: string; scope?: string },
): Promise<Array<{ role: string; content: string }>> {
  const context = await getSystemMessage({
    passportPath: options?.passportPath,
    scope: options?.scope,
  });

  if (!context) {
    return messages;
  }

  const result = [...messages];

  if (result.length > 0 && result[0].role === 'system') {
    // Merge with existing system message
    result[0] = {
      ...result[0],
      content: context + '\n\n' + result[0].content,
    };
  } else {
    // Prepend as new system message
    result.unshift({ role: 'system', content: context });
  }

  return result;
}

import fs from 'node:fs';
import path from 'node:path';
import { MemoryItemSchema } from '@agent-passport/schema';
import type { MemoryItem } from '@agent-passport/schema';

const PASSPORT_FILENAME = '.agentpassport';

/**
 * Walk up from startDir looking for a `.agentpassport` file,
 * similar to how Node resolves `package.json`.
 *
 * @param startDir Directory to start searching from. Defaults to `process.cwd()`.
 * @returns Absolute path to the passport file, or `null` if none found.
 */
export function findPassportFile(startDir?: string): string | null {
  let dir = path.resolve(startDir ?? process.cwd());

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const candidate = path.join(dir, PASSPORT_FILENAME);
    if (fs.existsSync(candidate)) {
      return candidate;
    }

    const parent = path.dirname(dir);
    if (parent === dir) {
      // Reached filesystem root
      return null;
    }
    dir = parent;
  }
}

/**
 * Read and parse a passport file. Each item is validated against the
 * `MemoryItemSchema` and invalid entries are silently skipped.
 *
 * @param filePath Absolute path to the passport file.
 * @returns Array of validated `MemoryItem` objects.
 * @throws If the file cannot be read or does not contain a JSON array.
 */
export function readPassportFile(filePath: string): MemoryItem[] {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const parsed: unknown = JSON.parse(raw);

  if (!Array.isArray(parsed)) {
    throw new Error(
      `Expected passport file to contain a JSON array, got ${typeof parsed}`,
    );
  }

  const items: MemoryItem[] = [];
  for (const entry of parsed) {
    const result = MemoryItemSchema.safeParse(entry);
    if (result.success) {
      items.push(result.data);
    }
  }
  return items;
}

/**
 * Write memory items to a passport file as pretty-printed JSON.
 *
 * @param filePath Absolute path to the passport file.
 * @param items Array of `MemoryItem` objects to write.
 */
export function writePassportFile(filePath: string, items: MemoryItem[]): void {
  const json = JSON.stringify(items, null, 2);
  fs.writeFileSync(filePath, json, 'utf-8');
}

/**
 * Create a new `.agentpassport` file in the given directory.
 *
 * @param dir Directory where the file should be created.
 * @param items Initial memory items for the file.
 * @returns The absolute path to the newly created file.
 */
export function createPassportFile(dir: string, items: MemoryItem[]): string {
  const filePath = path.join(path.resolve(dir), PASSPORT_FILENAME);
  writePassportFile(filePath, items);
  return filePath;
}

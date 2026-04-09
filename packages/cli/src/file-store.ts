import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { MemoryStore } from '@agent-passport/core';

const DEFAULT_DIR = path.join(os.homedir(), '.agent-passport');
const DEFAULT_FILE = path.join(DEFAULT_DIR, 'passport.json');

export class FileStore {
  private store: MemoryStore;
  private filePath: string;

  constructor(filePath?: string) {
    this.store = new MemoryStore();
    this.filePath = filePath ?? DEFAULT_FILE;
  }

  /** Return the underlying MemoryStore */
  getStore(): MemoryStore {
    return this.store;
  }

  /** Return the file path used for persistence */
  getFilePath(): string {
    return this.filePath;
  }

  /** Load memories from disk into the store (creates dir/file if missing) */
  async load(): Promise<void> {
    const dir = path.dirname(this.filePath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, '[]', 'utf-8');
      return;
    }

    const raw = fs.readFileSync(this.filePath, 'utf-8');
    const trimmed = raw.trim();
    if (trimmed === '' || trimmed === '[]') {
      return;
    }

    this.store.import(raw);
  }

  /** Persist current store contents to disk */
  async save(): Promise<void> {
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(this.filePath, this.store.export(), 'utf-8');
  }
}

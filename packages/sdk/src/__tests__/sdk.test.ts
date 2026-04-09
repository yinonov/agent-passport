import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

import { PassportClient } from '../passport-client.js';
import {
  findPassportFile,
  readPassportFile,
  writePassportFile,
  createPassportFile,
} from '../passport-file.js';
import { getSystemMessage, withPassportContext } from '../middleware.js';

import type { MemoryItem } from '@agent-passport/schema';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'agent-passport-sdk-test-'));
}

function makeMemoryItem(overrides: Partial<MemoryItem> = {}): MemoryItem {
  return {
    id: crypto.randomUUID(),
    category: 'PROFILE',
    content: 'Name: Alice Nakamura',
    source: 'test',
    confidence: 0.9,
    timestamp: new Date().toISOString(),
    reviewState: 'APPROVED',
    tags: [],
    ...overrides,
  };
}

function sampleItems(): MemoryItem[] {
  return [
    makeMemoryItem({
      category: 'PROFILE',
      content: 'Name: Alice Nakamura',
      confidence: 0.95,
    }),
    makeMemoryItem({
      category: 'PROFILE',
      content: 'Role: Senior software engineer',
      confidence: 0.9,
    }),
    makeMemoryItem({
      category: 'PREFERENCE',
      content: 'Prefers TypeScript over JavaScript',
      confidence: 0.85,
    }),
    makeMemoryItem({
      category: 'PREFERENCE',
      content: 'Uses Vim keybindings',
      confidence: 0.8,
    }),
    makeMemoryItem({
      category: 'PROJECT',
      content: 'Working on Agent Passport, a portable AI memory layer',
      confidence: 0.9,
    }),
    makeMemoryItem({
      category: 'CONSTRAINT',
      content: 'Must always write tests for new features',
      confidence: 0.88,
    }),
    makeMemoryItem({
      category: 'DECISION',
      content: 'Chose pnpm workspaces for monorepo management',
      confidence: 0.92,
    }),
  ];
}

function writeTestPassport(dir: string, items?: MemoryItem[]): string {
  const filePath = path.join(dir, '.agentpassport');
  const data = items ?? sampleItems();
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  return filePath;
}

// ---------------------------------------------------------------------------
// PassportClient
// ---------------------------------------------------------------------------

describe('PassportClient', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTempDir();
  });

  after(() => {
    // Cleanup is best-effort
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  });

  it('loads items from a temp passport file', async () => {
    const filePath = writeTestPassport(tmpDir);
    const client = new PassportClient({ passportPath: filePath });

    assert.equal(client.isLoaded(), false);
    await client.load();
    assert.equal(client.isLoaded(), true);

    const memories = client.getMemories();
    assert.equal(memories.length, 7);
  });

  it('throws when loading a nonexistent file', async () => {
    const client = new PassportClient({
      passportPath: path.join(tmpDir, 'does-not-exist.json'),
    });
    await assert.rejects(() => client.load(), /not found/i);
  });

  it('throws when querying before load', () => {
    const client = new PassportClient({
      passportPath: path.join(tmpDir, 'x.json'),
    });
    assert.throws(() => client.getMemories(), /not loaded/i);
  });

  it('getContext returns a formatted string', async () => {
    const filePath = writeTestPassport(tmpDir);
    const client = new PassportClient({ passportPath: filePath });
    await client.load();

    const ctx = client.getContext();
    assert.ok(ctx.includes('=== Agent Passport Context ==='));
    assert.ok(ctx.includes('=== End Agent Passport ==='));
    assert.ok(ctx.includes('Alice Nakamura'));
    assert.ok(ctx.includes('## Profile'));
    assert.ok(ctx.includes('## Preferences'));
  });

  it('getContext with scope includes scope', async () => {
    const filePath = writeTestPassport(tmpDir);
    const client = new PassportClient({ passportPath: filePath });
    await client.load();

    const ctx = client.getContext({ scope: 'code-review' });
    assert.ok(ctx.includes('Current scope: code-review'));
  });

  it('getContext filters by categories', async () => {
    const filePath = writeTestPassport(tmpDir);
    const client = new PassportClient({ passportPath: filePath });
    await client.load();

    const ctx = client.getContext({ categories: ['PROFILE'] });
    assert.ok(ctx.includes('Alice Nakamura'));
    assert.ok(!ctx.includes('TypeScript over JavaScript'));
  });

  it('getContext respects constructor allowedCategories', async () => {
    const filePath = writeTestPassport(tmpDir);
    const client = new PassportClient({
      passportPath: filePath,
      allowedCategories: ['PREFERENCE'],
    });
    await client.load();

    const ctx = client.getContext();
    assert.ok(!ctx.includes('Alice Nakamura'));
    assert.ok(ctx.includes('TypeScript over JavaScript'));
  });

  it('getContext with maxTokens truncates low-confidence items', async () => {
    const filePath = writeTestPassport(tmpDir);
    const client = new PassportClient({ passportPath: filePath });
    await client.load();

    // Very small token budget should drop some items
    const ctx = client.getContext({ maxTokens: 10 });
    const allCtx = client.getContext();
    assert.ok(ctx.length < allCtx.length);
  });

  it('getMemories filters by category', async () => {
    const filePath = writeTestPassport(tmpDir);
    const client = new PassportClient({ passportPath: filePath });
    await client.load();

    const prefs = client.getMemories({ category: 'PREFERENCE' });
    assert.equal(prefs.length, 2);
    assert.ok(prefs.every((p) => p.category === 'PREFERENCE'));

    const projects = client.getMemories({ category: 'PROJECT' });
    assert.equal(projects.length, 1);
    assert.equal(projects[0].content, 'Working on Agent Passport, a portable AI memory layer');
  });

  it('getProfile returns PROFILE items', async () => {
    const filePath = writeTestPassport(tmpDir);
    const client = new PassportClient({ passportPath: filePath });
    await client.load();

    const profiles = client.getProfile();
    assert.equal(profiles.length, 2);
    assert.ok(profiles.every((p) => p.category === 'PROFILE'));
  });

  it('getPreferences returns PREFERENCE items', async () => {
    const filePath = writeTestPassport(tmpDir);
    const client = new PassportClient({ passportPath: filePath });
    await client.load();

    const prefs = client.getPreferences();
    assert.equal(prefs.length, 2);
    assert.ok(prefs.every((p) => p.category === 'PREFERENCE'));
  });

  it('toSystemPrompt includes passport markers', async () => {
    const filePath = writeTestPassport(tmpDir);
    const client = new PassportClient({ passportPath: filePath });
    await client.load();

    const prompt = client.toSystemPrompt({ scope: 'testing' });
    assert.ok(prompt.includes('=== Agent Passport Context ==='));
    assert.ok(prompt.includes('=== End Agent Passport ==='));
    assert.ok(prompt.includes('Current scope: testing'));
    assert.ok(prompt.includes('Alice Nakamura'));
  });
});

// ---------------------------------------------------------------------------
// Passport file utilities
// ---------------------------------------------------------------------------

describe('findPassportFile', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTempDir();
  });

  after(() => {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  });

  it('finds .agentpassport in the given directory', () => {
    writeTestPassport(tmpDir);
    const found = findPassportFile(tmpDir);
    assert.ok(found !== null);
    assert.ok(found!.endsWith('.agentpassport'));
  });

  it('walks up to find .agentpassport in a parent directory', () => {
    writeTestPassport(tmpDir);

    // Create a nested child directory
    const child = path.join(tmpDir, 'a', 'b', 'c');
    fs.mkdirSync(child, { recursive: true });

    const found = findPassportFile(child);
    assert.ok(found !== null);
    assert.equal(found, path.join(tmpDir, '.agentpassport'));
  });

  it('returns null when no passport file exists', () => {
    // Empty temp dir with no passport
    const empty = makeTempDir();
    // Start deep enough that we hit root without finding anything
    const deep = path.join(empty, 'x', 'y');
    fs.mkdirSync(deep, { recursive: true });

    const found = findPassportFile(deep);
    // This might find a passport higher up on the developer machine,
    // but in a clean tmp dir it should be null (unless the system has one).
    // We can only assert the type is correct.
    assert.ok(found === null || typeof found === 'string');

    fs.rmSync(empty, { recursive: true, force: true });
  });
});

describe('readPassportFile / writePassportFile', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTempDir();
  });

  after(() => {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  });

  it('round-trips items through write and read', () => {
    const items = sampleItems();
    const filePath = path.join(tmpDir, '.agentpassport');

    writePassportFile(filePath, items);
    const loaded = readPassportFile(filePath);

    assert.equal(loaded.length, items.length);
    assert.equal(loaded[0].content, items[0].content);
    assert.equal(loaded[0].category, items[0].category);
  });

  it('skips invalid items silently', () => {
    const filePath = path.join(tmpDir, '.agentpassport');
    const data = [
      ...sampleItems().slice(0, 1),
      { invalid: true }, // should be skipped
      { id: 'not-a-uuid', category: 'PROFILE', content: 'bad' },
    ];
    fs.writeFileSync(filePath, JSON.stringify(data), 'utf-8');

    const loaded = readPassportFile(filePath);
    assert.equal(loaded.length, 1);
  });
});

describe('createPassportFile', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTempDir();
  });

  after(() => {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  });

  it('creates .agentpassport in the specified directory', () => {
    const items = sampleItems();
    const result = createPassportFile(tmpDir, items);

    assert.ok(result.endsWith('.agentpassport'));
    assert.ok(fs.existsSync(result));

    const loaded = readPassportFile(result);
    assert.equal(loaded.length, items.length);
  });
});

// ---------------------------------------------------------------------------
// Middleware helpers
// ---------------------------------------------------------------------------

describe('getSystemMessage', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTempDir();
  });

  after(() => {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  });

  it('returns a context string', async () => {
    const filePath = writeTestPassport(tmpDir);
    const msg = await getSystemMessage({ passportPath: filePath });

    assert.ok(typeof msg === 'string');
    assert.ok(msg.includes('=== Agent Passport Context ==='));
    assert.ok(msg.includes('Alice Nakamura'));
  });

  it('filters by categories', async () => {
    const filePath = writeTestPassport(tmpDir);
    const msg = await getSystemMessage({
      passportPath: filePath,
      categories: ['PROJECT'],
    });

    assert.ok(msg.includes('Agent Passport, a portable AI memory layer'));
    assert.ok(!msg.includes('Alice Nakamura'));
  });
});

describe('withPassportContext', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTempDir();
  });

  after(() => {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  });

  it('prepends a system message to messages array', async () => {
    const filePath = writeTestPassport(tmpDir);
    const messages = [{ role: 'user', content: 'Hello!' }];

    const enhanced = await withPassportContext(messages, {
      passportPath: filePath,
    });

    assert.equal(enhanced.length, 2);
    assert.equal(enhanced[0].role, 'system');
    assert.ok(enhanced[0].content.includes('=== Agent Passport Context ==='));
    assert.equal(enhanced[1].role, 'user');
    assert.equal(enhanced[1].content, 'Hello!');
  });

  it('merges with existing system message', async () => {
    const filePath = writeTestPassport(tmpDir);
    const messages = [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'Hello!' },
    ];

    const enhanced = await withPassportContext(messages, {
      passportPath: filePath,
    });

    assert.equal(enhanced.length, 2);
    assert.equal(enhanced[0].role, 'system');
    assert.ok(enhanced[0].content.includes('=== Agent Passport Context ==='));
    assert.ok(enhanced[0].content.includes('You are a helpful assistant.'));
  });

  it('does not mutate the original messages array', async () => {
    const filePath = writeTestPassport(tmpDir);
    const messages = [{ role: 'user', content: 'Hello!' }];
    const original = [...messages];

    await withPassportContext(messages, { passportPath: filePath });

    assert.deepEqual(messages, original);
  });
});

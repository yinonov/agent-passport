import { MemoryStore } from '@agent-passport/core';
import { PassportGenerator } from '@agent-passport/core';
import type { MemoryItem } from '@agent-passport/schema';

// ── Message types ────────────────────────────────────────────
type Msg =
  | { type: 'GET_PASSPORT' }
  | { type: 'GET_MEMORIES' }
  | { type: 'ADD_MEMORY'; item: Omit<MemoryItem, 'id' | 'createdAt' | 'updatedAt'> }
  | { type: 'REMOVE_MEMORY'; id: string }
  | { type: 'GENERATE_PACK'; platform: string }
  | { type: 'SAVE_PASSPORT'; passport: unknown };

// ── Singleton store ──────────────────────────────────────────
let store: MemoryStore | null = null;

async function getStore(): Promise<MemoryStore> {
  if (store) return store;
  const data = await chrome.storage.local.get('passport');
  store = data['passport'] ? MemoryStore.fromJSON(data['passport']) : new MemoryStore();
  return store;
}

async function saveStore(s: MemoryStore): Promise<void> {
  await chrome.storage.local.set({ passport: s.toJSON() });
}

// ── Message handler ──────────────────────────────────────────
chrome.runtime.onMessage.addListener(
  (msg: Msg, _sender, sendResponse: (r: unknown) => void) => {
    void (async () => {
      const s = await getStore();

      if (msg.type === 'GET_PASSPORT') {
        sendResponse({ ok: true, data: s.toJSON() });
      } else if (msg.type === 'GET_MEMORIES') {
        sendResponse({ ok: true, data: s.getAll() });
      } else if (msg.type === 'ADD_MEMORY') {
        const item = s.add(msg.item);
        await saveStore(s);
        sendResponse({ ok: true, data: item });
      } else if (msg.type === 'REMOVE_MEMORY') {
        const removed = s.remove(msg.id);
        if (removed) await saveStore(s);
        sendResponse({ ok: true, data: removed });
      } else if (msg.type === 'GENERATE_PACK') {
        const passport = s.toJSON();
        const gen = new PassportGenerator(passport);
        const pack = gen.generate(msg.platform as Parameters<PassportGenerator['generate']>[0]);
        sendResponse({ ok: true, data: pack });
      } else if (msg.type === 'SAVE_PASSPORT') {
        store = MemoryStore.fromJSON(msg.passport);
        await saveStore(store);
        sendResponse({ ok: true });
      } else {
        sendResponse({ ok: false, error: 'Unknown message type' });
      }
    })();
    return true; // keep channel open for async
  }
);

console.log('[Agent Passport] background service worker ready');

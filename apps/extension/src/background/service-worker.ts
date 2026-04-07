import { MemoryStore, MemoryExtractor } from '@agent-passport/core';
import type { MemoryItem, MemoryItemCreate } from '@agent-passport/schema';

type MessageSender = chrome.runtime.MessageSender;
type SendResponse = (response?: unknown) => void;

interface ExtractMemoryMessage {
  type: 'EXTRACT_MEMORY';
  text: string;
  platform: string;
}

interface ApproveMemoryMessage {
  type: 'APPROVE_MEMORY';
  id: string;
}

interface RejectMemoryMessage {
  type: 'REJECT_MEMORY';
  id: string;
}

interface EditMemoryMessage {
  type: 'EDIT_MEMORY';
  id: string;
  patch: Partial<Pick<MemoryItem, 'content' | 'tags' | 'category'>>;
}

interface ExportPassportMessage {
  type: 'EXPORT_PASSPORT';
}

interface ImportPassportMessage {
  type: 'IMPORT_PASSPORT';
  json: string;
}

interface GetPendingCountMessage {
  type: 'GET_PENDING_COUNT';
}

interface GetAllMemoriesMessage {
  type: 'GET_ALL_MEMORIES';
}

type ExtensionMessage =
  | ExtractMemoryMessage
  | ApproveMemoryMessage
  | RejectMemoryMessage
  | EditMemoryMessage
  | ExportPassportMessage
  | ImportPassportMessage
  | GetPendingCountMessage
  | GetAllMemoriesMessage;

const extractor = new MemoryExtractor();
let store: MemoryStore = new MemoryStore();

async function loadStore(): Promise<void> {
  const result = await chrome.storage.local.get('memoryStore');
  if (result['memoryStore']) {
    try {
      store = MemoryStore.fromJSON(result['memoryStore'] as string);
    } catch {
      store = new MemoryStore();
    }
  }
}

async function saveStore(): Promise<void> {
  await chrome.storage.local.set({ memoryStore: store.toJSON() });
  await updateBadge();
}

async function updateBadge(): Promise<void> {
  const pending = store.getPending();
  const count = pending.length;
  await chrome.action.setBadgeText({ text: count > 0 ? String(count) : '' });
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.action.setBadgeBackgroundColor({ color: '#6C63FF' });
  loadStore();
});

loadStore();

chrome.runtime.onMessage.addListener(
  (
    message: ExtensionMessage,
    _sender: MessageSender,
    sendResponse: SendResponse,
  ) => {
    handleMessage(message, sendResponse);
    return true;
  },
);

function handleMessage(
  message: ExtensionMessage,
  sendResponse: SendResponse,
): void {
  switch (message.type) {
    case 'EXTRACT_MEMORY': {
      const items: MemoryItemCreate[] = extractor.extract(
        message.text,
        message.platform,
      );
      for (const item of items) {
        store.add(item);
      }
      saveStore().then(() => {
        sendResponse({ success: true, count: items.length });
      });
      break;
    }

    case 'APPROVE_MEMORY': {
      try {
        const item = store.approve(message.id);
        saveStore().then(() => sendResponse({ success: true, item }));
      } catch (e) {
        sendResponse({ success: false, error: String(e) });
      }
      break;
    }

    case 'REJECT_MEMORY': {
      try {
        const item = store.reject(message.id);
        saveStore().then(() => sendResponse({ success: true, item }));
      } catch (e) {
        sendResponse({ success: false, error: String(e) });
      }
      break;
    }

    case 'EDIT_MEMORY': {
      try {
        const item = store.edit(message.id, message.patch);
        saveStore().then(() => sendResponse({ success: true, item }));
      } catch (e) {
        sendResponse({ success: false, error: String(e) });
      }
      break;
    }

    case 'EXPORT_PASSPORT': {
      const passport = store.export();
      const pack = {
        passport,
        exportedAt: new Date().toISOString(),
        format: 'json' as const,
      };
      sendResponse({ success: true, json: JSON.stringify(pack, null, 2) });
      break;
    }

    case 'IMPORT_PASSPORT': {
      try {
        const pack = JSON.parse(message.json) as Parameters<
          typeof store.importPassport
        >[0];
        store.importPassport(pack);
        saveStore().then(() => sendResponse({ success: true }));
      } catch (e) {
        sendResponse({ success: false, error: String(e) });
      }
      break;
    }

    case 'GET_PENDING_COUNT': {
      sendResponse({ count: store.getPending().length });
      break;
    }

    case 'GET_ALL_MEMORIES': {
      sendResponse({
        pending: store.getPending(),
        approved: store.getApproved(),
      });
      break;
    }

    default:
      sendResponse({ success: false, error: 'Unknown message type' });
  }
}

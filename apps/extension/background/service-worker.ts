// ─── Types ──────────────────────────────────────────────────────────────────

type MemoryState = 'PENDING' | 'APPROVED' | 'REJECTED' | 'EDITED';

type MemoryCategory = 'PROFILE' | 'PREFERENCE' | 'PROJECT' | 'DECISION' | 'GENERAL';

interface Memory {
  id: string;
  content: string;
  category: MemoryCategory;
  state: MemoryState;
  platform: string;
  timestamp: number;
  updatedAt: number;
}

interface PassportStats {
  totalMemories: number;
  pendingCount: number;
  approvedCount: number;
  platformsSeen: string[];
}

type MessageType =
  | 'ADD_MEMORY'
  | 'GET_MEMORIES'
  | 'APPROVE_MEMORY'
  | 'REJECT_MEMORY'
  | 'EDIT_MEMORY'
  | 'EXPORT_PASSPORT'
  | 'IMPORT_PASSPORT'
  | 'GET_STATS'
  | 'INJECT_CONTEXT';

interface Message {
  type: MessageType;
  payload?: unknown;
}

// ─── Storage helpers ────────────────────────────────────────────────────────

const STORAGE_KEY = 'passport_memories';

async function getMemories(): Promise<Memory[]> {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  return (result[STORAGE_KEY] as Memory[]) ?? [];
}

async function setMemories(memories: Memory[]): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEY]: memories });
  await updateBadge(memories);
}

async function updateBadge(memories?: Memory[]): Promise<void> {
  const items = memories ?? (await getMemories());
  const pendingCount = items.filter((m) => m.state === 'PENDING').length;
  const text = pendingCount > 0 ? String(pendingCount) : '';
  await chrome.action.setBadgeText({ text });
  await chrome.action.setBadgeBackgroundColor({ color: '#6C63FF' });
}

// ─── Message handler ────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener(
  (
    message: Message,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: unknown) => void,
  ) => {
    handleMessage(message)
      .then(sendResponse)
      .catch((err) => sendResponse({ error: String(err) }));
    return true; // keep channel open for async response
  },
);

async function handleMessage(message: Message): Promise<unknown> {
  switch (message.type) {
    case 'ADD_MEMORY':
      return handleAddMemory(message.payload as {
        content: string;
        category: MemoryCategory;
        platform: string;
      });

    case 'GET_MEMORIES':
      return handleGetMemories(message.payload as { state?: MemoryState } | undefined);

    case 'APPROVE_MEMORY':
      return handleUpdateState(
        (message.payload as { id: string }).id,
        'APPROVED',
      );

    case 'REJECT_MEMORY':
      return handleUpdateState(
        (message.payload as { id: string }).id,
        'REJECTED',
      );

    case 'EDIT_MEMORY':
      return handleEditMemory(
        message.payload as { id: string; content: string },
      );

    case 'EXPORT_PASSPORT':
      return handleExport();

    case 'IMPORT_PASSPORT':
      return handleImport(message.payload as { data: string });

    case 'GET_STATS':
      return handleGetStats();

    case 'INJECT_CONTEXT':
      return handleInjectContext(
        message.payload as { categories?: MemoryCategory[] },
      );

    default:
      return { error: `Unknown message type: ${(message as Message).type}` };
  }
}

// ─── Handlers ───────────────────────────────────────────────────────────────

async function handleAddMemory(payload: {
  content: string;
  category: MemoryCategory;
  platform: string;
}): Promise<{ success: boolean; id: string }> {
  const memories = await getMemories();
  const id = crypto.randomUUID();
  const now = Date.now();

  const memory: Memory = {
    id,
    content: payload.content,
    category: payload.category,
    state: 'PENDING',
    platform: payload.platform,
    timestamp: now,
    updatedAt: now,
  };

  memories.push(memory);
  await setMemories(memories);
  return { success: true, id };
}

async function handleGetMemories(
  payload?: { state?: MemoryState },
): Promise<Memory[]> {
  const memories = await getMemories();
  if (payload?.state) {
    return memories.filter((m) => m.state === payload.state);
  }
  return memories;
}

async function handleUpdateState(
  id: string,
  state: MemoryState,
): Promise<{ success: boolean }> {
  const memories = await getMemories();
  const idx = memories.findIndex((m) => m.id === id);
  if (idx === -1) return { success: false };

  memories[idx].state = state;
  memories[idx].updatedAt = Date.now();
  await setMemories(memories);
  return { success: true };
}

async function handleEditMemory(payload: {
  id: string;
  content: string;
}): Promise<{ success: boolean }> {
  const memories = await getMemories();
  const idx = memories.findIndex((m) => m.id === payload.id);
  if (idx === -1) return { success: false };

  memories[idx].content = payload.content;
  memories[idx].state = 'EDITED';
  memories[idx].updatedAt = Date.now();
  await setMemories(memories);
  return { success: true };
}

async function handleExport(): Promise<{ data: string }> {
  const memories = await getMemories();
  const exportable = memories.filter(
    (m) => m.state === 'APPROVED' || m.state === 'EDITED',
  );
  return { data: JSON.stringify(exportable, null, 2) };
}

async function handleImport(payload: {
  data: string;
}): Promise<{ success: boolean; count: number }> {
  let incoming: unknown[];
  try {
    incoming = JSON.parse(payload.data);
  } catch {
    return { success: false, count: 0 };
  }

  if (!Array.isArray(incoming)) return { success: false, count: 0 };

  const validCategories = new Set<string>([
    'PROFILE',
    'PREFERENCE',
    'PROJECT',
    'DECISION',
    'GENERAL',
  ]);
  const validStates = new Set<string>([
    'PENDING',
    'APPROVED',
    'REJECTED',
    'EDITED',
  ]);

  const validated: Memory[] = [];
  for (const item of incoming) {
    if (
      typeof item === 'object' &&
      item !== null &&
      typeof (item as Memory).content === 'string' &&
      typeof (item as Memory).category === 'string' &&
      validCategories.has((item as Memory).category)
    ) {
      const m = item as Partial<Memory>;
      validated.push({
        id: m.id ?? crypto.randomUUID(),
        content: m.content!,
        category: m.category as MemoryCategory,
        state: m.state && validStates.has(m.state) ? m.state : 'APPROVED',
        platform: m.platform ?? 'imported',
        timestamp: m.timestamp ?? Date.now(),
        updatedAt: Date.now(),
      });
    }
  }

  const existing = await getMemories();
  const existingIds = new Set(existing.map((m) => m.id));
  const newItems = validated.filter((m) => !existingIds.has(m.id));
  await setMemories([...existing, ...newItems]);
  return { success: true, count: newItems.length };
}

async function handleGetStats(): Promise<PassportStats> {
  const memories = await getMemories();
  const platformSet = new Set<string>();
  let pendingCount = 0;
  let approvedCount = 0;

  for (const m of memories) {
    platformSet.add(m.platform);
    if (m.state === 'PENDING') pendingCount++;
    if (m.state === 'APPROVED' || m.state === 'EDITED') approvedCount++;
  }

  return {
    totalMemories: memories.length,
    pendingCount,
    approvedCount,
    platformsSeen: [...platformSet],
  };
}

async function handleInjectContext(payload: {
  categories?: MemoryCategory[];
}): Promise<{ text: string }> {
  const memories = await getMemories();
  const approved = memories.filter(
    (m) => m.state === 'APPROVED' || m.state === 'EDITED',
  );

  const categories = payload.categories ?? [
    'PROFILE',
    'PREFERENCE',
    'PROJECT',
    'DECISION',
    'GENERAL',
  ];

  const grouped = new Map<MemoryCategory, Memory[]>();
  for (const m of approved) {
    if (categories.includes(m.category)) {
      const list = grouped.get(m.category) ?? [];
      list.push(m);
      grouped.set(m.category, list);
    }
  }

  if (grouped.size === 0) {
    return { text: '' };
  }

  const categoryLabels: Record<MemoryCategory, string> = {
    PROFILE: 'About Me',
    PREFERENCE: 'My Preferences',
    PROJECT: 'Current Projects & Stack',
    DECISION: 'Past Decisions',
    GENERAL: 'General Notes',
  };

  const lines: string[] = [
    '--- Agent Passport Context ---',
    'The following is contextual information about the user. Use it to personalize your responses.',
    '',
  ];

  for (const cat of categories) {
    const items = grouped.get(cat);
    if (!items || items.length === 0) continue;
    lines.push(`## ${categoryLabels[cat]}`);
    for (const item of items) {
      lines.push(`- ${item.content}`);
    }
    lines.push('');
  }

  lines.push('--- End Agent Passport Context ---');
  return { text: lines.join('\n') };
}

// ─── Init ───────────────────────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener(() => {
  updateBadge();
});

updateBadge();

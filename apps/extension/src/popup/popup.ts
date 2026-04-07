import type { MemoryItem, MemoryCategory } from '@agent-passport/schema';

type Platform = 'chatgpt' | 'claude' | 'perplexity' | 'gemini' | 'copilot';

interface MemoriesResponse {
  pending: MemoryItem[];
  approved: MemoryItem[];
}

interface ActionResponse {
  success: boolean;
  item?: MemoryItem;
  json?: string;
  error?: string;
}

const PLATFORM_ICONS: Record<Platform | 'unknown', string> = {
  chatgpt: '🤖',
  claude: '🌸',
  perplexity: '🔍',
  gemini: '✨',
  copilot: '🐙',
  unknown: '🌐',
};

const PLATFORM_NAMES: Record<Platform | 'unknown', string> = {
  chatgpt: 'ChatGPT',
  claude: 'Claude',
  perplexity: 'Perplexity',
  gemini: 'Gemini',
  copilot: 'GitHub Copilot',
  unknown: 'Unknown',
};

let currentPlatform: Platform | 'unknown' = 'unknown';
let allPending: MemoryItem[] = [];
let allApproved: MemoryItem[] = [];

async function detectPlatform(): Promise<Platform | 'unknown'> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const url = tab?.url ?? '';
  if (url.includes('chat.openai.com')) return 'chatgpt';
  if (url.includes('claude.ai')) return 'claude';
  if (url.includes('perplexity.ai')) return 'perplexity';
  if (url.includes('gemini.google.com')) return 'gemini';
  if (url.includes('copilot.microsoft.com') || url.includes('github.com')) return 'copilot';
  return 'unknown';
}

async function loadMemories(): Promise<void> {
  const response = await chrome.runtime.sendMessage({ type: 'GET_ALL_MEMORIES' }) as MemoriesResponse;
  allPending = response.pending ?? [];
  allApproved = response.approved ?? [];
  renderInbox();
  renderPassport();
  updateBadge();
}

function updateBadge(): void {
  const badge = document.getElementById('pending-badge')!;
  const count = allPending.length;
  badge.textContent = String(count);
  badge.classList.toggle('hidden', count === 0);
}

function getCategoryColor(category: string): string {
  return `cat-${category}`;
}

function renderMemoryCard(item: MemoryItem, showActions: boolean): HTMLElement {
  const card = document.createElement('div');
  card.className = 'memory-card';
  card.dataset['id'] = item.id;

  const confidencePct = Math.round(item.confidence * 100);

  card.innerHTML = `
    <div class="memory-meta">
      <span class="category-pill ${getCategoryColor(item.category)}">${item.category}</span>
      <div class="confidence-bar">
        <div class="confidence-fill" style="width:${confidencePct}%"></div>
      </div>
    </div>
    <div class="memory-content">${escapeHtml(item.content)}</div>
    <div class="memory-source">via ${escapeHtml(item.provenance.platform)}</div>
    ${showActions ? `
    <div class="card-actions">
      <button class="btn-sm btn-approve" data-action="approve" data-id="${item.id}">✓ Approve</button>
      <button class="btn-sm btn-edit" data-action="edit" data-id="${item.id}">✎ Edit</button>
      <button class="btn-sm btn-reject" data-action="reject" data-id="${item.id}">✕ Reject</button>
    </div>
    <div class="edit-area" id="edit-${item.id}">
      <textarea class="edit-textarea">${escapeHtml(item.content)}</textarea>
      <button class="btn-save" data-action="save" data-id="${item.id}">Save</button>
    </div>
    ` : ''}
  `;

  return card;
}

function renderInbox(): void {
  const container = document.getElementById('inbox-list')!;
  container.innerHTML = '';

  if (allPending.length === 0) {
    container.innerHTML = `
      <div class="empty">
        <div class="empty-icon">📭</div>
        <div class="empty-text">No pending memories.<br/>Browse an AI chat to capture context.</div>
      </div>`;
    return;
  }

  for (const item of allPending) {
    container.appendChild(renderMemoryCard(item, true));
  }
}

function renderPassport(): void {
  const container = document.getElementById('passport-list')!;
  container.innerHTML = '';

  if (allApproved.length === 0) {
    container.innerHTML = `
      <div class="empty">
        <div class="empty-icon">🗂️</div>
        <div class="empty-text">No approved memories yet.<br/>Approve items from your Inbox.</div>
      </div>`;
    return;
  }

  const grouped = new Map<string, MemoryItem[]>();
  for (const item of allApproved) {
    const group = grouped.get(item.category) ?? [];
    group.push(item);
    grouped.set(item.category, group);
  }

  for (const [category, items] of grouped) {
    const group = document.createElement('div');
    group.className = 'category-group';
    group.innerHTML = `<div class="category-header">${category}</div>`;
    for (const item of items) {
      group.appendChild(renderMemoryCard(item, false));
    }
    container.appendChild(group);
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function handleCardAction(action: string, id: string): Promise<void> {
  if (action === 'approve') {
    await chrome.runtime.sendMessage({ type: 'APPROVE_MEMORY', id }) as ActionResponse;
    await loadMemories();
  } else if (action === 'reject') {
    await chrome.runtime.sendMessage({ type: 'REJECT_MEMORY', id }) as ActionResponse;
    await loadMemories();
  } else if (action === 'edit') {
    const editArea = document.getElementById(`edit-${id}`);
    editArea?.classList.toggle('open');
  } else if (action === 'save') {
    const editArea = document.getElementById(`edit-${id}`);
    const textarea = editArea?.querySelector('textarea');
    if (textarea) {
      await chrome.runtime.sendMessage({
        type: 'EDIT_MEMORY',
        id,
        patch: { content: textarea.value },
      }) as ActionResponse;
      await loadMemories();
    }
  }
}

async function handleInject(): Promise<void> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;

  const response = await chrome.runtime.sendMessage({ type: 'EXPORT_PASSPORT' }) as ActionResponse;
  if (!response.json) return;

  await chrome.tabs.sendMessage(tab.id, {
    type: 'INJECT_CONTEXT',
    platform: currentPlatform,
    passportJson: response.json,
  });
}

async function handleExport(): Promise<void> {
  const response = await chrome.runtime.sendMessage({ type: 'EXPORT_PASSPORT' }) as ActionResponse;
  if (!response.json) return;

  const blob = new Blob([response.json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `agent-passport-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

async function handleImport(file: File): Promise<void> {
  const text = await file.text();
  await chrome.runtime.sendMessage({ type: 'IMPORT_PASSPORT', json: text });
  await loadMemories();
}

async function loadAutoInjectSetting(): Promise<void> {
  const result = await chrome.storage.local.get('autoInject');
  const toggle = document.getElementById('auto-inject-toggle') as HTMLInputElement;
  toggle.checked = Boolean(result['autoInject']);
}

function initTabs(): void {
  document.querySelectorAll<HTMLButtonElement>('.tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
      document.querySelectorAll('.panel').forEach((p) => p.classList.remove('active'));
      tab.classList.add('active');
      const panelId = `panel-${tab.dataset['tab']}`;
      document.getElementById(panelId)?.classList.add('active');
    });
  });
}

function initEventListeners(): void {
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const btn = target.closest<HTMLElement>('[data-action]');
    if (btn?.dataset['action'] && btn.dataset['id']) {
      handleCardAction(btn.dataset['action'], btn.dataset['id']);
    }
  });

  document.getElementById('btn-inject')?.addEventListener('click', handleInject);
  document.getElementById('btn-export')?.addEventListener('click', handleExport);

  document.getElementById('btn-import')?.addEventListener('click', () => {
    document.getElementById('import-file')?.click();
  });

  document.getElementById('import-file')?.addEventListener('change', (e) => {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) handleImport(file);
  });

  document.getElementById('auto-inject-toggle')?.addEventListener('change', (e) => {
    const checked = (e.target as HTMLInputElement).checked;
    chrome.storage.local.set({ autoInject: checked });
  });
}

async function init(): Promise<void> {
  initTabs();
  initEventListeners();

  currentPlatform = await detectPlatform();

  const platformBadge = document.getElementById('platform-badge')!;
  const injectIcon = document.getElementById('inject-platform-icon')!;
  const injectName = document.getElementById('inject-platform-name')!;

  platformBadge.textContent = PLATFORM_NAMES[currentPlatform];
  injectIcon.textContent = PLATFORM_ICONS[currentPlatform];
  injectName.textContent = PLATFORM_NAMES[currentPlatform];

  await loadMemories();
  await loadAutoInjectSetting();
}

document.addEventListener('DOMContentLoaded', init);

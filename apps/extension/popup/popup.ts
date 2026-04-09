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

// ─── DOM helpers ────────────────────────────────────────────────────────────

function $(selector: string): HTMLElement | null {
  return document.querySelector(selector);
}

function $all(selector: string): NodeListOf<HTMLElement> {
  return document.querySelectorAll(selector);
}

function escapeHtml(str: string): string {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(ts).toLocaleDateString();
}

function showToast(message: string): void {
  const toast = $('#toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2200);
}

// ─── Message helper ─────────────────────────────────────────────────────────

function sendMessage(type: string, payload?: unknown): Promise<unknown> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type, payload }, (response) => {
      resolve(response);
    });
  });
}

// ─── Tab switching ──────────────────────────────────────────────────────────

function setupTabs(): void {
  const tabBtns = $all('.tab-btn');
  const tabContents = $all('.tab-content');

  tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      if (!tab) return;

      tabBtns.forEach((b) => b.classList.remove('active'));
      tabContents.forEach((c) => c.classList.remove('active'));

      btn.classList.add('active');
      const content = $(`#tab-${tab}`);
      if (content) content.classList.add('active');

      // Refresh content on tab switch
      if (tab === 'inbox') loadInbox();
      else if (tab === 'passport') loadPassport();
      else if (tab === 'inject') loadInjectPreview();
    });
  });
}

// ─── Render Inbox ───────────────────────────────────────────────────────────

async function loadInbox(): Promise<void> {
  const memories = (await sendMessage('GET_MEMORIES', { state: 'PENDING' })) as Memory[];
  const container = $('#inbox-list');
  if (!container) return;

  if (!memories || memories.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">
          <svg width="40" height="40" viewBox="0 0 16 16" fill="#30363d"><path d="M8 16A8 8 0 108 0a8 8 0 000 16zm3.78-9.72a.75.75 0 00-1.06-1.06L6.5 9.44 5.28 8.22a.75.75 0 00-1.06 1.06l1.75 1.75a.75.75 0 001.06 0l4.75-4.75z"/></svg>
        </div>
        <h3>Inbox Clear</h3>
        <p>No pending memories to review. Visit an AI assistant to capture new ones.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = memories
    .sort((a, b) => b.timestamp - a.timestamp)
    .map((m) => renderMemoryCard(m, 'inbox'))
    .join('');

  attachCardListeners(container, 'inbox');
}

// ─── Render Passport ────────────────────────────────────────────────────────

const categoryLabels: Record<MemoryCategory, string> = {
  PROFILE: 'About Me',
  PREFERENCE: 'Preferences',
  PROJECT: 'Projects & Stack',
  DECISION: 'Decisions',
  GENERAL: 'General Notes',
};

const categoryOrder: MemoryCategory[] = [
  'PROFILE',
  'PREFERENCE',
  'PROJECT',
  'DECISION',
  'GENERAL',
];

async function loadPassport(): Promise<void> {
  const allMemories = (await sendMessage('GET_MEMORIES')) as Memory[];
  const container = $('#passport-list');
  if (!container) return;

  const approved = (allMemories ?? []).filter(
    (m) => m.state === 'APPROVED' || m.state === 'EDITED',
  );

  if (approved.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">
          <svg width="40" height="40" viewBox="0 0 16 16" fill="#30363d"><path d="M2 2.75C2 1.784 2.784 1 3.75 1h8.5c.966 0 1.75.784 1.75 1.75v10.5A1.75 1.75 0 0112.25 15h-8.5A1.75 1.75 0 012 13.25V2.75zm6 6.5a3 3 0 100-6 3 3 0 000 6z"/></svg>
        </div>
        <h3>Passport Empty</h3>
        <p>Approve memories from the Inbox to build your passport.</p>
      </div>
    `;
    return;
  }

  // Group by category
  const grouped = new Map<MemoryCategory, Memory[]>();
  for (const m of approved) {
    const list = grouped.get(m.category) ?? [];
    list.push(m);
    grouped.set(m.category, list);
  }

  let html = '';
  for (const cat of categoryOrder) {
    const items = grouped.get(cat);
    if (!items || items.length === 0) continue;

    html += `
      <div class="category-group">
        <div class="category-group-header">
          <span class="category-badge category-${cat}">${cat}</span>
          <h3>${categoryLabels[cat]}</h3>
          <span class="category-group-count">${items.length}</span>
        </div>
        ${items.map((m) => renderMemoryCard(m, 'passport')).join('')}
      </div>
    `;
  }

  container.innerHTML = html;
  attachCardListeners(container, 'passport');
}

// ─── Render card ────────────────────────────────────────────────────────────

function renderMemoryCard(m: Memory, context: 'inbox' | 'passport'): string {
  const actions =
    context === 'inbox'
      ? `
        <button class="card-btn approve" data-id="${m.id}" title="Approve">&#10003;</button>
        <button class="card-btn reject" data-id="${m.id}" title="Reject">&#10007;</button>
        <button class="card-btn edit" data-id="${m.id}" title="Edit">&#9998;</button>
        <span class="card-timestamp">${timeAgo(m.timestamp)}</span>
      `
      : `
        <button class="card-btn edit" data-id="${m.id}" title="Edit">&#9998;</button>
        <button class="card-btn reject" data-id="${m.id}" title="Remove">&#10007;</button>
        <span class="card-timestamp">${timeAgo(m.updatedAt)}</span>
      `;

  return `
    <div class="memory-card" data-id="${m.id}">
      <div class="card-header">
        <div class="card-meta">
          <span class="category-badge category-${m.category}">${m.category}</span>
          <span class="platform-tag">${m.platform}</span>
        </div>
      </div>
      <div class="card-content" data-id="${m.id}">${escapeHtml(m.content)}</div>
      <div class="card-actions">${actions}</div>
    </div>
  `;
}

// ─── Card event listeners ───────────────────────────────────────────────────

function attachCardListeners(
  container: HTMLElement,
  context: 'inbox' | 'passport',
): void {
  // Approve buttons
  container.querySelectorAll('.card-btn.approve').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = (btn as HTMLElement).dataset.id;
      await sendMessage('APPROVE_MEMORY', { id });
      showToast('Memory approved');
      loadInbox();
      updateStats();
    });
  });

  // Reject buttons
  container.querySelectorAll('.card-btn.reject').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = (btn as HTMLElement).dataset.id;
      await sendMessage('REJECT_MEMORY', { id });
      showToast(context === 'inbox' ? 'Memory rejected' : 'Memory removed');
      if (context === 'inbox') loadInbox();
      else loadPassport();
      updateStats();
    });
  });

  // Edit buttons
  container.querySelectorAll('.card-btn.edit').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = (btn as HTMLElement).dataset.id;
      if (!id) return;

      const card = container.querySelector(`.memory-card[data-id="${id}"]`);
      if (!card) return;

      const contentEl = card.querySelector('.card-content') as HTMLElement;
      const actionsEl = card.querySelector('.card-actions') as HTMLElement;
      if (!contentEl || !actionsEl) return;

      const currentText = contentEl.textContent ?? '';

      contentEl.innerHTML = `<textarea class="card-content-edit">${escapeHtml(currentText)}</textarea>`;

      actionsEl.innerHTML = `
        <button class="card-btn save" data-id="${id}">Save</button>
        <button class="card-btn cancel" data-id="${id}">Cancel</button>
      `;

      // Focus the textarea
      const textarea = contentEl.querySelector('textarea');
      if (textarea) {
        textarea.focus();
        textarea.selectionStart = textarea.value.length;
      }

      // Save
      actionsEl.querySelector('.save')?.addEventListener('click', async () => {
        const newText = textarea?.value?.trim();
        if (newText) {
          await sendMessage('EDIT_MEMORY', { id, content: newText });
          showToast('Memory updated');
        }
        if (context === 'inbox') loadInbox();
        else loadPassport();
        updateStats();
      });

      // Cancel
      actionsEl.querySelector('.cancel')?.addEventListener('click', () => {
        if (context === 'inbox') loadInbox();
        else loadPassport();
      });
    });
  });
}

// ─── Export / Import ────────────────────────────────────────────────────────

function setupExportImport(): void {
  const exportBtn = $('#export-btn');
  const importBtn = $('#import-btn');
  const fileInput = $('#import-file-input') as HTMLInputElement | null;

  exportBtn?.addEventListener('click', async () => {
    const result = (await sendMessage('EXPORT_PASSPORT')) as { data: string };
    if (!result?.data) {
      showToast('Nothing to export');
      return;
    }

    const blob = new Blob([result.data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agent-passport-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Passport exported');
  });

  importBtn?.addEventListener('click', () => {
    fileInput?.click();
  });

  fileInput?.addEventListener('change', async () => {
    const file = fileInput.files?.[0];
    if (!file) return;

    const text = await file.text();
    const result = (await sendMessage('IMPORT_PASSPORT', { data: text })) as {
      success: boolean;
      count: number;
    };

    if (result?.success) {
      showToast(`Imported ${result.count} memories`);
      loadPassport();
      updateStats();
    } else {
      showToast('Import failed: invalid file');
    }

    fileInput.value = '';
  });
}

// ─── Inject ─────────────────────────────────────────────────────────────────

function getSelectedCategories(): MemoryCategory[] {
  const checkboxes = document.querySelectorAll<HTMLInputElement>(
    '.checkbox-group input[type="checkbox"]:checked',
  );
  return Array.from(checkboxes).map((cb) => cb.value as MemoryCategory);
}

async function loadInjectPreview(): Promise<void> {
  const categories = getSelectedCategories();
  const result = (await sendMessage('INJECT_CONTEXT', { categories })) as {
    text: string;
  };
  const preview = $('#inject-preview');
  if (!preview) return;

  if (result?.text) {
    preview.textContent = result.text;
    preview.style.display = 'block';
  } else {
    preview.textContent = 'No approved memories to inject.';
    preview.style.display = 'block';
  }
}

function setupInject(): void {
  const injectBtn = $('#inject-btn');
  const statusEl = $('#inject-status');

  // Update preview when checkboxes change
  document.querySelectorAll('.checkbox-group input[type="checkbox"]').forEach((cb) => {
    cb.addEventListener('change', loadInjectPreview);
  });

  injectBtn?.addEventListener('click', async () => {
    const categories = getSelectedCategories();
    if (categories.length === 0) {
      if (statusEl) {
        statusEl.className = 'inject-status error';
        statusEl.textContent = 'Select at least one category';
      }
      return;
    }

    const result = (await sendMessage('INJECT_CONTEXT', { categories })) as {
      text: string;
    };

    if (!result?.text) {
      if (statusEl) {
        statusEl.className = 'inject-status error';
        statusEl.textContent = 'No approved memories found for selected categories';
      }
      return;
    }

    // Send to active tab
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (!tab?.id) throw new Error('No active tab');

      await chrome.tabs.sendMessage(tab.id, {
        type: 'INJECT',
        payload: { text: result.text },
      });

      if (statusEl) {
        statusEl.className = 'inject-status success';
        statusEl.textContent = 'Context injected successfully!';
      }

      setTimeout(() => {
        if (statusEl) statusEl.className = 'inject-status';
      }, 3000);
    } catch (err) {
      if (statusEl) {
        statusEl.className = 'inject-status error';
        statusEl.textContent =
          'Could not inject. Make sure you are on a supported AI platform.';
      }
    }
  });
}

// ─── Stats ──────────────────────────────────────────────────────────────────

async function updateStats(): Promise<void> {
  const stats = (await sendMessage('GET_STATS')) as PassportStats;
  if (!stats) return;

  const approved = $('#stat-approved');
  const pending = $('#stat-pending');
  const total = $('#stat-total');
  const badge = $('#inbox-badge');

  if (approved) approved.textContent = String(stats.approvedCount);
  if (pending) pending.textContent = String(stats.pendingCount);
  if (total) total.textContent = String(stats.totalMemories);
  if (badge) {
    badge.textContent = stats.pendingCount > 0 ? String(stats.pendingCount) : '';
    badge.dataset.count = String(stats.pendingCount);
  }
}

// ─── Init ───────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  setupTabs();
  setupExportImport();
  setupInject();
  loadInbox();
  updateStats();
});

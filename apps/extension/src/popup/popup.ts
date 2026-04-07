import type { Passport, MemoryItem } from '@agent-passport/schema';

// ── Helpers ──────────────────────────────────────────────────
function sendMsg<T>(msg: unknown): Promise<T> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(msg, (res: T) => resolve(res));
  });
}

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

// ── State ────────────────────────────────────────────────────
let passport: Passport | null = null;

// ── Tab switching ────────────────────────────────────────────
document.querySelectorAll('nav button').forEach((btn) => {
  btn.addEventListener('click', () => {
    const tab = (btn as HTMLButtonElement).dataset['tab']!;
    document.querySelectorAll('nav button').forEach((b) => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach((p) => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(`tab-${tab}`)!.classList.add('active');
    if (tab === 'inject') void renderPreview();
  });
});

// ── Memory list render ───────────────────────────────────────
function renderMemories(memories: MemoryItem[]): void {
  const list = document.getElementById('memoryList')!;
  if (memories.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🧠</div>
        <div>No memories yet.</div>
        <div style="font-size:12px;margin-top:4px;">Add your first memory below.</div>
      </div>`;
    return;
  }
  list.innerHTML = memories
    .slice(-20)
    .reverse()
    .map(
      (m) => `
      <div class="memory-card">
        <span class="memory-badge">${esc(m.category)}</span>
        <div>
          <div class="memory-content">${esc(m.content)}</div>
          <div class="memory-source">via ${esc(m.source)}</div>
        </div>
        <button class="memory-delete" data-id="${esc(m.id)}" title="Delete">✕</button>
      </div>`
    )
    .join('');

  list.querySelectorAll('.memory-delete').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = (btn as HTMLElement).dataset['id']!;
      void sendMsg({ type: 'REMOVE_MEMORY', id }).then(() => load());
    });
  });
}

// ── Stats ────────────────────────────────────────────────────
function renderStats(p: Passport): void {
  document.getElementById('statTotal')!.textContent = String(p.memories.length);
  const cats = new Set(p.memories.map((m) => m.category)).size;
  document.getElementById('statCats')!.textContent = String(cats);
  document.getElementById('statPerms')!.textContent = String(p.permissions.length);
}

// ── Identity form ─────────────────────────────────────────────
function renderIdentity(p: Passport): void {
  (document.getElementById('idName') as HTMLInputElement).value = p.identity.name ?? '';
  (document.getElementById('idRole') as HTMLInputElement).value = p.identity.role ?? '';
  (document.getElementById('idTz') as HTMLInputElement).value = p.identity.timezone ?? '';
  (document.getElementById('idLang') as HTMLInputElement).value = p.identity.language ?? '';
}

document.getElementById('saveIdentityBtn')!.addEventListener('click', () => {
  if (!passport) return;
  passport.identity = {
    name: (document.getElementById('idName') as HTMLInputElement).value || undefined,
    role: (document.getElementById('idRole') as HTMLInputElement).value || undefined,
    timezone: (document.getElementById('idTz') as HTMLInputElement).value || undefined,
    language: (document.getElementById('idLang') as HTMLInputElement).value || undefined,
  };
  void sendMsg({ type: 'SAVE_PASSPORT', passport }).then(() => {
    const btn = document.getElementById('saveIdentityBtn')!;
    btn.textContent = '✓ Saved!';
    setTimeout(() => { btn.textContent = 'Save Identity'; }, 1500);
  });
});

// ── Add memory ────────────────────────────────────────────────
document.getElementById('addMemBtn')!.addEventListener('click', () => {
  const content = (document.getElementById('memContent') as HTMLTextAreaElement).value.trim();
  const category = (document.getElementById('memCategory') as HTMLSelectElement).value as MemoryItem['category'];
  if (!content) return;
  void sendMsg({
    type: 'ADD_MEMORY',
    item: { content, category, tags: [], source: 'manual', confidence: 1 },
  }).then(() => {
    (document.getElementById('memContent') as HTMLTextAreaElement).value = '';
    void load();
  });
});

// ── Inject buttons ────────────────────────────────────────────
document.querySelectorAll<HTMLElement>('.platform-card').forEach((card) => {
  const btn = card.querySelector('.inject-btn')!;
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    void chrome.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
      if (!tab?.id) return;
      chrome.tabs.sendMessage(tab.id, { type: 'INJECT_CONTEXT' });
      card.classList.add('success-flash');
      setTimeout(() => card.classList.remove('success-flash'), 700);
      void renderPreview();
    });
  });
});

// ── Preview ───────────────────────────────────────────────────
async function renderPreview(): Promise<void> {
  const box = document.getElementById('previewBox')!;
  if (!passport || passport.memories.length === 0) { box.style.display = 'none'; return; }
  const res = await sendMsg<{ ok: boolean; data: { systemPrompt: string } }>({
    type: 'GENERATE_PACK',
    platform: 'generic',
  });
  if (res.ok) {
    box.textContent = res.data.systemPrompt;
    box.style.display = 'block';
  }
}

// ── Bootstrap ─────────────────────────────────────────────────
function load(): Promise<void> {
  return sendMsg<{ ok: boolean; data: Passport }>({ type: 'GET_PASSPORT' }).then((res) => {
    if (!res.ok) return;
    passport = res.data;
    renderMemories(passport.memories);
    renderStats(passport);
    renderIdentity(passport);
  });
}

void load();

// ─── Types ──────────────────────────────────────────────────────────────────

type MemoryCategory = 'PROFILE' | 'PREFERENCE' | 'PROJECT' | 'DECISION' | 'GENERAL';

type Platform = 'chatgpt' | 'claude' | 'perplexity' | 'gemini' | 'copilot' | 'unknown';

interface ExtractionCandidate {
  content: string;
  category: MemoryCategory;
  platform: string;
}

// ─── Platform detection ─────────────────────────────────────────────────────

function detectPlatform(): Platform {
  const host = window.location.hostname;
  const path = window.location.pathname;

  if (host === 'chatgpt.com' || host === 'chat.openai.com') return 'chatgpt';
  if (host === 'claude.ai') return 'claude';
  if (host === 'www.perplexity.ai') return 'perplexity';
  if (host === 'gemini.google.com') return 'gemini';
  if (host === 'github.com' && path.startsWith('/copilot')) return 'copilot';
  return 'unknown';
}

// ─── Hash for dedup ─────────────────────────────────────────────────────────

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return String(hash);
}

const processedHashes = new Set<string>();

// ─── Extraction patterns ────────────────────────────────────────────────────

interface ExtractionRule {
  pattern: RegExp;
  category: MemoryCategory;
  extract: (match: RegExpMatchArray) => string;
}

const extractionRules: ExtractionRule[] = [
  // PROFILE patterns
  {
    pattern: /\bmy name is ([A-Z][a-zA-Z\s'-]{1,40})/i,
    category: 'PROFILE',
    extract: (m) => `User's name is ${m[1].trim()}`,
  },
  {
    pattern: /\bI am (?:a|an) ([a-zA-Z\s'-]{2,50})/i,
    category: 'PROFILE',
    extract: (m) => `User is a ${m[1].trim()}`,
  },
  {
    pattern: /\bI work (?:at|for) ([A-Za-z0-9\s&.'-]{2,50})/i,
    category: 'PROFILE',
    extract: (m) => `User works at ${m[1].trim()}`,
  },
  {
    pattern: /\bI(?:'m| am) based in ([A-Za-z\s,'-]{2,50})/i,
    category: 'PROFILE',
    extract: (m) => `User is based in ${m[1].trim()}`,
  },
  {
    pattern: /\bI speak ([A-Za-z\s,and]{2,60})/i,
    category: 'PROFILE',
    extract: (m) => `User speaks ${m[1].trim()}`,
  },

  // PREFERENCE patterns
  {
    pattern: /\bI prefer ([a-zA-Z0-9\s,'-]{2,80})/i,
    category: 'PREFERENCE',
    extract: (m) => `Prefers ${m[1].trim()}`,
  },
  {
    pattern: /\bI (?:really )?like ([a-zA-Z0-9\s,'-]{2,80})/i,
    category: 'PREFERENCE',
    extract: (m) => `Likes ${m[1].trim()}`,
  },
  {
    pattern: /\bI always ([a-zA-Z0-9\s,'-]{2,80})/i,
    category: 'PREFERENCE',
    extract: (m) => `Always ${m[1].trim()}`,
  },
  {
    pattern: /\bI (?:don't|do not) like ([a-zA-Z0-9\s,'-]{2,80})/i,
    category: 'PREFERENCE',
    extract: (m) => `Dislikes ${m[1].trim()}`,
  },
  {
    pattern: /\bplease (?:always|use|write) ([a-zA-Z0-9\s,'-]{2,80})/i,
    category: 'PREFERENCE',
    extract: (m) => `Preference: always ${m[1].trim()}`,
  },

  // PROJECT patterns
  {
    pattern: /\b(?:I'm|I am|we're|we are) working on ([a-zA-Z0-9\s,'-]{2,80})/i,
    category: 'PROJECT',
    extract: (m) => `Working on ${m[1].trim()}`,
  },
  {
    pattern: /\bour (?:tech )?stack is ([a-zA-Z0-9\s,/+.'-]{2,100})/i,
    category: 'PROJECT',
    extract: (m) => `Tech stack: ${m[1].trim()}`,
  },
  {
    pattern: /\bwe use ([a-zA-Z0-9\s,/+.'-]{2,80})/i,
    category: 'PROJECT',
    extract: (m) => `Uses ${m[1].trim()}`,
  },
  {
    pattern: /\bour project (?:is called|is named) ([a-zA-Z0-9\s'-]{2,60})/i,
    category: 'PROJECT',
    extract: (m) => `Project name: ${m[1].trim()}`,
  },
  {
    pattern: /\bwe're building ([a-zA-Z0-9\s,'-]{2,80})/i,
    category: 'PROJECT',
    extract: (m) => `Building ${m[1].trim()}`,
  },

  // DECISION patterns
  {
    pattern: /\b(?:I|we) decided to ([a-zA-Z0-9\s,'-]{2,80})/i,
    category: 'DECISION',
    extract: (m) => `Decided to ${m[1].trim()}`,
  },
  {
    pattern: /\blet's go with ([a-zA-Z0-9\s,'-]{2,80})/i,
    category: 'DECISION',
    extract: (m) => `Going with ${m[1].trim()}`,
  },
  {
    pattern: /\bwe chose ([a-zA-Z0-9\s,'-]{2,80})/i,
    category: 'DECISION',
    extract: (m) => `Chose ${m[1].trim()}`,
  },
  {
    pattern: /\bwe(?:'re| are) going (?:to|with) ([a-zA-Z0-9\s,'-]{2,80})/i,
    category: 'DECISION',
    extract: (m) => `Decision: going with ${m[1].trim()}`,
  },
];

function extractCandidates(text: string, platform: string): ExtractionCandidate[] {
  const candidates: ExtractionCandidate[] = [];

  for (const rule of extractionRules) {
    const match = text.match(rule.pattern);
    if (match) {
      const content = rule.extract(match);
      const hash = simpleHash(content);
      if (!processedHashes.has(hash)) {
        processedHashes.add(hash);
        candidates.push({
          content,
          category: rule.category,
          platform,
        });
      }
    }
  }

  return candidates;
}

// ─── Observer selectors per platform ────────────────────────────────────────

interface PlatformSelectors {
  container: string;
  messageSelector: string;
}

function getSelectors(platform: Platform): PlatformSelectors | null {
  switch (platform) {
    case 'chatgpt':
      return {
        container: 'main',
        messageSelector: '[class*="markdown"], [data-message-author-role="user"]',
      };
    case 'claude':
      return {
        container: 'main',
        messageSelector: '[class*="font-claude-message"], .prose, [class*="UserMessage"]',
      };
    case 'perplexity':
      return {
        container: 'main',
        messageSelector: '.prose',
      };
    case 'gemini':
      return {
        container: 'main',
        messageSelector: '.response-content, message-content, .query-content',
      };
    case 'copilot':
      return {
        container: 'main',
        messageSelector: '.markdown-body',
      };
    default:
      return null;
  }
}

// ─── Check settings ─────────────────────────────────────────────────────────

async function isAutoCapture(): Promise<boolean> {
  try {
    const result = await chrome.storage.local.get('passport_settings');
    const settings = result.passport_settings;
    if (!settings) return true;
    if (settings.autoCapture === false) return false;

    const platform = detectPlatform();
    const platformKey = `platform_${platform}`;
    if (settings[platformKey] === false) return false;

    return true;
  } catch {
    return true;
  }
}

// ─── Main observer ──────────────────────────────────────────────────────────

function processTextContent(text: string, platform: Platform): void {
  if (!text || text.length < 10) return;

  const hash = simpleHash(text);
  if (processedHashes.has(hash)) return;
  processedHashes.add(hash);

  const candidates = extractCandidates(text, platform);
  for (const candidate of candidates) {
    chrome.runtime.sendMessage({
      type: 'ADD_MEMORY',
      payload: candidate,
    });
  }
}

function startObserving(): void {
  const platform = detectPlatform();
  if (platform === 'unknown') return;

  const selectors = getSelectors(platform);
  if (!selectors) return;

  // Debounce processing
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  const processNewMessages = async () => {
    const enabled = await isAutoCapture();
    if (!enabled) return;

    const messages = document.querySelectorAll(selectors.messageSelector);
    messages.forEach((el) => {
      const text = el.textContent?.trim() ?? '';
      processTextContent(text, platform);
    });
  };

  // Wait for container to appear, then observe
  const waitForContainer = () => {
    const container = document.querySelector(selectors.container);
    if (!container) {
      setTimeout(waitForContainer, 1000);
      return;
    }

    const observer = new MutationObserver(() => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(processNewMessages, 800);
    });

    observer.observe(container, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    // Process existing messages
    processNewMessages();
  };

  // Start after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', waitForContainer);
  } else {
    waitForContainer();
  }
}

// ─── Listen for injector messages ───────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'INJECT') {
    // Forward to injector logic
    injectText(message.payload.text);
    sendResponse({ success: true });
  }
  return true;
});

function injectText(text: string): void {
  const platform = detectPlatform();

  let inputEl: HTMLTextAreaElement | HTMLElement | null = null;

  switch (platform) {
    case 'chatgpt':
      inputEl =
        document.querySelector<HTMLTextAreaElement>('#prompt-textarea') ??
        document.querySelector<HTMLElement>('[contenteditable="true"]') ??
        document.querySelector<HTMLTextAreaElement>('textarea');
      break;
    case 'claude':
      inputEl = document.querySelector<HTMLElement>(
        '[contenteditable="true"].ProseMirror, [contenteditable="true"][class*="ProseMirror"]',
      );
      break;
    case 'perplexity':
      inputEl = document.querySelector<HTMLTextAreaElement>('textarea');
      break;
    case 'gemini':
      inputEl =
        document.querySelector<HTMLElement>('[contenteditable="true"]') ??
        document.querySelector<HTMLElement>('.ql-editor') ??
        document.querySelector<HTMLTextAreaElement>('textarea');
      break;
    case 'copilot':
      inputEl = document.querySelector<HTMLTextAreaElement>('textarea');
      break;
  }

  if (!inputEl) return;

  if (inputEl instanceof HTMLTextAreaElement) {
    inputEl.value = text + '\n\n' + inputEl.value;
    inputEl.dispatchEvent(new Event('input', { bubbles: true }));
    inputEl.dispatchEvent(new Event('change', { bubbles: true }));
  } else {
    // contenteditable
    const existingText = inputEl.textContent ?? '';
    inputEl.textContent = text + '\n\n' + existingText;
    inputEl.dispatchEvent(new Event('input', { bubbles: true }));
    inputEl.dispatchEvent(new Event('change', { bubbles: true }));
  }

  inputEl.focus();
}

// ─── Start ──────────────────────────────────────────────────────────────────

startObserving();

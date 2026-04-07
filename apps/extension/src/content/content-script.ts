type Platform = 'chatgpt' | 'claude' | 'perplexity' | 'gemini' | 'copilot';

interface PlatformConfig {
  name: Platform;
  messageSelector: string;
}

const PLATFORM_CONFIGS: PlatformConfig[] = [
  { name: 'chatgpt', messageSelector: '[data-message-author-role="assistant"] .markdown' },
  { name: 'claude', messageSelector: '.font-claude-message' },
  { name: 'perplexity', messageSelector: '.prose' },
  { name: 'gemini', messageSelector: '.model-response-text' },
  { name: 'copilot', messageSelector: '.response-content' },
];

function detectPlatform(): Platform | null {
  const host = window.location.hostname;
  if (host === 'chat.openai.com') return 'chatgpt';
  if (host === 'claude.ai') return 'claude';
  if (host === 'www.perplexity.ai' || host === 'perplexity.ai') return 'perplexity';
  if (host === 'gemini.google.com') return 'gemini';
  if (host === 'copilot.microsoft.com' || host === 'github.com') return 'copilot';
  return null;
}

const platform = detectPlatform();
if (!platform) {
  throw new Error('Agent Passport: unsupported platform');
}

const config = PLATFORM_CONFIGS.find((c) => c.name === platform)!;
const processedElements = new WeakSet<Element>();
const extractionThrottle = new Map<Element, number>();
const THROTTLE_MS = 5000;

function shouldExtract(element: Element): boolean {
  const lastExtracted = extractionThrottle.get(element);
  const now = Date.now();
  if (lastExtracted !== undefined && now - lastExtracted < THROTTLE_MS) {
    return false;
  }
  extractionThrottle.set(element, now);
  return true;
}

function extractFromElement(element: Element): void {
  if (!shouldExtract(element)) return;

  const text = element.textContent?.trim() ?? '';
  if (text.length < 20) return;

  chrome.runtime.sendMessage({
    type: 'EXTRACT_MEMORY',
    text,
    platform,
  });
}

function scanForNewMessages(mutations: MutationRecord[]): void {
  for (const mutation of mutations) {
    for (const node of Array.from(mutation.addedNodes)) {
      if (!(node instanceof Element)) continue;

      const matches = node.matches(config.messageSelector)
        ? [node]
        : Array.from(node.querySelectorAll(config.messageSelector));

      for (const el of matches) {
        if (!processedElements.has(el)) {
          processedElements.add(el);
          extractFromElement(el);
        }
      }
    }

    if (mutation.type === 'characterData' || mutation.type === 'childList') {
      const target = mutation.target;
      if (target instanceof Element && target.matches(config.messageSelector)) {
        extractFromElement(target);
      }
    }
  }
}

const observer = new MutationObserver(scanForNewMessages);
observer.observe(document.body, {
  childList: true,
  subtree: true,
  characterData: true,
});

document.querySelectorAll(config.messageSelector).forEach((el) => {
  processedElements.add(el);
  extractFromElement(el);
});

// ─── Injector ───────────────────────────────────────────────────────────────
// This module handles injecting context prompt text into AI platform input fields.
// It listens for INJECT messages from the popup/background and inserts text
// into the appropriate input element for the current platform.

type Platform = 'chatgpt' | 'claude' | 'perplexity' | 'gemini' | 'copilot' | 'unknown';

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

function findInputField(platform: Platform): HTMLTextAreaElement | HTMLElement | null {
  switch (platform) {
    case 'chatgpt':
      return (
        document.querySelector<HTMLTextAreaElement>('#prompt-textarea') ??
        document.querySelector<HTMLElement>(
          '[contenteditable="true"]',
        ) ??
        document.querySelector<HTMLTextAreaElement>('textarea')
      );

    case 'claude':
      return (
        document.querySelector<HTMLElement>(
          '[contenteditable="true"].ProseMirror',
        ) ??
        document.querySelector<HTMLElement>(
          '[contenteditable="true"][class*="ProseMirror"]',
        ) ??
        document.querySelector<HTMLElement>('[contenteditable="true"]')
      );

    case 'perplexity':
      return document.querySelector<HTMLTextAreaElement>('textarea');

    case 'gemini':
      return (
        document.querySelector<HTMLElement>('[contenteditable="true"]') ??
        document.querySelector<HTMLElement>('.ql-editor') ??
        document.querySelector<HTMLTextAreaElement>('textarea')
      );

    case 'copilot':
      return document.querySelector<HTMLTextAreaElement>('textarea');

    default:
      return null;
  }
}

function insertText(element: HTMLTextAreaElement | HTMLElement, text: string): void {
  if (element instanceof HTMLTextAreaElement) {
    const existing = element.value;
    element.value = text + '\n\n' + existing;
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));

    // For React-based apps, also dispatch a native input event
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype,
      'value',
    )?.set;
    if (nativeInputValueSetter) {
      nativeInputValueSetter.call(element, text + '\n\n' + existing);
      element.dispatchEvent(new Event('input', { bubbles: true }));
    }
  } else {
    // contenteditable element
    const existing = element.innerHTML;

    // Create a paragraph for the injected text
    const textParts = text.split('\n');
    const html = textParts.map((line) => `<p>${line || '<br>'}</p>`).join('');

    element.innerHTML = html + '<p><br></p>' + existing;

    // Dispatch events so frameworks pick up the change
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));

    // Also dispatch a more specific InputEvent
    element.dispatchEvent(
      new InputEvent('input', {
        bubbles: true,
        inputType: 'insertText',
        data: text,
      }),
    );
  }

  element.focus();

  // Move cursor to end
  const selection = window.getSelection();
  if (selection && element.childNodes.length > 0) {
    const range = document.createRange();
    range.selectNodeContents(element);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
  }
}

// ─── Message listener ───────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener(
  (
    message: { type: string; payload?: { text: string } },
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: unknown) => void,
  ) => {
    if (message.type === 'INJECT' && message.payload?.text) {
      const platform = detectPlatform();
      const inputEl = findInputField(platform);

      if (!inputEl) {
        sendResponse({
          success: false,
          error: 'Could not find input field on this page',
        });
        return true;
      }

      try {
        insertText(inputEl, message.payload.text);
        sendResponse({ success: true });
      } catch (err) {
        sendResponse({
          success: false,
          error: String(err),
        });
      }
    }
    return true;
  },
);

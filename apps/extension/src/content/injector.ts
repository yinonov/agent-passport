type Platform = 'chatgpt' | 'claude' | 'perplexity' | 'gemini' | 'copilot';

const INPUT_SELECTORS: Record<Platform, string> = {
  chatgpt: '#prompt-textarea',
  claude: '[contenteditable="true"][data-placeholder]',
  perplexity: 'textarea[placeholder]',
  gemini: '.ql-editor',
  copilot: '#userInput',
};

export function getPlatformInputSelector(platform: Platform): string {
  return INPUT_SELECTORS[platform];
}

export function injectContext(context: string, platform: Platform): boolean {
  const selector = getPlatformInputSelector(platform);
  const input = document.querySelector<HTMLElement>(selector);
  if (!input) return false;

  input.focus();

  if (input instanceof HTMLTextAreaElement || input instanceof HTMLInputElement) {
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype,
      'value',
    )?.set ?? Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value',
    )?.set;

    if (nativeInputValueSetter) {
      nativeInputValueSetter.call(input, context);
    } else {
      input.value = context;
    }

    input.dispatchEvent(new InputEvent('input', { bubbles: true, data: context }));
    input.dispatchEvent(new Event('change', { bubbles: true }));

    const len = input.value.length;
    input.setSelectionRange(len, len);
  } else if (input.isContentEditable) {
    input.textContent = context;
    input.dispatchEvent(new InputEvent('input', { bubbles: true }));

    const selection = window.getSelection();
    if (selection) {
      const range = document.createRange();
      const textNode = input.lastChild ?? input;
      range.setStartAfter(textNode);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }

  return true;
}

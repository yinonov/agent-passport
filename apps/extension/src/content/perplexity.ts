import { generatePack, showToast } from './base';

const SELECTOR = 'textarea[placeholder]';

chrome.runtime.onMessage.addListener((msg: { type: string }) => {
  if (msg.type !== 'INJECT_CONTEXT') return;
  void generatePack('perplexity').then((pack) => {
    if (!pack) { showToast('⚠️ No passport data'); return; }
    const textarea = document.querySelector<HTMLTextAreaElement>(SELECTOR);
    if (!textarea) { showToast('⚠️ Could not find Perplexity input'); return; }
    const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set;
    setter?.call(textarea, pack.systemPrompt);
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    showToast('✅ Agent Passport injected into Perplexity');
  });
});

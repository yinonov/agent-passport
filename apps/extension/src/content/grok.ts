import { generatePack, showToast } from './base';

const SELECTOR = 'textarea, [contenteditable="true"]';

chrome.runtime.onMessage.addListener((msg: { type: string }) => {
  if (msg.type !== 'INJECT_CONTEXT') return;
  void generatePack('grok').then((pack) => {
    if (!pack) { showToast('⚠️ No passport data'); return; }
    const input = document.querySelector<HTMLElement>(SELECTOR);
    if (!input) { showToast('⚠️ Could not find Grok input'); return; }
    if (input instanceof HTMLTextAreaElement) {
      input.value = pack.systemPrompt;
    } else {
      input.textContent = pack.systemPrompt;
    }
    input.dispatchEvent(new Event('input', { bubbles: true }));
    showToast('✅ Agent Passport injected into Grok');
  });
});

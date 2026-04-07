import { generatePack, showToast } from './base';

const SELECTOR = 'rich-textarea .ql-editor, [contenteditable="true"]';

chrome.runtime.onMessage.addListener((msg: { type: string }) => {
  if (msg.type !== 'INJECT_CONTEXT') return;
  void generatePack('gemini').then((pack) => {
    if (!pack) { showToast('⚠️ No passport data'); return; }
    const editor = document.querySelector<HTMLElement>(SELECTOR);
    if (!editor) { showToast('⚠️ Could not find Gemini input'); return; }
    editor.textContent = pack.systemPrompt;
    editor.dispatchEvent(new Event('input', { bubbles: true }));
    showToast('✅ Agent Passport injected into Gemini');
  });
});

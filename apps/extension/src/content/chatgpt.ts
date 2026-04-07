import { generatePack, showToast } from './base';

const SELECTOR = '#prompt-textarea';
const INJECTED_KEY = '__ap_injected__';

type TextareaWithFlag = HTMLTextAreaElement & { [INJECTED_KEY]?: boolean };
type WindowWithPack = Window & { __ap_pack__?: { systemPrompt: string } };

function tryInject(): void {
  const textarea = document.querySelector<TextareaWithFlag>(SELECTOR);
  if (!textarea || textarea[INJECTED_KEY]) return;
  textarea[INJECTED_KEY] = true;

  textarea.addEventListener('focus', () => {
    void generatePack('chatgpt').then((pack) => {
      if (pack) (window as WindowWithPack).__ap_pack__ = pack;
    });
  });
}

chrome.runtime.onMessage.addListener((msg: { type: string }) => {
  if (msg.type !== 'INJECT_CONTEXT') return;
  const pack = (window as WindowWithPack).__ap_pack__;
  if (!pack) { showToast('⚠️ Focus a ChatGPT input first'); return; }
  const textarea = document.querySelector<HTMLTextAreaElement>(SELECTOR);
  if (!textarea) { showToast('⚠️ Could not find ChatGPT input'); return; }
  textarea.value = pack.systemPrompt;
  textarea.dispatchEvent(new Event('input', { bubbles: true }));
  showToast('✅ Agent Passport injected into ChatGPT');
});

setInterval(tryInject, 1000);
tryInject();

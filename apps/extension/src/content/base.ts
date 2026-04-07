import type { PassportPack } from '@agent-passport/schema';

export type Platform = PassportPack['platform'];

export async function generatePack(platform: Platform): Promise<PassportPack | null> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(
      { type: 'GENERATE_PACK', platform },
      (res: { ok: boolean; data: PassportPack }) => {
        resolve(res?.ok ? res.data : null);
      }
    );
  });
}

export function showToast(message: string): void {
  const el = document.createElement('div');
  el.textContent = message;
  el.style.cssText = [
    'position:fixed',
    'bottom:24px',
    'right:24px',
    'z-index:2147483647',
    'background:#1a1a2e',
    'color:#e2e8f0',
    'padding:12px 20px',
    'border-radius:10px',
    'font-family:system-ui,sans-serif',
    'font-size:14px',
    'border:1px solid #6366f1',
    'box-shadow:0 4px 20px rgba(99,102,241,0.3)',
    'pointer-events:none',
  ].join(';');
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

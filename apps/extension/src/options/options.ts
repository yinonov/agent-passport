interface ExtensionSettings {
  platforms: Record<string, boolean>;
  autoInject: boolean;
  retentionDays: number;
}

const DEFAULT_SETTINGS: ExtensionSettings = {
  platforms: {
    chatgpt: true,
    claude: true,
    perplexity: true,
    gemini: true,
    copilot: true,
  },
  autoInject: false,
  retentionDays: 90,
};

async function loadSettings(): Promise<ExtensionSettings> {
  const result = await chrome.storage.local.get('settings');
  const stored = result['settings'] as Partial<ExtensionSettings> | undefined;
  return {
    ...DEFAULT_SETTINGS,
    ...stored,
    platforms: { ...DEFAULT_SETTINGS.platforms, ...(stored?.platforms ?? {}) },
  };
}

async function saveSettings(settings: ExtensionSettings): Promise<void> {
  await chrome.storage.local.set({ settings });
  showSavedToast();
}

function showSavedToast(): void {
  const toast = document.getElementById('saved-toast')!;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2000);
}

function applySettings(settings: ExtensionSettings): void {
  for (const [platform, enabled] of Object.entries(settings.platforms)) {
    const toggle = document.querySelector<HTMLInputElement>(
      `[data-platform="${platform}"]`,
    );
    if (toggle) toggle.checked = enabled;
  }

  const autoInjectToggle = document.getElementById('auto-inject') as HTMLInputElement;
  autoInjectToggle.checked = settings.autoInject;

  const slider = document.getElementById('retention-slider') as HTMLInputElement;
  slider.value = String(settings.retentionDays);

  const valueLabel = document.getElementById('retention-value')!;
  valueLabel.textContent = `${settings.retentionDays} days`;
}

async function getCurrentSettings(): Promise<ExtensionSettings> {
  const platforms: Record<string, boolean> = {};
  document.querySelectorAll<HTMLInputElement>('[data-platform]').forEach((toggle) => {
    const platform = toggle.dataset['platform']!;
    platforms[platform] = toggle.checked;
  });

  const autoInject = (document.getElementById('auto-inject') as HTMLInputElement).checked;
  const retentionDays = parseInt(
    (document.getElementById('retention-slider') as HTMLInputElement).value,
    10,
  );

  return { platforms, autoInject, retentionDays };
}

async function init(): Promise<void> {
  const settings = await loadSettings();
  applySettings(settings);

  document.querySelectorAll<HTMLInputElement>('[data-platform]').forEach((toggle) => {
    toggle.addEventListener('change', async () => {
      const current = await getCurrentSettings();
      await saveSettings(current);
    });
  });

  document.getElementById('auto-inject')?.addEventListener('change', async () => {
    const current = await getCurrentSettings();
    await saveSettings(current);
  });

  const slider = document.getElementById('retention-slider') as HTMLInputElement;
  const valueLabel = document.getElementById('retention-value')!;

  slider.addEventListener('input', () => {
    valueLabel.textContent = `${slider.value} days`;
  });

  slider.addEventListener('change', async () => {
    const current = await getCurrentSettings();
    await saveSettings(current);
  });

  document.getElementById('btn-clear')?.addEventListener('click', async () => {
    const confirmed = confirm(
      'Are you sure you want to delete ALL memories? This cannot be undone.',
    );
    if (confirmed) {
      await chrome.storage.local.remove('memoryStore');
      alert('All memories have been cleared.');
    }
  });
}

document.addEventListener('DOMContentLoaded', init);

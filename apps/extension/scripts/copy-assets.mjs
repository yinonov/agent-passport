import { copyFileSync, mkdirSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const dist = resolve(root, 'dist');

// Copy manifest
copyFileSync(resolve(root, 'manifest.json'), resolve(dist, 'manifest.json'));

// Ensure icons dir
mkdirSync(resolve(dist, 'icons'), { recursive: true });

// Minimal 1x1 transparent PNG placeholder
const placeholder = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);

// Copy icons if they exist, otherwise create placeholder
const icons = ['icon16.png', 'icon48.png', 'icon128.png'];
for (const icon of icons) {
  const src = resolve(root, 'public', 'icons', icon);
  const dest = resolve(dist, 'icons', icon);
  try {
    copyFileSync(src, dest);
  } catch {
    writeFileSync(dest, placeholder);
  }
}

console.log('✅ Extension assets copied to dist/');


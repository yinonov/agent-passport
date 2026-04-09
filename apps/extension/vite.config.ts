import { defineConfig } from 'vite';
import { resolve } from 'path';
import { copyFileSync, mkdirSync, existsSync } from 'fs';

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        'background/service-worker': resolve(__dirname, 'background/service-worker.ts'),
        'content/content-script': resolve(__dirname, 'content/content-script.ts'),
        'content/injector': resolve(__dirname, 'content/injector.ts'),
        'popup/popup': resolve(__dirname, 'popup/popup.ts'),
      },
      output: {
        format: 'es',
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name]-[hash].js',
      },
    },
    target: 'esnext',
    minify: false,
    sourcemap: false,
  },
  plugins: [
    {
      name: 'copy-extension-files',
      closeBundle() {
        const distDir = resolve(__dirname, 'dist');
        const popupDir = resolve(distDir, 'popup');
        const optionsDir = resolve(distDir, 'options');
        const iconsDir = resolve(distDir, 'icons');

        for (const dir of [popupDir, optionsDir, iconsDir]) {
          if (!existsSync(dir)) {
            mkdirSync(dir, { recursive: true });
          }
        }

        copyFileSync(
          resolve(__dirname, 'manifest.json'),
          resolve(distDir, 'manifest.json')
        );
        copyFileSync(
          resolve(__dirname, 'popup/popup.html'),
          resolve(popupDir, 'popup.html')
        );
        copyFileSync(
          resolve(__dirname, 'options/options.html'),
          resolve(optionsDir, 'options.html')
        );

        // Copy icons if they exist
        for (const size of ['16', '48', '128']) {
          const iconSrc = resolve(__dirname, `icons/icon-${size}.png`);
          if (existsSync(iconSrc)) {
            copyFileSync(iconSrc, resolve(iconsDir, `icon-${size}.png`));
          }
        }
      },
    },
  ],
});

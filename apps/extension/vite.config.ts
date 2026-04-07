import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        background: resolve(__dirname, 'src/background/index.ts'),
        popup: resolve(__dirname, 'src/popup/index.html'),
        'content-chatgpt': resolve(__dirname, 'src/content/chatgpt.ts'),
        'content-claude': resolve(__dirname, 'src/content/claude.ts'),
        'content-perplexity': resolve(__dirname, 'src/content/perplexity.ts'),
        'content-gemini': resolve(__dirname, 'src/content/gemini.ts'),
        'content-grok': resolve(__dirname, 'src/content/grok.ts'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name].js',
        assetFileNames: '[name].[ext]',
      },
    },
    target: 'chrome120',
    minify: false,
  },
  resolve: {
    alias: {
      '@agent-passport/schema': resolve(__dirname, '../../packages/schema/src/index.ts'),
      '@agent-passport/core': resolve(__dirname, '../../packages/core/src/index.ts'),
    },
  },
});

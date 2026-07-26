import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  base: './',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        editor: resolve(__dirname, 'editor.html'),
      },
      output: {
        // Keep i18n as a separate chunk so index.html can import it
        manualChunks: (id) => {
          if (id.includes('src/i18n')) {
            return 'i18n';
          }
        },
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]',
      },
    },
    // Inline everything else into editor.html
    assetsInlineLimit: 0,
  },
  server: {
    open: '/editor.html',
  },
});

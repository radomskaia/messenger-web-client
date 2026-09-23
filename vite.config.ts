import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages serves a project site from /<repo>/, so built asset URLs need
  // that prefix. CI passes it in; a build run locally stays at the root.
  base: process.env['BASE_PATH'] ?? '/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    // Process CSS Modules in tests so className is not undefined.
    css: true,
    restoreMocks: true,
  },
});

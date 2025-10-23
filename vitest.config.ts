import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './vitest.setup.js',
    globals: true,
    include: ['test/**/*.test.{js,jsx,ts,tsx}', 'test/**/*.spec.{js,jsx,ts,tsx}'],
    testTransformMode: {
      web: ['.jsx', '.tsx', '.js', '.ts'],
    },
    deps: {
      inline: ['src'],
    },
  },
  // server config eliminado, deps solo en test
});

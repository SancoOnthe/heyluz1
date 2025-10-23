import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  test: {
    environment: 'jsdom',
    setupFiles: './vitest.setup.js',
    globals: true,
    include: ['test/**/*.test.{js,jsx,ts,tsx}','test/**/*.spec.{js,jsx,ts,tsx}'],
    // Allow transforming JSX even in .js files (the repo has many .js files containing JSX)
    transformMode: {
      web: [/\.jsx?$/]
    }
  },
  server: {
    deps: {
      inline: ['src']
    }
  }
});

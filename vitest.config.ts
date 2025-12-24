import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        '.next/',
        'coverage/',
        '**/*.config.{js,ts}',
        '**/types.ts',
        'prisma/migrations/',
        'src/test/**',
        'src/lib/__mocks__/**',
      ],
    },
    environmentMatchGlobs: [
      // Use jsdom only for component tests
      ['src/components/**/*.test.tsx', 'jsdom'],
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
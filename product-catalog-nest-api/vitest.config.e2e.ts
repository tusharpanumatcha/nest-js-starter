import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    // e2e tests run against a fresh in-memory MongoDB, seeded with the sample data
    env: { MONGODB_URI: 'memory' },
    testTimeout: 30_000,
    hookTimeout: 120_000,
  },
});

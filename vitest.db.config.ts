import { defineConfig } from 'vitest/config'

/** Tests d'intégration du schéma : exigent une base PostgreSQL dont le nom finit par `_test`. */
export default defineConfig({
  test: {
    include: ['tests/db/**/*.test.ts'],
    environment: 'node',
    fileParallelism: false,
    testTimeout: 30000,
    hookTimeout: 60000
  }
})

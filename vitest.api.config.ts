import { API_TEST_SETUP_TIMEOUT_MS } from './tests/api/helpers/nuxt-setup'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/api/**/*.test.ts'],
    testTimeout: 120000,
    hookTimeout: API_TEST_SETUP_TIMEOUT_MS,
    fileParallelism: false
  }
})

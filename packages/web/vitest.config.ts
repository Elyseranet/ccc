import { defineVitestProject } from '@nuxt/test-utils/config'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'unit',
          environment: 'node',
          include: ['tests/unit/**/*.test.ts']
        }
      },
      await defineVitestProject({
        test: {
          name: 'front',
          hookTimeout: 60000,
          environment: 'nuxt',
          include: ['tests/nuxt/**/*.test.ts'],
          environmentOptions: {
            nuxt: {
              domEnvironment: 'happy-dom'
            }
          }
        }
      })
    ]
  }
})

import { defineConfig } from 'vitest/config'

/** Contrôles sur la sortie de `nuxt build` (`npm run test:bundle`) : à lancer après le build de production. */
export default defineConfig({
  test: {
    include: ['tests/build/**/*.test.ts'],
    environment: 'node'
  }
})

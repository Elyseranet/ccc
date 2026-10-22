import { defineConfig } from '@playwright/test'

const PORT = Number(process.env.E2E_PORT ?? 3100)
const BASE_URL = process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`

export default defineConfig({
  testDir: 'tests/e2e',
  // ARCH-9 : base de test réelle (suffixe _test), chargée par le seed SQL des archives, comptes et sessions de test.
  globalSetup: './tests/e2e/global-setup.ts',
  fullyParallel: true,
  reporter: [['list']],
  use: {
    baseURL: BASE_URL,
    reducedMotion: 'reduce',
    locale: 'fr-FR',
    testIdAttribute: 'data-cy'
  },
  webServer: {
    command: `E2E=true npx nuxt dev --port ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: true,
    timeout: 120000
  },
  projects: [
    { name: 'routes', testMatch: /(redirects|access)\.spec\.ts/ },
    { name: 'a11y', testMatch: /a11y(\.spec\.ts|\/.*\.spec\.ts)$/ },
    { name: 'visual', testMatch: /visual(\.spec\.ts|\/.*\.spec\.ts)$/ }
  ]
})

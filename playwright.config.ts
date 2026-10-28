import { defineConfig } from '@playwright/test'
import { E2E_SECURE_COOKIE } from './tests/e2e/helpers/e2e.const'

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
    // HTTP local : cookies sans Secure ni préfixe __Host- (L3), le nom du cookie e2e en est dérivé (E2E_SESSION_COOKIE).
    // Un serveur déjà lancé (reuseExistingServer) doit l'avoir été avec la même valeur.
    command: `E2E=true NUXT_AUTH_SECURE_COOKIE=${E2E_SECURE_COOKIE} npx nuxt dev --port ${PORT}`,
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

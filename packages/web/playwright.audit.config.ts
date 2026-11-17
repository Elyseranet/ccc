import { defineConfig } from '@playwright/test'
import base from './playwright.config'

/*********************************************************
 * Audit des espacements (F-63) : `npm run audit:spacing`
 *
 * @description
 * Même serveur, même base de test et mêmes sessions que les e2e (`playwright.config.ts`, global-setup), mais hors des
 * projets e2e : l'audit écrit un rapport (`test-results/spacing-audit.md`) et ne fait échouer aucune suite.
 ********************************************************/
export default defineConfig({
  ...base,
  testDir: 'tests/e2e/audit',
  testMatch: /\.audit\.ts$/,
  projects: [{ name: 'audit' }],
  // L'audit tourne souvent sur une machine chargée (plusieurs agents) : le premier `nuxt dev` peut dépasser les 2 min de la config e2e.
  webServer: { ...base.webServer, timeout: 600000 } as typeof base.webServer
})

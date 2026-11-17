import { defineConfig } from '@playwright/test'
import base from './playwright.config'

/*********************************************************
 * Audit des espacements (F-63) : `npm run audit:spacing`
 *
 * @description
 * Même serveur, même base de test et mêmes sessions que les e2e (`playwright.config.ts`, global-setup), mais hors des
 * projets e2e : l'audit écrit un rapport (`docs/audits/F-63-espacements.md`) et ne fait échouer aucune suite.
 ********************************************************/
export default defineConfig({
  ...base,
  testDir: 'tests/e2e/audit',
  testMatch: /\.audit\.ts$/,
  projects: [{ name: 'audit' }]
})

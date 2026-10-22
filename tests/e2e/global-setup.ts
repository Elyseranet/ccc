import { spawnSync } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { E2E_SESSIONS_FILE } from './helpers/e2e.const'

/*********************************************************
 * Préparation des e2e (ARCH-9) : base de test réelle
 *
 * @description
 * Les e2e tournent sur les vraies données : la base `NUXT_DATABASE_DATABASE` (suffixe `_test` obligatoire) est remise
 * à neuf, chargée par le seed SQL des archives, puis reçoit les comptes et sessions de test. Exécuté par vite-node
 * pour que les entités TypeORM (décorateurs) se chargent comme sous Vitest.
 ********************************************************/
export default function globalSetup (): void {
  mkdirSync(dirname(E2E_SESSIONS_FILE), { recursive: true })
  const result = spawnSync('npx', ['vite-node', 'tests/e2e/helpers/prepare-database.ts'], { stdio: 'inherit', env: process.env })
  if (result.status !== 0) {
    throw new Error('Préparation de la base e2e en échec (voir la sortie ci-dessus)')
  }
}

import { readFileSync } from 'node:fs'
import type { BrowserContext } from '@playwright/test'
import { E2E_BASE_URL, E2E_SESSION_COOKIE, E2E_SESSIONS_FILE } from './e2e.const'

/**
 * `admin-logout` : session administrateur réservée au test de déconnexion, qui la révoque.
 * `member` : participant rattaché à un compétiteur réel, en lecture seule (profil, captures).
 * `member-edit` : participant dont les tests modifient le téléphone, l'avatar et le mot de passe.
 * `member-logout`, `member-logout-header`, `admin-logout-header` : sessions que les tests de déconnexion révoquent (profil, en-tête).
 */
type TE2eRole = 'admin' | 'admin-logout' | 'admin-logout-header' | 'participant' | 'member' | 'member-edit' | 'member-logout' | 'member-logout-header' | 'member-expired'

interface IE2eSecrets {
  /** Mots de passe tirés au hasard par `prepare-database.ts` : `login` (participant), `loginAdmin`, `edit` (compte `member-edit`). */
  passwords: { login: string, loginAdmin: string, edit: string }
  /** Jetons d'invitation en clair : `valid` (lecture), `flow` (activation), `expired`, `consumed`. */
  invitations: { valid: string, flow: string, expired: string, consumed: string }
}

const readSecrets = (): Record<TE2eRole, string> & IE2eSecrets =>
  JSON.parse(readFileSync(E2E_SESSIONS_FILE, 'utf8')) as Record<TE2eRole, string> & IE2eSecrets

/** Pose le cookie d'une session réelle créée en base par `prepare-database.ts` (plus de session de fixture, ARCH-8). */
export const signIn = async (context: BrowserContext, role: TE2eRole): Promise<void> => {
  await context.addCookies([{ name: E2E_SESSION_COOKIE, value: readSecrets()[role], url: E2E_BASE_URL, httpOnly: true, sameSite: 'Lax' }])
}

/** Mots de passe et jetons d'invitation des comptes de test (fichier gitignoré, jamais dans le dépôt). */
export const e2eSecrets = (): IE2eSecrets => {
  const { passwords, invitations } = readSecrets()
  return { passwords, invitations }
}

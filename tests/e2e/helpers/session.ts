import { readFileSync } from 'node:fs'
import type { BrowserContext } from '@playwright/test'
import { E2E_BASE_URL, E2E_SESSION_COOKIE, E2E_SESSIONS_FILE } from './e2e.const'

/** `admin-logout` : session administrateur réservée au test de déconnexion, qui la révoque. */
type TE2eRole = 'admin' | 'admin-logout' | 'participant'

/** Pose le cookie d'une session réelle créée en base par `prepare-database.ts` (plus de session de fixture, ARCH-8). */
export const signIn = async (context: BrowserContext, role: TE2eRole): Promise<void> => {
  const sessions = JSON.parse(readFileSync(E2E_SESSIONS_FILE, 'utf8')) as Record<TE2eRole, string>
  await context.addCookies([{ name: E2E_SESSION_COOKIE, value: sessions[role], url: E2E_BASE_URL, httpOnly: true, sameSite: 'Lax' }])
}

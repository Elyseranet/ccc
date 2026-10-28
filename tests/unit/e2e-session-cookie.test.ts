import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { E2E_SECURE_COOKIE, E2E_SESSION_COOKIE } from '../e2e/helpers/e2e.const'
import { getSessionCookieName } from '../../src/utils/session-token.util'
import { SESSION_COOKIE_NAME } from '../../src/consts/auth.const'

const PLAYWRIGHT_CONFIG = fileURLToPath(new URL('../../playwright.config.ts', import.meta.url))

// L3 (T-SEC-04) : le nom du cookie de session dépend de NUXT_AUTH_SECURE_COOKIE. Les e2e posent leur cookie
// eux-mêmes (signIn) : s'il ne porte pas le nom que lit le serveur, toute session admin retombe sur /connexion.
describe('e2e session cookie (nuxt dev)', () => {
  it('starts the dev server with the secure-cookie setting the e2e cookie name is derived from', () => {
    expect(readFileSync(PLAYWRIGHT_CONFIG, 'utf8')).toContain('NUXT_AUTH_SECURE_COOKIE=${E2E_SECURE_COOKIE}')
  })

  it('uses the cookie name the server reads for that setting (environment value is a string)', () => {
    expect(E2E_SESSION_COOKIE).toBe(getSessionCookieName({ secureCookie: String(E2E_SECURE_COOKIE) }))
    expect(E2E_SESSION_COOKIE).toBe(SESSION_COOKIE_NAME)
  })
})

import type { Browser, BrowserContext, Page } from '@playwright/test'
import { E2E_BASE_URL } from '../helpers/e2e.const'
import { signIn } from '../helpers/session'
import type { TSpacingAuditRole } from './spacing.const'

/*********************************************************
 * Outils communs des audits d'espacement (F-63, F-64)
 *
 * @description
 * Contexte de navigation avec la session réelle du rôle, ouverture d'une page hydratée et stabilisée (réseau au repos,
 * squelettes d'`async-state` retirés), échappement d'une cellule de tableau Markdown.
 ********************************************************/
export const settle = async (page: Page) => {
  await page.waitForLoadState('networkidle')
  await page.locator('[data-cy="async-state-loading"]').first().waitFor({ state: 'detached', timeout: 10000 }).catch(() => undefined)
}

export const open = async (page: Page, path: string) => {
  await page.goto(path)
  await page.waitForFunction(() => (window as unknown as { useNuxtApp?: () => { isHydrating: boolean } }).useNuxtApp?.().isHydrating === false, undefined, { timeout: 30000 }).catch(() => undefined)
  await settle(page)
}

export const newContext = async (browser: Browser, role: TSpacingAuditRole): Promise<BrowserContext> => {
  const context = await browser.newContext({ baseURL: E2E_BASE_URL, reducedMotion: 'reduce', locale: 'fr-FR' })
  if (role !== 'anonymous') await signIn(context, role)
  return context
}

export const md = (value: string | number) => String(value).replaceAll('|', '\\|')

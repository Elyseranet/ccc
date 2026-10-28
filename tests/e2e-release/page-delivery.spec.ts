import { existsSync, readFileSync } from 'node:fs'
import { expect, test } from '@playwright/test'
import { SESSION_COOKIE_NAME_PRODUCTION } from '../../src/consts/auth.const'
import { ROUTES } from '../../src/consts/routes.const'
import { E2E_SESSIONS_FILE } from '../e2e/helpers/e2e.const'
import { ADMIN_PAGES, PUBLIC_PAGES, REDIRECTS } from '../e2e/pages.const'

/*********************************************************
 * Masquage des pages non livrées sur le build de production (OPS-3)
 *
 * @description
 * Tant qu'une page n'est pas `delivered` dans `PAGE_DELIVERY`, elle répond 404 (vrai statut HTTP en SSR),
 * sans lien dans la navigation, même avec un cookie de session présenté.
 * Quand un ticket F-xx livre sa page, il **ajoute** sa route à `DELIVERED_PAGES` ci-dessous : elle n'est alors plus attendue en 404.
 ********************************************************/
const DELIVERED_PAGES: string[] = [ROUTES.ADMIN_MORE]
const ADMIN_MORE_NAV_DATA_CY = 'admin-more-nav'

const hidden = (pages: string[]): string[] => pages.filter(page => !DELIVERED_PAGES.includes(page))

test.describe('pages non livrées', () => {
  for (const page of hidden([...PUBLIC_PAGES, ...ADMIN_PAGES])) {
    test(`${page} répond 404`, async ({ request }) => {
      const response = await request.get(page, { maxRedirects: 0 })
      expect(response.status()).toBe(404)
    })
  }

  test('aucun lien vers une page non livrée dans la réponse 404', async ({ request }) => {
    const html = await (await request.get('/', { maxRedirects: 0 })).text()
    for (const href of ['/editions', '/joueurs', '/palmares', '/regles', '/connexion', '/admin']) {
      expect(html).not.toContain(`href="${href}"`)
    }
  })

  test('un cookie de session présenté ne rend pas visible une page non livrée', async ({ request }) => {
    const response = await request.get('/admin', {
      maxRedirects: 0,
      headers: { cookie: `${SESSION_COOKIE_NAME_PRODUCTION}=${'x'.repeat(43)}` }
    })
    expect(response.status()).toBe(404)
  })

  for (const { from } of REDIRECTS) {
    test(`${from} : la chaîne de redirection se termine en 404`, async ({ request }) => {
      const response = await request.get(from)
      expect(response.status()).toBe(404)
    })
  }
})

test('la sonde de santé reste publique', async ({ request }) => {
  const response = await request.get('/api/v1/health')
  expect([200, 503]).toContain(response.status())
})

test.describe(`page livrée ${ROUTES.ADMIN_MORE} (T-LIVE-01)`, () => {
  test('sans session, redirige vers /connexion (pas 404)', async ({ request }) => {
    const response = await request.get(ROUTES.ADMIN_MORE, { maxRedirects: 0 })
    expect(response.status()).toBe(302)
    expect(response.headers().location).toBe(ROUTES.LOGIN)
  })

  test('avec la session administrateur de la base amorcée, répond 200', async ({ request }) => {
    const token = process.env.E2E_ADMIN_SESSION ?? (existsSync(E2E_SESSIONS_FILE) ? (JSON.parse(readFileSync(E2E_SESSIONS_FILE, 'utf8')) as Record<string, string>).admin : undefined)
    expect(token, 'aucune session administrateur : définir E2E_ADMIN_SESSION avec le jeton de la base amorcée par global-setup (tests/e2e/helpers/prepare-database.ts) ou lancer Playwright une fois pour écrire le fichier de sessions').toBeTruthy()
    const response = await request.get(ROUTES.ADMIN_MORE, { maxRedirects: 0, headers: { cookie: `${SESSION_COOKIE_NAME_PRODUCTION}=${token}` } })
    expect(response.status()).toBe(200)
    expect(await response.text()).toContain(`data-cy="${ADMIN_MORE_NAV_DATA_CY}"`)
  })
})

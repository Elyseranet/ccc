import { expect, test } from '@playwright/test'
import { ADMIN_PAGES, PUBLIC_PAGES, REDIRECTS } from '../e2e/pages.const'

/*********************************************************
 * Masquage des pages non livrées sur le build de production (OPS-3)
 *
 * @description
 * Tant qu'une page n'est pas `delivered` dans `PAGE_DELIVERY`, elle répond 404 (vrai statut HTTP en SSR),
 * sans lien dans la navigation, même avec un cookie de session présenté.
 * Quand un ticket F-xx livre sa page, il retire la route de `DELIVERED_PAGES` ci-dessous.
 ********************************************************/
const DELIVERED_PAGES: string[] = []

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
      headers: { cookie: `__Host-ccc_session=${'x'.repeat(43)}` }
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

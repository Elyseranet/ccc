import { existsSync, readFileSync } from 'node:fs'
import { expect, test } from '@playwright/test'
import { SESSION_COOKIE_NAME_PRODUCTION } from '../../src/consts/auth.const'
import { SEO_ROBOTS_NOINDEX } from '../../src/consts/seo.const'
import { ROUTES } from '../../src/consts/routes.const'
import { E2E_SESSIONS_FILE } from '../e2e/helpers/e2e.const'

/*********************************************************
 * Référencement dans le conteneur de production (T-SEO-01)
 *
 * @description
 * Les pages privées (admin, connexion, profil, invitation) répondent `X-Robots-Tag: noindex, nofollow` et portent la meta `robots`, même
 * quand elles redirigent. Les pages publiques livrées ont chacune un titre et une description uniques, une canonique et Open Graph.
 ********************************************************/
const INVITATION_PAGE = '/invitation/jeton-de-test'
const ROBOTS_META = `<meta name="robots" content="${SEO_ROBOTS_NOINDEX}">`
const PUBLIC_PAGES = ['/', ROUTES.RULES, ROUTES.PLAYERS, ROUTES.HEAD_TO_HEAD, '/editions/2025']

const adminToken = (): string | undefined => process.env.E2E_ADMIN_SESSION ?? (existsSync(E2E_SESSIONS_FILE) ? (JSON.parse(readFileSync(E2E_SESSIONS_FILE, 'utf8')) as Record<string, string>).admin : undefined)

const titleOf = (html: string): string => /<title>([^<]*)<\/title>/.exec(html)?.[1] ?? ''
const metaOf = (html: string, attribute: 'name' | 'property', key: string): string =>
  new RegExp(`<meta ${attribute}="${key}" content="([^"]*)"`).exec(html)?.[1] ?? ''

test.describe('pages privées : noindex, nofollow', () => {
  for (const page of [ROUTES.LOGIN, INVITATION_PAGE]) {
    test(`${page} : en-tête et meta robots`, async ({ request }) => {
      const response = await request.get(page, { maxRedirects: 0 })
      expect(response.status()).toBe(200)
      expect(response.headers()['x-robots-tag']).toBe(SEO_ROBOTS_NOINDEX)
      expect(await response.text()).toContain(ROBOTS_META)
    })
  }

  for (const page of [ROUTES.PROFILE, ROUTES.ADMIN_MORE]) {
    test(`${page} sans session : la redirection vers /connexion porte l’en-tête noindex`, async ({ request }) => {
      const response = await request.get(page, { maxRedirects: 0 })
      expect(response.status()).toBe(302)
      expect(response.headers()['x-robots-tag']).toBe(SEO_ROBOTS_NOINDEX)
    })
  }

  test(`${ROUTES.ADMIN_MORE} avec la session administrateur : en-tête et meta robots`, async ({ request }) => {
    const token = adminToken()
    expect(token, 'aucune session administrateur (voir page-delivery.spec.ts)').toBeTruthy()
    const response = await request.get(ROUTES.ADMIN_MORE, { maxRedirects: 0, headers: { cookie: `${SESSION_COOKIE_NAME_PRODUCTION}=${token}` } })
    expect(response.status()).toBe(200)
    expect(response.headers()['x-robots-tag']).toBe(SEO_ROBOTS_NOINDEX)
    expect(await response.text()).toContain(ROBOTS_META)
  })

  test('le lien d’invitation ne part pas en référent et n’est pas mis en cache', async ({ request }) => {
    const response = await request.get(INVITATION_PAGE, { maxRedirects: 0 })
    expect(response.headers()['referrer-policy']).toBe('no-referrer')
    expect(response.headers()['cache-control']).toContain('no-store')
  })
})

test.describe('pages publiques livrées : métadonnées', () => {
  test.describe.configure({ mode: 'serial' })
  const seen: Array<{ page: string, title: string, description: string }> = []

  for (const page of PUBLIC_PAGES) {
    test(`${page} : titre, description, canonique et Open Graph`, async ({ request }) => {
      const response = await request.get(page, { maxRedirects: 0 })
      expect(response.status()).toBe(200)
      const html = await response.text()
      const title = titleOf(html)
      const description = metaOf(html, 'name', 'description')
      expect(title.length).toBeGreaterThan(0)
      expect(title.length).toBeLessThanOrEqual(60)
      expect(description.length).toBeGreaterThan(0)
      expect(description.length).toBeLessThanOrEqual(160)
      expect(html).toMatch(/<link rel="canonical" href="https?:\/\/[^"?#]+"/)
      expect(metaOf(html, 'property', 'og:title')).toBe(title)
      expect(metaOf(html, 'property', 'og:description')).toBe(description)
      expect(metaOf(html, 'property', 'og:url')).toMatch(/^https?:\/\//)
      expect(metaOf(html, 'property', 'og:locale')).toBe('fr_FR')
      expect(metaOf(html, 'name', 'twitter:card')).toBe('summary')
      expect(html).not.toContain('property="og:image"')
      seen.push({ page, title, description })
    })
  }

  test('titres et descriptions sont uniques d’une page à l’autre', () => {
    expect(seen).toHaveLength(PUBLIC_PAGES.length)
    expect(new Set(seen.map(entry => entry.title)).size).toBe(seen.length)
    expect(new Set(seen.map(entry => entry.description)).size).toBe(seen.length)
  })
})

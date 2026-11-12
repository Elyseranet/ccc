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
const EDITION_PAGE = '/editions/2025'
const EDITIONS_INDEX = '/editions'
const PLAYER_PAGE = '/joueurs/b20dfa9e-222d-46cf-a229-8fd77cc2edca'
const INVITATION_PAGE = '/invitation/jeton-de-test'
/** Pages livrées, sauf l'admin et le profil : publiques, 200 sans session (`/editions` renvoie vers l'édition en cours, A5 ; un jeton d'invitation inconnu donne l'état « lien inconnu »). */
const DELIVERED_PUBLIC_PAGES: string[] = ['/', EDITIONS_INDEX, EDITION_PAGE, ROUTES.PLAYERS, PLAYER_PAGE, ROUTES.HEAD_TO_HEAD, ROUTES.RULES, ROUTES.LOGIN, INVITATION_PAGE, ROUTES.HALL_OF_FAME]
/** `/profil` est livré mais réservé à un compte : sans session il redirige vers `/connexion` (testé plus bas). */
const DELIVERED_PAGES: string[] = [ROUTES.ADMIN_DRAWS, ROUTES.ADMIN_MATCHES, ROUTES.ADMIN_MORE, ROUTES.ADMIN_PARTICIPANTS, ...DELIVERED_PUBLIC_PAGES, ROUTES.PROFILE]
const ADMIN_MORE_NAV_DATA_CY = 'admin-more-nav'
const ADMIN_PARTICIPANTS_DATA_CY = 'admin-participants'
const ADMIN_MATCHES_DATA_CY = 'admin-matches'
const ADMIN_DRAWS_DATA_CY = 'admin-draws'

const hidden = (pages: string[]): string[] => pages.filter(page => !DELIVERED_PAGES.includes(page))

test.describe('pages non livrées', () => {
  for (const page of hidden([...PUBLIC_PAGES, ...ADMIN_PAGES])) {
    test(`${page} répond 404`, async ({ request }) => {
      const response = await request.get(page, { maxRedirects: 0 })
      expect(response.status()).toBe(404)
    })
  }

  test('aucun lien vers une page non livrée dans l’accueil ; `/palmares` livré (F-02), ses liens d’accueil sont présents (T-REL-02, ab1a6b4)', async ({ request }) => {
    const html = await (await request.get('/', { maxRedirects: 0 })).text()
    for (const href of hidden([ROUTES.HALL_OF_FAME, ROUTES.LOGIN, ROUTES.ADMIN])) {
      expect(html).not.toContain(`href="${href}"`)
    }
    for (const dataCy of ['home-cta-secondary', 'home-rank-more']) {
      expect(html).toContain(`data-cy="${dataCy}"`)
    }
    expect(html).toContain('data-cy="home-tile-champion"')
  })

  test('un cookie de session présenté ne rend pas visible une page non livrée', async ({ request }) => {
    const response = await request.get('/admin', {
      maxRedirects: 0,
      headers: { cookie: `${SESSION_COOKIE_NAME_PRODUCTION}=${'x'.repeat(43)}` }
    })
    expect(response.status()).toBe(404)
  })

  for (const { from } of REDIRECTS.filter(redirect => !DELIVERED_PAGES.includes(redirect.to.split('#')[0] as string))) {
    test(`${from} : la chaîne de redirection se termine en 404`, async ({ request }) => {
      const response = await request.get(from)
      expect(response.status()).toBe(404)
    })
  }
})

test.describe('pages livrées publiques (T-REL-02)', () => {
  for (const page of DELIVERED_PUBLIC_PAGES.filter(entry => entry !== EDITIONS_INDEX)) {
    test(`${page} répond 200 sans session, avec un titre de page`, async ({ request }) => {
      const response = await request.get(page, { maxRedirects: 0 })
      expect(response.status()).toBe(200)
      expect(await response.text()).toContain('<h1')
    })
  }

  test(`${EDITIONS_INDEX} renvoie vers l’édition en cours (302 côté serveur)`, async ({ request }) => {
    const response = await request.get(EDITIONS_INDEX, { maxRedirects: 0 })
    expect(response.status()).toBe(302)
    expect(response.headers().location).toMatch(/^\/editions\/.+/)
  })

  for (const { from, to } of REDIRECTS.filter(redirect => DELIVERED_PAGES.includes(redirect.to.split('#')[0] as string))) {
    test(`${from} mène à ${to} (200)`, async ({ request }) => {
      const response = await request.get(from)
      expect(response.status()).toBe(200)
    })
  }
})

test.describe('page d’erreur CCC (F-19, décision 9639ca1)', () => {
  test('une adresse inconnue répond 404 avec la page d’erreur, noindex, le pied de page et aucun message technique', async ({ request }) => {
    const response = await request.get('/page-qui-nexiste-pas', { maxRedirects: 0 })
    expect(response.status()).toBe(404)
    const html = await response.text()
    expect(html).toContain('data-cy="error-page"')
    expect(html).toContain('Erreur 404')
    expect(html).toMatch(/<meta[^>]+name="robots"[^>]+content="[^"]*noindex/)
    expect(html).toContain('data-cy="footer-copyright"')
    expect(html).not.toContain('Cannot read properties')
  })
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

test.describe(`page livrée ${ROUTES.ADMIN_PARTICIPANTS} (F-09)`, () => {
  test('sans session, redirige vers /connexion (pas 404)', async ({ request }) => {
    const response = await request.get(ROUTES.ADMIN_PARTICIPANTS, { maxRedirects: 0 })
    expect(response.status()).toBe(302)
    expect(response.headers().location).toBe(ROUTES.LOGIN)
  })

  test('avec la session administrateur de la base amorcée, répond 200', async ({ request }) => {
    const token = process.env.E2E_ADMIN_SESSION ?? (existsSync(E2E_SESSIONS_FILE) ? (JSON.parse(readFileSync(E2E_SESSIONS_FILE, 'utf8')) as Record<string, string>).admin : undefined)
    expect(token, 'aucune session administrateur : définir E2E_ADMIN_SESSION avec le jeton de la base amorcée par global-setup (tests/e2e/helpers/prepare-database.ts) ou lancer Playwright une fois pour écrire le fichier de sessions').toBeTruthy()
    const response = await request.get(ROUTES.ADMIN_PARTICIPANTS, { maxRedirects: 0, headers: { cookie: `${SESSION_COOKIE_NAME_PRODUCTION}=${token}` } })
    expect(response.status()).toBe(200)
    expect(await response.text()).toContain(`data-cy="${ADMIN_PARTICIPANTS_DATA_CY}"`)
  })
})

test.describe(`page livrée ${ROUTES.ADMIN_MATCHES} (F-08)`, () => {
  test('sans session, redirige vers /connexion (pas 404)', async ({ request }) => {
    const response = await request.get(ROUTES.ADMIN_MATCHES, { maxRedirects: 0 })
    expect(response.status()).toBe(302)
    expect(response.headers().location).toBe(ROUTES.LOGIN)
  })

  test('avec la session administrateur de la base amorcée, répond 200', async ({ request }) => {
    const token = process.env.E2E_ADMIN_SESSION ?? (existsSync(E2E_SESSIONS_FILE) ? (JSON.parse(readFileSync(E2E_SESSIONS_FILE, 'utf8')) as Record<string, string>).admin : undefined)
    expect(token, 'aucune session administrateur : définir E2E_ADMIN_SESSION avec le jeton de la base amorcée par global-setup (tests/e2e/helpers/prepare-database.ts) ou lancer Playwright une fois pour écrire le fichier de sessions').toBeTruthy()
    const response = await request.get(ROUTES.ADMIN_MATCHES, { maxRedirects: 0, headers: { cookie: `${SESSION_COOKIE_NAME_PRODUCTION}=${token}` } })
    expect(response.status()).toBe(200)
    expect(await response.text()).toContain(`data-cy="${ADMIN_MATCHES_DATA_CY}"`)
  })
})

test.describe(`page livrée ${ROUTES.ADMIN_DRAWS} (F-11)`, () => {
  test('sans session, redirige vers /connexion (pas 404)', async ({ request }) => {
    const response = await request.get(ROUTES.ADMIN_DRAWS, { maxRedirects: 0 })
    expect(response.status()).toBe(302)
    expect(response.headers().location).toBe(ROUTES.LOGIN)
  })

  test('avec la session administrateur de la base amorcée, répond 200', async ({ request }) => {
    const token = process.env.E2E_ADMIN_SESSION ?? (existsSync(E2E_SESSIONS_FILE) ? (JSON.parse(readFileSync(E2E_SESSIONS_FILE, 'utf8')) as Record<string, string>).admin : undefined)
    expect(token, 'aucune session administrateur : définir E2E_ADMIN_SESSION avec le jeton de la base amorcée par global-setup (tests/e2e/helpers/prepare-database.ts) ou lancer Playwright une fois pour écrire le fichier de sessions').toBeTruthy()
    const response = await request.get(ROUTES.ADMIN_DRAWS, { maxRedirects: 0, headers: { cookie: `${SESSION_COOKIE_NAME_PRODUCTION}=${token}` } })
    expect(response.status()).toBe(200)
    expect(await response.text()).toContain(`data-cy="${ADMIN_DRAWS_DATA_CY}"`)
  })
})

test.describe(`page livrée ${ROUTES.EDITION} (F-03)`, () => {
  test('publique : répond 200 sans session, avec ses onglets et son titre', async ({ request }) => {
    const response = await request.get(EDITION_PAGE, { maxRedirects: 0 })
    expect(response.status()).toBe(200)
    const html = await response.text()
    expect(html).toContain('data-cy="edition-tab-matches"')
    expect(html).toContain('<h1')
  })
})

test.describe(`pages livrées ${ROUTES.LOGIN}, ${ROUTES.INVITATION} et ${ROUTES.PROFILE} (F-10)`, () => {
  test('/connexion : publique, répond 200 avec son formulaire', async ({ request }) => {
    const response = await request.get(ROUTES.LOGIN, { maxRedirects: 0 })
    expect(response.status()).toBe(200)
    expect(await response.text()).toContain('data-cy="login-form"')
  })

  test('/invitation/{jeton} : un jeton inconnu répond 200 avec l’état « lien inconnu », jamais 404 de livraison', async ({ request }) => {
    const response = await request.get(INVITATION_PAGE, { maxRedirects: 0 })
    expect(response.status()).toBe(200)
    expect(await response.text()).toContain('data-cy="account-state"')
  })

  test('/profil : sans session, redirige vers /connexion (pas 404)', async ({ request }) => {
    const response = await request.get(ROUTES.PROFILE, { maxRedirects: 0 })
    expect(response.status()).toBe(302)
    expect(response.headers().location).toBe(ROUTES.LOGIN)
  })
})

test.describe(`page livrée ${ROUTES.HALL_OF_FAME} (F-02)`, () => {
  test('publique : répond 200 sans session, avec ses classements, son titre et le lien de navigation', async ({ request }) => {
    const response = await request.get(ROUTES.HALL_OF_FAME, { maxRedirects: 0 })
    expect(response.status()).toBe(200)
    const html = await response.text()
    expect(html).toContain('data-cy="palmares-tabs"')
    expect(html).toContain('data-cy="palmares-titles"')
    expect(html).toContain('<h1')
    expect(html).toContain(`href="${ROUTES.HALL_OF_FAME}"`)
  })

  test('l’ancienne adresse /hall-of-fame mène au palmarès (200)', async ({ request }) => {
    const response = await request.get('/hall-of-fame')
    expect(response.status()).toBe(200)
    expect(response.url()).toContain(ROUTES.HALL_OF_FAME)
  })
})

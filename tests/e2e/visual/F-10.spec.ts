import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { e2eSecrets, signIn } from '../helpers/session'
import { alignMockupText, box, compare, open } from '../visual.util'
import type { IDataMasks, ITextPair } from '../visual.util'

/*********************************************************
 * Compte : comparaison visuelle par zone (FA-04, ARCH-9)
 *
 * @description
 * La maquette `compte.html` empile trois écrans en onglets (première connexion, connexion, profil) ; chacun est affiché en
 * cliquant son onglet, puis comparé à la vraie page : `/invitation/{jeton}` (jeton réel de la base de test), `/connexion`,
 * `/profil` (session réelle). Seules les VALEURS de données sont masquées des deux côtés, en rendant leur encre transparente
 * (initiales, nom, pseudo, email masqué, téléphone) : filet, fond, rayon, gabarit et positions restent comparés.
 * Deux écarts de structure sont assumés et chiffrés, jamais masqués :
 * - le chapeau explicatif du hero de la maquette décrit les trois écrans de la maquette, pas une page : il est retiré de la maquette ;
 * - la barre de force et la liste d'exigences du mot de passe (mapping.md, `strengthBar`), et le champ « mot de passe actuel » du
 *   profil (ticket F-10) n'existent pas dans la maquette. Les cartes d'invitation et de profil sont donc comparées élément par
 *   élément (chaque élément de la maquette contre son vis-à-vis), et la carte de connexion, identique à la maquette, en entier.
 * Seuil : 1 % par zone.
 ********************************************************/
const VIEWPORTS = [
  { name: '1440', width: 1440, height: 900 },
  { name: '390', width: 390, height: 844 }
]

const MOCKUP_INK = [
  '.acc-prof-h .avatar', '.acc-prof-h h2', '.acc-prof-h .muted', '.acc-ro dd', '.acc-avatar .avatar', '.input'
]
const APP_INK = [
  '[data-cy="account-avatar"]', '#profile-title', '.profile-form__nickname', '.profile-readonly__cell > span:first-child',
  '#profile-phone'
]
/** Ce qui change de texte entre la maquette et l'application sans être une donnée : références de spec (« · /profil », « (A4) »). */
const TEXT_PAIRS: ITextPair[] = [
  { mockup: '.acc-prof-h h2', app: '#profile-title' },
  { mockup: '.acc-prof-h .muted', app: '.profile-form__nickname' },
  { mockup: '.acc-prof-h .eyebrow', app: '.profile-form__eyebrow' },
  { mockup: '.acc-ro dd', app: '.profile-readonly__cell > span:first-child' },
  { mockup: '.acc-ro small', app: '.profile-readonly__note' }
]
const INK_RULE = '{ color: transparent !important; text-shadow: none !important; -webkit-text-fill-color: transparent !important; }'

const hideInk = async (page: Page, selectors: string[]) => {
  await page.addStyleTag({ content: `${selectors.join(', ')} ${INK_RULE}` })
}

const alignToPixel = async (page: Page, selector: string) => {
  await page.evaluate((target) => {
    const element = document.querySelector(target) as HTMLElement
    const top = element.getBoundingClientRect().top + window.scrollY
    const delta = Math.ceil(top) - top
    element.style.marginTop = `calc(${getComputedStyle(element).marginTop} + ${delta}px)`
  }, selector)
}

const showTab = async (mockup: Page, tab: string, withError = false) => {
  await mockup.locator(`#ac-t-${tab}`).click()
  // Le message d'erreur de la maquette est un ÉTAT (affiché en permanence sur l'écran de connexion) : il n'est comparé que dans la zone « erreur ».
  await mockup.addStyleTag({ content: `.page-hero__lead { display: none !important; }${withError ? '' : ' #login-err { display: none !important; }'}` })
}

const hydrated = async (page: Page) => {
  await page.waitForFunction(() => (window as unknown as { useNuxtApp?: () => { isHydrating: boolean } }).useNuxtApp?.().isHydrating === false)
}

interface IZone { zone: string, mockup: string, app: string, masks?: IDataMasks }

const HERO: IZone = { zone: 'compte-hero', mockup: '.page-hero', app: '.page-hero' }

const compareZone = async (page: Page, mockup: Page, viewport: string, entry: IZone) => {
  // Les boîtes sont mesurées dans le viewport, la capture est en coordonnées de page : on repart du haut de page (après un clic en bas de page, par exemple).
  await page.evaluate(() => window.scrollTo(0, 0))
  await mockup.evaluate(() => window.scrollTo(0, 0))
  await alignMockupText(mockup, page, TEXT_PAIRS)
  await hideInk(mockup, MOCKUP_INK)
  await hideInk(page, APP_INK)
  await alignToPixel(mockup, entry.mockup)
  await alignToPixel(page, entry.app)
  const mockBox = await box(mockup, entry.mockup)
  if (entry.mockup === HERO.mockup) {
    // Le hero de la maquette est pleine largeur (le contenu est dans `.wrap`) ; celui de l'application est déjà `page-wrap`.
    const wrap = await box(mockup, '.page-hero .wrap')
    mockBox.x = wrap.x
    mockBox.width = wrap.width
  }
  await compare(page, mockup, entry.zone, viewport, mockBox, await box(page, entry.app), entry.masks)
}

const compareAll = async (page: Page, mockup: Page, viewport: string, entries: IZone[]) => {
  for (const entry of entries) {
    await compareZone(page, mockup, viewport, entry)
  }
}

/** Le champ d'un `form-field` de l'application : la boîte du champ, sans la zone de détails (barre de force, exigences). */
const appField = (id: string): string => `.form-field:has(#${id}) .origam-field`

const INVITATION_ZONES: IZone[] = [
  { zone: 'compte-invitation-pastille', mockup: '#ac-p-first .acc-card > .chip', app: '[data-cy="invitation-chip"]' },
  { zone: 'compte-invitation-titre', mockup: '#h-first', app: '#invitation-title' },
  { zone: 'compte-invitation-intro', mockup: '#ac-p-first .acc-card > p.muted', app: '.invitation-form__intro' },
  { zone: 'compte-invitation-mot-de-passe', mockup: '#pw1', app: appField('invitation-password') },
  { zone: 'compte-invitation-confirmation', mockup: '#pw2', app: appField('invitation-confirm') },
  { zone: 'compte-invitation-indice', mockup: '#pw-hint', app: '#invitation-hint' },
  { zone: 'compte-invitation-avatar', mockup: '#ac-p-first .acc-avatar', app: '[data-cy="avatar-field"]' },
  { zone: 'compte-invitation-telephone', mockup: '#tel', app: appField('invitation-phone') },
  { zone: 'compte-invitation-bouton', mockup: '#ac-p-first .acc-form .btn', app: '[data-cy="invitation-submit"]' }
]

const PROFILE_ZONES: IZone[] = [
  { zone: 'compte-profil-entete', mockup: '.acc-prof-h', app: '.profile-form__header' },
  { zone: 'compte-profil-lecture-seule', mockup: '.acc-ro', app: '.profile-readonly' },
  { zone: 'compte-profil-avatar', mockup: '#ac-p-prof .acc-avatar', app: '[data-cy="avatar-field"]' },
  { zone: 'compte-profil-telephone', mockup: '#tel2', app: appField('profile-phone') },
  { zone: 'compte-profil-nouveau-mot-de-passe', mockup: '#pw3', app: appField('profile-new-password') },
  { zone: 'compte-profil-actions', mockup: '#ac-p-prof .acc-cta', app: '.profile-form__actions' }
]

for (const viewport of VIEWPORTS) {
  test.describe(`compte @${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } })

    test('compte-hero', async ({ page, browser }) => {
      const { mockup, mockContext } = await open(page, browser, viewport, 'compte.html', '/connexion')
      await hydrated(page)
      await showTab(mockup, 'login')
      await compareZone(page, mockup, viewport.name, HERO)
      await mockContext.close()
    })

    test('compte-connexion', async ({ page, browser }) => {
      const { mockup, mockContext } = await open(page, browser, viewport, 'compte.html', '/connexion')
      await hydrated(page)
      await showTab(mockup, 'login')
      await compareAll(page, mockup, viewport.name, [
        { zone: 'compte-connexion-carte', mockup: '#ac-p-login .acc-card', app: 'section[aria-labelledby="login-title"]' },
        { zone: 'compte-connexion-accompagnement', mockup: '#ac-p-login .acc-aside', app: '[data-cy="login-aside"]' }
      ])
      await mockContext.close()
    })


    test('compte-connexion-erreur', async ({ page, browser }) => {
      const { mockup, mockContext } = await open(page, browser, viewport, 'compte.html', '/connexion')
      await hydrated(page)
      await showTab(mockup, 'login', true)
      await page.locator('#login-email').fill('inconnu@example.test')
      await page.locator('#login-password').fill('un-mauvais-mot-de-passe')
      await page.getByTestId('login-submit').click()
      await expect(page.getByTestId('login-error')).toBeVisible()
      await compareZone(page, mockup, viewport.name, { zone: 'compte-connexion-erreur', mockup: '#login-err', app: '[data-cy="login-error"]' })
      await mockContext.close()
    })

    test('compte-invitation', async ({ page, browser }) => {
      const { invitations } = e2eSecrets()
      const { mockup, mockContext } = await open(page, browser, viewport, 'compte.html', `/invitation/${invitations.valid}`)
      await hydrated(page)
      await showTab(mockup, 'first')
      await compareAll(page, mockup, viewport.name, INVITATION_ZONES)
      await mockContext.close()
    })


    test('compte-lien-expire', async ({ page, browser }) => {
      const { invitations } = e2eSecrets()
      const { mockup, mockContext } = await open(page, browser, viewport, 'compte.html', `/invitation/${invitations.expired}`)
      await hydrated(page)
      await showTab(mockup, 'first')
      await compareZone(page, mockup, viewport.name, { zone: 'compte-lien-expire', mockup: '#ac-p-first .acc-state', app: '[data-cy="account-state"]' })
      await mockContext.close()
    })

    test('compte-profil', async ({ page, browser, context }) => {
      await signIn(context, 'member')
      const { mockup, mockContext } = await open(page, browser, viewport, 'compte.html', '/profil')
      await hydrated(page)
      await showTab(mockup, 'prof')
      await compareAll(page, mockup, viewport.name, PROFILE_ZONES)
      await mockContext.close()
    })


    test('compte-profil-enregistre', async ({ page, browser, context }) => {
      await signIn(context, 'member-edit')
      const { mockup, mockContext } = await open(page, browser, viewport, 'compte.html', '/profil')
      await hydrated(page)
      await showTab(mockup, 'prof')
      await page.locator('#profile-phone').fill('+33 6 11 11 11 11')
      await page.getByTestId('profile-submit').click()
      await expect(page.getByText('Profil enregistré')).toBeVisible()
      await compareZone(page, mockup, viewport.name, { zone: 'compte-profil-enregistre', mockup: '#ac-p-prof .acc-state', app: '[data-cy="account-state"]' })
      await mockContext.close()
    })
  })
}

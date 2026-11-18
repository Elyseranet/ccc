import { expect, test } from '@playwright/test'
import type { BrowserContext, Page } from '@playwright/test'
import { API_ROUTES } from '../../../src/consts/api-routes.const'
import { API_ENDPOINT } from '../../../src/enums/api-endpoint.enum'
import { uniqueEmail } from '../helpers/edition-write'
import { alignToPixel } from '../helpers/home-visual'
import { signIn } from '../helpers/session'
import { box, compare, open } from '../visual.util'

/*********************************************************
 * F-68 : zones visuelles de l'écran « Administrateurs » (admin-administrateurs.html, ancre #ad-p-list)
 *
 * @description
 * Pourquoi `writes/` : l'écran se mesure sur une liste que la base de test n'a pas (un administrateur invité, créé par l'API réelle,
 * `POST /admin/administrateurs`, B-31) : en `test.fixme` tant que `ADMINS` porte un `pendingTicket`, il se réactive seul au merge de B-31.
 * Seules les VALEURS (avatar, emails, nom de fiche, dates, valeur du champ) sont masquées des deux côtés (encre transparente) : pastilles,
 * boutons, filets, gabarit, rayon et positions restent comparés. Le snackbar est masqué (vérifié en e2e). Non comparés : les boîtes de
 * dialogue (mesurées avec les autres boîtes `ConfirmDialog`, F-30) et la ligne « Invitation expirée » (état non reproductible sans
 * horloge : mesurée sur routes simulées à la livraison). Seuil : 1 % par zone.
 ********************************************************/
const VIEWPORTS = [
  { name: '1440', width: 1440, height: 900 },
  { name: '390', width: 390, height: 844 }
]
const AWAITING = API_ROUTES[API_ENDPOINT.ADMINS].pendingTicket
const INK_RULE = '{ color: transparent !important; text-shadow: none !important; -webkit-text-fill-color: transparent !important; }'
// La barre basse (fixe, sous 1000 px) recouvre les zones du bas de page dans la capture ; elle a ses propres zones (F-12, coque admin).
const BOTTOM_BAR_HIDDEN = '.adm-bottom, .admin-bottom { visibility: hidden !important; }'
const field = (testId: string) => `[data-cy="${testId}"]`

const hideInk = async (target: Page, selectors: string[]) => {
  await target.addStyleTag({ content: `${selectors.join(', ')} ${INK_RULE}` })
}

const hydrated = async (page: Page) => {
  await page.waitForFunction(() => (window as unknown as { useNuxtApp?: () => { isHydrating: boolean } }).useNuxtApp?.().isHydrating === false)
  await page.waitForLoadState('networkidle')
  await page.addStyleTag({ content: BOTTOM_BAR_HIDDEN })
}

interface IZone { zone: string, mockup: string, app: string, ink?: { mockup: string[], app: string[] } }

const compareZone = async (page: Page, mockup: Page, viewport: string, entry: IZone) => {
  // Le pointeur reste là où le test a cliqué : à 390 px, il survole une zone et peint son état « hover », absent de la maquette.
  await page.mouse.move(0, 0)
  await page.evaluate(() => {
    (document.activeElement as HTMLElement | null)?.blur()
    window.scrollTo(0, 0)
  })
  await mockup.evaluate(() => window.scrollTo(0, 0))
  await hideInk(mockup, entry.ink?.mockup ?? [])
  await hideInk(page, entry.ink?.app ?? [])
  await alignToPixel(mockup, entry.mockup)
  await alignToPixel(page, entry.app)
  await compare(page, mockup, entry.zone, viewport, await box(mockup, entry.mockup), await box(page, entry.app))
}

/** Un administrateur invité, créé par l'API réelle : la ligne « Invité » (Corriger, Retirer l'accès) de la maquette. */
const inviteAdministrator = async (context: BrowserContext) => {
  const response = await context.request.post('/api/v1/admin/administrateurs', { data: { email: uniqueEmail('f68.zones') } })
  expect(response.status()).toBe(201)
}

const showList = async (mockup: Page) => {
  await mockup.addStyleTag({ content: `.snack { display: none !important; } ${BOTTOM_BAR_HIDDEN} .adm-head .muted, .screens { display: none !important; }` })
  await mockup.waitForTimeout(100)
}

for (const viewport of VIEWPORTS) {
  test.describe(`administrateurs @${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } })

    test('administrateurs-liste', async ({ page, browser, context }) => {
      test.fixme(Boolean(AWAITING), `en attente de ${AWAITING} : GET et POST /admin/administrateurs`)
      await signIn(context, 'admin')
      await inviteAdministrator(context)
      const { mockup, mockContext } = await open(page, browser, viewport, 'admin-administrateurs.html', '/admin/administrateurs')
      await hydrated(page)
      await showList(mockup)
      const mockRow = (index: number) => `#ad-p-list tbody tr:nth-child(${index})`
      const appRow = (selector: string) => `${field('administrator-table')} tbody tr:has(${selector})`
      const entries: IZone[] = [
        { zone: 'administrateurs-titre', mockup: '.adm-head > div:first-child', app: '.admin-administrators__heading' },
        { zone: 'administrateurs-liste-entete', mockup: '#ad-p-list .adm-card-h', app: '.administrator-list__head', ink: { mockup: ['#ad-p-list .adm-card-h .chip'], app: [field('administrator-count')] } },
        { zone: 'administrateurs-entete-table', mockup: '#ad-p-list thead', app: `${field('administrator-table')} thead` },
        {
          zone: 'administrateurs-ligne-vous',
          mockup: mockRow(1),
          app: appRow(field('administrator-self')),
          ink: { mockup: ['#ad-p-list tbody tr:nth-child(1) .pl-cell'], app: [`${field('administrator-table')} tbody tr:has(${field('administrator-self')}) .administrator-list__cell`] }
        },
        {
          zone: 'administrateurs-ligne-invite',
          mockup: mockRow(3),
          app: appRow(field('administrator-state-INVITED')),
          ink: { mockup: ['#ad-p-list tbody tr:nth-child(3) .pl-cell'], app: [`${field('administrator-table')} tbody tr:has(${field('administrator-state-INVITED')}) .administrator-list__cell`] }
        },
        { zone: 'administrateurs-carte-inviter', mockup: '#ad-p-list .card.ad-invite', app: field('administrator-invite'), ink: { mockup: ['#ai-em'], app: [`${field('administrator-invite-email')} input`] } }
      ]
      for (const entry of entries) {
        await compareZone(page, mockup, viewport.name, entry)
      }
      await mockContext.close()
    })
  })
}

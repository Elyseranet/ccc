import { test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { createRegistrationEdition, selectAdminEdition } from '../helpers/edition-write'
import { signIn } from '../helpers/session'
import { alignMockupText, box, compare, open } from '../visual.util'
import type { IClip, ITextPair } from '../visual.util'

/*********************************************************
 * F-09 : zones visuelles de l'écran Participants (admin-participants.html)
 *
 * @description
 * Les zones dépendent d'une écriture réussie ou refusée (email déjà pris, premier inscrit) : elles se mesurent sur une
 * édition créée par le test (QA-3), jamais sur 2026. Les VALEURS de données sont recopiées dans la maquette (textes,
 * valeurs des champs) ; filet, fond, rayon et gabarit restent comparés. Le menu des suggestions n'est pas comparé : la
 * maquette le pose dans le flux de la carte, Origam l'ouvre en surcouche (`origam-menu`), donc la mise en page de la
 * carte ne dépend pas de lui ; ses lignes sont couvertes par les e2e fonctionnels.
 * Le champ photo de la maquette est un `<input type="file">` natif (bouton du navigateur, hauteur 50 px) : sa hauteur est ramenée à 48 px et sa valeur masquée des
 * deux côtés ; le filet, le rayon et le fond restent comparés. La barre basse fixe (390 px) est masquée des deux côtés : elle recouvre le bas de la capture pleine page.
 * La table des inscrits est comparée sur toute sa largeur (maquette corrigée, 32fe65b).
 ********************************************************/
const VIEWPORTS = [
  { name: '1440', width: 1440, height: 900 },
  { name: '390', width: 390, height: 844 }
]

const INK_RULE = '{ color: transparent !important; text-shadow: none !important; -webkit-text-fill-color: transparent !important; }'
const hideInk = async (page: Page, selectors: string[]) => {
  await page.addStyleTag({ content: `${selectors.join(', ')} ${INK_RULE}` })
}

const TEXT_PAIRS: ITextPair[] = [
  { mockup: '.adm-head .eyebrow', app: '.admin-participants__eyebrow' },
  { mockup: '.adm-head .muted', app: '[data-cy="participant-summary"]' },
  { mockup: '.pa-list .adm-card-h .chip', app: '[data-cy="participant-count"]' },
  { mockup: '.pa-list tbody tr:first-child .pl-cell .avatar', app: '[data-cy="participant-table"] tbody tr:first-child .origam-avatar__text' },
  { mockup: '.pa-list tbody tr:first-child .pl-cell b', app: '[data-cy="participant-table"] tbody tr:first-child td:nth-child(1) strong' },
  { mockup: '.pa-list tbody tr:first-child td:nth-child(2)', app: '[data-cy="participant-table"] tbody tr:first-child td:nth-child(2)' },
  { mockup: '.pa-list tbody tr:first-child td:nth-child(3)', app: '[data-cy="participant-table"] tbody tr:first-child td:nth-child(3)' },
  { mockup: '.pa-list tbody tr:first-child .chip', app: '[data-cy="participant-table"] tbody tr:first-child [data-cy^="participant-account-"]' }
]

const MOCKUP_INK = ['.pa-list tbody td', '.pa-list tbody td *', '.pa-list .adm-card-h .chip', '.adm-head .eyebrow', '.adm-head .muted']
const APP_INK = [
  '[data-cy="participant-table"] tbody td', '[data-cy="participant-table"] tbody td *', '[data-cy="participant-count"]',
  '.admin-participants__eyebrow', '[data-cy="participant-summary"]'
]

const ZONES: Array<{ name: string, mockup: string, app: string, endMockup?: string, endApp?: string }> = [
  { name: 'pa-entete', mockup: '.adm-head', app: '.admin-participants__head' },
  { name: 'pa-liste', mockup: '.pa-list', app: '[data-cy="participant-list"]', endMockup: '.pa-list tbody tr:first-child', endApp: '[data-cy="participant-table"] tbody tr:first-child' },
  { name: 'pa-ajout-formulaire', mockup: '.pa-form', app: '[data-cy="participant-form"]' }
]

const clipOf = async (page: Page, zone: string, end?: string): Promise<IClip> => {
  const start = await box(page, zone)
  if (!end) {
    return start
  }
  const bottom = await box(page, end)
  return { x: start.x, y: start.y, width: start.width, height: bottom.y + bottom.height - start.y }
}

for (const viewport of VIEWPORTS) {
  test.describe(`F-09 participants @${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } })

    for (const zone of ZONES) {
      test(zone.name, async ({ page, browser, context }) => {
        await signIn(context, 'admin')
        const { edition, seed } = await createRegistrationEdition(context.request, `zones ${zone.name} ${viewport.name}`)
        await selectAdminEdition(context, edition)
        const { mockup, mockContext } = await open(page, browser, viewport, 'admin-participants.html', '/admin/participants')
        await page.waitForFunction(() => (window as unknown as { useNuxtApp?: () => { isHydrating: boolean } }).useNuxtApp?.().isHydrating === false)

        await page.getByTestId('participant-search').locator('input').fill('Cam')
        await page.getByTestId('participant-search-create').click()
        await page.getByTestId('participant-form-last-name').locator('input').fill('Roussel')
        await page.getByTestId('participant-form-first-name').locator('input').fill('Camille')
        await page.getByTestId('participant-form-nickname').locator('input').fill('Décapsuleur')
        await page.getByTestId('participant-form-email').locator('input').fill(seed.email)
        await page.getByTestId('participant-form-submit').click()
        await page.getByTestId('participant-form-email-taken').waitFor()
        await page.getByTestId('participant-feedback').waitFor({ state: 'detached' }).catch(() => undefined)

        await mockup.evaluate((email) => {
          (document.querySelector('#n-em') as HTMLInputElement).value = email
        }, seed.email)
        await mockup.addStyleTag({ content: '.combo__list, .snack { display: none !important; }' })
        await mockup.addStyleTag({ content: '.pa-form .input--file { box-sizing: border-box; height: var(--origam-space---12); padding-block: 0; } .adm-bottom { display: none !important; }' })
        await page.addStyleTag({ content: '.admin-bottom { display: none !important; }' })
        await mockup.evaluate(() => {
          const rule = document.querySelector('.pa-form .rule')
          if (rule) {
            rule.lastChild!.textContent = rule.lastChild!.textContent!.replace(' (A14)', '')
          }
        })
        await mockup.evaluate(() => document.querySelector('.pa-list tbody tr:first-child .chip')?.classList.replace('chip--ok', 'chip--warn'))
        await alignMockupText(mockup, page, TEXT_PAIRS)
        await hideInk(mockup, MOCKUP_INK)
        await hideInk(page, APP_INK)

        await page.evaluate(() => window.scrollTo(0, 0))
        await mockup.evaluate(() => window.scrollTo(0, 0))
        const mockClip = await clipOf(mockup, zone.mockup, zone.endMockup)
        const appClip = await clipOf(page, zone.app, zone.endApp)
        const masks = zone.name === 'pa-ajout-formulaire'
          ? { mockup: [], app: [], values: { mockup: ['.pa-form .input--file'], app: ['[data-cy="participant-form-avatar"] .origam-field'] } }
          : undefined
        await compare(page, mockup, zone.name, viewport.name, mockClip, appClip, masks)
        await mockContext.close()
      })
    }
  })
}

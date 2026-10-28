import { test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { alignMockupText, box, compare, open } from '../visual.util'
import type { ITextPair } from '../visual.util'

/*********************************************************
 * Accueil : comparaison visuelle par zone (FA-04, ARCH-9)
 *
 * @description
 * L'application tourne sur les vraies données de la base de test. Seules les VALEURS de données sont masquées des deux
 * côtés (encre rendue transparente : année, compteurs, noms, scores, points) ; filet, fond, rayon et gabarit restent
 * comparés. Avant la capture, le texte réel de l'application est écrit dans le DOM de la maquette (`alignMockupText`),
 * pour que les deux côtés renvoient à la ligne de la même façon.
 ********************************************************/
const VIEWPORTS = [
  { name: '1440', width: 1440, height: 900 },
  { name: '390', width: 390, height: 844 }
]

const TEXT_PAIRS: ITextPair[] = [
  { mockup: '.home-hero__kicker .chip', app: '[data-cy="home-hero-chip"]' },
  { mockup: '.home-hero__kicker .eyebrow', app: '.home-hero__eyebrow' },
  { mockup: '.home-hero__title span', app: '.home-hero__title > span' },
  { mockup: '.t-stat--ed .t-stat__n', app: '[data-cy="home-tile-editions"] .home-bento__number' },
  { mockup: '.t-stat--ed .t-stat__l', app: '[data-cy="home-tile-editions"] .home-bento__label' },
  { mockup: '.t-stat--pl .t-stat__n', app: '[data-cy="home-tile-players"] .home-bento__number' },
  { mockup: '.t-stat--m .t-stat__n', app: '[data-cy="home-tile-matches"] .home-bento__number' },
  { mockup: '.t-stat--m .t-stat__l', app: '[data-cy="home-tile-matches"] .home-bento__label' },
  { mockup: '.t-champ .eyebrow', app: '[data-cy="home-tile-champion"] .home-bento__eyebrow' },
  { mockup: '.t-champ__name', app: '.home-bento__champion-name' },
  { mockup: '.mini-rank__n', app: '.home-bento__rank-number' },
  { mockup: '.mini-rank .num', app: '[data-cy="home-rank-row"] .num' },
  { mockup: '.section__head .h-section', app: '.home-bento__head h2' },
  { mockup: '.t-now__meta', app: '[data-cy="home-current-meta"]' },
  { mockup: '.result__p.is-win a', app: '[data-cy="home-current-score"] .home-current__player--win .player-link__name' },
  { mockup: '.result__p:not(.is-win) a', app: '[data-cy="home-current-score"] .home-current__player:not(.home-current__player--win) .player-link__name' },
  { mockup: '.result__s', app: '[data-cy="home-current-score"] .home-current__score' },
  { mockup: '.result .chip', app: '[data-cy="home-current-score"] .home-current__pool' }
]

const MOCKUP_INK = [
  '.home-hero__kicker .chip', '.home-hero__kicker .eyebrow',
  '.t-stat__n', '.t-stat--ed .t-stat__l', '.t-stat--m .t-stat__l', '.t-champ .eyebrow', '.t-champ__name', '.t-champ__meta',
  '.mini-rank li > span:not(.mini-rank__n)', '.mini-rank li a', '.mini-rank .stars',
  '.section__head .h-section', '.t-now__meta', '.result__p a', '.result__s', '.result .chip'
]
const APP_INK = [
  '[data-cy="home-hero-chip"]', '.home-hero__eyebrow',
  '.home-bento__number', '[data-cy="home-tile-editions"] .home-bento__label', '[data-cy="home-tile-matches"] .home-bento__label',
  '[data-cy="home-tile-champion"] .home-bento__eyebrow', '.home-bento__champion-name', '.home-bento__champion-meta',
  '[data-cy="home-rank-row"] .num', '[data-cy="home-rank-row"] a', '[data-cy="home-rank-row"] a *',
  '.home-bento__head h2', '[data-cy="home-current-meta"]', '[data-cy="home-current-score"] a', '[data-cy="home-current-score"] a *', '.home-current__score', '.home-current__pool'
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

const ZONES = [
  { name: 'accueil-hero', mock: '.home-hero', app: '[data-cy="home-hero"]' },
  { name: 'accueil-entete-section', mock: '.section__head', app: '.home-bento__head' },
  { name: 'accueil-tuile-en-cours', mock: '.t-now', app: '[data-cy="home-current"]' },
  { name: 'accueil-regles-d-or', mock: '.ticker', app: '[data-cy="golden-rules"]' },
  { name: 'accueil-tuile-editions', mock: '.t-stat--ed', app: '[data-cy="home-tile-editions"]' },
  { name: 'accueil-tuile-competiteurs', mock: '.t-stat--pl', app: '[data-cy="home-tile-players"]' },
  { name: 'accueil-tuile-champion', mock: '.t-champ', app: '[data-cy="home-tile-champion"]' },
  { name: 'accueil-tuile-matchs', mock: '.t-stat--m', app: '[data-cy="home-tile-matches"]' },
  { name: 'accueil-tuile-classement', mock: '.t-rank', app: '[data-cy="home-tile-ranking"]' },
  { name: 'accueil-tuile-face-a-face', mock: '.t-rule', app: '[data-cy="home-tile-head-to-head"]' }
]

for (const viewport of VIEWPORTS) {
  test.describe(`accueil @${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } })

    for (const zone of ZONES) {
      test(zone.name, async ({ page, browser }) => {
        const { mockup, mockContext } = await open(page, browser, viewport, 'index.html', '/')
        await page.waitForFunction(() => (window as unknown as { useNuxtApp?: () => { isHydrating: boolean } }).useNuxtApp?.().isHydrating === false)
        await alignMockupText(mockup, page, TEXT_PAIRS)
        // `alignMockupText` écrit du texte brut : le score perd son <i> (séparateur, avec son espacement). On le rétablit pour comparer la même structure.
        await mockup.evaluate(() => document.querySelectorAll('.result__s').forEach((node) => {
          const [winner = '', loser = ''] = (node.textContent ?? '').split('–')
          node.innerHTML = `${winner}<i>–</i>${loser}`
        }))
        await hideInk(mockup, MOCKUP_INK)
        await hideInk(page, APP_INK)
        await alignToPixel(mockup, zone.mock)
        await alignToPixel(page, zone.app)
        const mockBox = await box(mockup, zone.mock)
        const appBox = await box(page, zone.app)
        await compare(page, mockup, zone.name, viewport.name, mockBox, appBox)
        await mockContext.close()
      })
    }
  })
}

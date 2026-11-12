import type { Page } from '@playwright/test'
import { alignMockupText } from '../visual.util'
import type { ITextPair } from '../visual.util'

/*********************************************************
 * Accueil : constantes et gestes communs des comparaisons visuelles (FA-04, ARCH-9)
 *
 * @description
 * Partagés par `visual/F-01.spec.ts` (nuxt dev, tous les liens visibles). Seules les VALEURS de données sont masquées (encre transparente) ; le texte réel de
 * l'application est écrit dans la maquette (`alignMockupText`) pour que les deux côtés renvoient à la ligne de la même façon.
 ********************************************************/
export const HOME_VIEWPORTS = [
  { name: '1440', width: 1440, height: 900 },
  { name: '390', width: 390, height: 844 }
]

export const HOME_TEXT_PAIRS: ITextPair[] = [
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

export const HOME_MOCKUP_INK = [
  '.home-hero__kicker .chip', '.home-hero__kicker .eyebrow',
  '.t-stat__n', '.t-stat--ed .t-stat__l', '.t-stat--m .t-stat__l', '.t-champ .eyebrow', '.t-champ__name', '.t-champ__meta',
  '.mini-rank li > span:not(.mini-rank__n)', '.mini-rank li a', '.mini-rank .stars',
  '.section__head .h-section', '.t-now__meta', '.result__p a', '.result__s', '.result .chip'
]
export const HOME_APP_INK = [
  '[data-cy="home-hero-chip"]', '.home-hero__eyebrow',
  '.home-bento__number', '[data-cy="home-tile-editions"] .home-bento__label', '[data-cy="home-tile-matches"] .home-bento__label',
  '[data-cy="home-tile-champion"] .home-bento__eyebrow', '.home-bento__champion-name', '.home-bento__champion-meta',
  '[data-cy="home-rank-row"] .num', '[data-cy="home-rank-row"] a', '[data-cy="home-rank-row"] a *',
  '.home-bento__head h2', '[data-cy="home-current-meta"]', '[data-cy="home-current-score"] a', '[data-cy="home-current-score"] a *', '.home-current__score', '.home-current__pool'
]
const INK_RULE = '{ color: transparent !important; text-shadow: none !important; -webkit-text-fill-color: transparent !important; }'

export const hideInk = async (page: Page, selectors: string[]) => {
  await page.addStyleTag({ content: `${selectors.join(', ')} ${INK_RULE}` })
}

export const alignToPixel = async (page: Page, selector: string) => {
  await page.evaluate((target) => {
    const element = document.querySelector(target) as HTMLElement
    const top = element.getBoundingClientRect().top + window.scrollY
    const delta = Math.ceil(top) - top
    element.style.marginTop = `calc(${getComputedStyle(element).marginTop} + ${delta}px)`
  }, selector)
}


/** Texte réel dans la maquette, score rétabli avec son séparateur, encre des valeurs masquée des deux côtés. */
export const prepareHomeComparison = async (mockup: Page, page: Page) => {
  await alignMockupText(mockup, page, HOME_TEXT_PAIRS)
  // `alignMockupText` écrit du texte brut : le score perd son <i> (séparateur, avec son espacement). On le rétablit pour comparer la même structure.
  await mockup.evaluate(() => document.querySelectorAll('.result__s').forEach((node) => {
    const [winner = '', loser = ''] = (node.textContent ?? '').split('–')
    node.innerHTML = `${winner}<i>–</i>${loser}`
  }))
  await hideInk(mockup, HOME_MOCKUP_INK)
  await hideInk(page, HOME_APP_INK)
}

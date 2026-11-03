import { test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { alignMockupText, box, compare, open } from '../visual.util'
import type { IClip, ITextPair } from '../visual.util'

/*********************************************************
 * Palmarès (F-02) : comparaison visuelle par zone (FA-04, ARCH-9)
 *
 * @description
 * Données réelles de la base de test contre `palmares.html`. Les textes de l'application (noms, scores, nombres, années) sont
 * écrits dans la maquette en mémoire (`alignMockupText`), et les étoiles de la maquette sont remplacées par celles de l'API, rang
 * par rang : les deux côtés affichent le même texte, donc les mêmes largeurs, et seuls le gabarit, le filet, le fond, le rayon
 * et les positions sont comparés. La maquette montre 20 lignes par classement, l'application toutes (une centaine) : on masque
 * les lignes en trop côté application avant de comparer. Le tracé du graphique n'est pas comparé : `origam-chart` dessine à 600 x 360 unités
 * (OrigamChartCartesian.vue:683-684), la maquette à 820 x 320 ; écart mesuré (Elyseranet/origam#1317, F-02-CHART), fiche docs/tickets/origam/chart-points-focusables-dans-svg-img.md. Les valeurs sont masquées par l'encre transparente, jamais la structure.
 ********************************************************/
const MOCK_ROWS = 20
const VIEWPORTS = [
  { name: '1440', width: 1440, height: 900 },
  { name: '390', width: 390, height: 844 }
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

/** Le halo de fond est une couche fixe : deux pages de hauteurs différentes ne peignent pas le même dégradé. */
const equalizeHeights = async (mockup: Page, page: Page) => {
  const heights = await Promise.all([mockup, page].map(target => target.evaluate(() => document.documentElement.scrollHeight)))
  const height = Math.max(...heights)
  for (const target of [mockup, page]) {
    await target.evaluate((value) => {
      document.body.style.minHeight = `${value}px`
    }, height)
  }
}

/** Étoiles de l'API (celles de `PlayerLink`) écrites dans la maquette, hôte par hôte. */
const alignStars = async (mockup: Page, page: Page, mockHosts: string, appHosts: string) => {
  const counts = await page.locator(appHosts).evaluateAll(hosts => hosts.map(host => host.querySelector('.player-link__stars')?.textContent?.trim().length ?? 0))
  await mockup.evaluate(([selector, values]) => {
    document.querySelectorAll(selector as string).forEach((host, index) => {
      host.querySelector('.stars')?.remove()
      const count = (values as number[])[index] ?? 0
      if (count > 0) {
        const span = document.createElement('span')
        span.className = 'stars'
        span.textContent = '*'.repeat(count)
        const bold = host.querySelector('b')
        if (bold) {
          bold.before(span, ' ')
          span.before(' ')
        } else {
          host.append(' ', span)
        }
      }
    })
  }, [mockHosts, counts] as [string, number[]])
}

/** Une finale sans score (archive) n'a pas de score dans l'application : on retire celui de la maquette. */
const alignMissingScores = async (mockup: Page, page: Page) => {
  const hasScore = await page.locator('.palmares-titles__final').evaluateAll(hosts => hosts.map(host => host.querySelector('b') !== null))
  await mockup.evaluate((values) => {
    document.querySelectorAll('.champ__final').forEach((host, index) => {
      if (values[index] === false) {
        host.querySelector('b')?.remove()
      }
    })
  }, hasScore)
}

/**
 * Le cas « plusieurs plus titrés » (F-02-TIE) : la maquette ne le montre pas. On duplique le détenteur des deux côtés (deux noms de plus,
 * mêmes textes) et la maquette reçoit l'écart entre détenteurs de l'application : le test vérifie la mise en page (hauteur, centrage de la
 * capsule), pas un dessin de la maquette.
 */
const tieMostTitled = async (mockup: Page, page: Page) => {
  await page.locator('.palmares-most-titled__holder').first().evaluate((holder) => {
    const text = holder.parentElement as HTMLElement
    const label = text.querySelector('.palmares-most-titled__eyebrow') as HTMLElement
    label.textContent = 'LES PLUS TITRÉS'
    holder.after(holder.cloneNode(true), holder.cloneNode(true))
  })
  await mockup.locator('.palm-podium p').evaluate((text) => {
    const eyebrow = text.querySelector('.eyebrow') as HTMLElement
    eyebrow.textContent = 'LES PLUS TITRÉS'
    const name = text.querySelector('.palm-podium__name') as HTMLElement
    const detail = text.querySelector('.muted') as HTMLElement
    for (let index = 0; index < 2; index += 1) {
      const holder = document.createElement('span')
      holder.style.cssText = 'display:grid;gap:var(--origam-space---1);margin-top:var(--origam-space---3)'
      holder.append(name.cloneNode(true), detail.cloneNode(true))
      text.append(holder)
    }
    const first = document.createElement('span')
    first.style.cssText = 'display:grid;gap:var(--origam-space---1)'
    first.append(name, detail)
    eyebrow.after(first)
  })
}

const TEXT_PAIRS: ITextPair[] = [
  { mockup: '.palm-hero .page-hero__lead', app: '[data-cy="page-hero-lead"]' },
  { mockup: '.palm-podium__name', app: '[data-cy="palmares-most-titled-name"]' },
  { mockup: '.palm-podium .muted', app: '.palmares-most-titled__detail' },
  { mockup: '.palm-podium .cap-txt', app: '.palmares-most-titled__cap-text' },
  { mockup: '.champ__ed', app: '.palmares-titles__edition' },
  { mockup: '.champ__who a', app: '.palmares-titles__who .player-link__name' },
  { mockup: '.champ__final a', app: '.palmares-titles__final .player-link__name' },
  { mockup: '.champ__final b', app: '.palmares-titles__final b' },
  { mockup: '.champ__n', app: '.palmares-titles__count' },
  { mockup: '#h-rk ~ p', app: '.palmares-rankings__note' },
  { mockup: '#rk-p-acp caption', app: '[data-cy="palmares-table-acp"] caption' },
  { mockup: '#rk-p-all caption', app: '[data-cy="palmares-table-all-time"] caption' },
  ...[1, 3, 4, 5, 6].map(column => ({ mockup: `#rk-p-acp tbody tr td:nth-child(${column})`, app: `[data-cy="palmares-table-acp"] tbody tr td:nth-child(${column})` })),
  { mockup: '#rk-p-acp tbody tr td:nth-child(2) a', app: '[data-cy="palmares-table-acp"] tbody tr td:nth-child(2) .player-link__name' },
  ...[1, 3, 4, 5, 6].map(column => ({ mockup: `#rk-p-all tbody tr td:nth-child(${column})`, app: `[data-cy="palmares-table-all-time"] tbody tr td:nth-child(${column})` })),
  { mockup: '#rk-p-all tbody tr td:nth-child(2) a', app: '[data-cy="palmares-table-all-time"] tbody tr td:nth-child(2) .player-link__name' }
]

const MOCKUP_INK = [
  '.palm-podium__name', '.palm-podium .muted', '.palm-podium .cap-txt', '.champ__ed', '.champ__who a', '.champ__final a', '.champ__final b', '.champ__n',
  '#rk-p-acp tbody td', '#rk-p-acp tbody td a', '#rk-p-all tbody td', '#rk-p-all tbody td a', '.palm-hero .page-hero__lead', '#h-rk ~ p', '.table caption'
]
const APP_INK = [
  '[data-cy="palmares-most-titled-name"]', '.palmares-most-titled__detail', '.palmares-most-titled__cap-text', '.palmares-titles__edition',
  '.palmares-titles__who .player-link__name', '.palmares-titles__final .player-link__name', '.palmares-titles__final b', '.palmares-titles__count',
  '[data-cy="palmares-table-acp"] tbody td', '[data-cy="palmares-table-acp"] tbody td *', '[data-cy="palmares-table-all-time"] tbody td', '[data-cy="palmares-table-all-time"] tbody td *',
  '[data-cy="page-hero-lead"]', '.palmares-rankings__note', '.palmares-ranking-table caption'
]

interface IZone { zone: string, tab?: { app: string, mockup: string }, mockup: string, app: string, tied?: boolean }
const ZONES: IZone[] = [
  { zone: 'palmares-hero', mockup: '.palm-hero', app: '.palmares-page__hero' },
  { zone: 'palmares-plus-titre', mockup: '.palm-podium', app: '.palmares-most-titled' },
  { zone: 'palmares-plus-titres-ex-aequo', tied: true, mockup: '.palm-podium', app: '.palmares-most-titled' },
  { zone: 'palmares-titres-entete', mockup: '.section__head:has(#h-titles)', app: '.palmares-titles__head' },
  { zone: 'palmares-titres', mockup: '.champs', app: '.palmares-titles__list' },
  { zone: 'palmares-classements-entete', mockup: '.section__head:has(#h-rk)', app: '.palmares-rankings__head' },
  { zone: 'palmares-onglets', mockup: '.tabs', app: '[data-cy="palmares-tabs"]' },
  { zone: 'palmares-acp', mockup: '#rk-p-acp .table-wrap', app: '[data-cy="palmares-table-acp"]' },
  { zone: 'palmares-all-time', tab: { app: 'palmares-tab-all-time', mockup: '#rk-t-all' }, mockup: '#rk-p-all .table-wrap', app: '[data-cy="palmares-table-all-time"]' },
  { zone: 'palmares-evolution-entete', tab: { app: 'palmares-tab-evolution', mockup: '#rk-t-evo' }, mockup: '.chart-card__head', app: '.palmares-evolution__head' },
  { zone: 'palmares-evolution-resume', tab: { app: 'palmares-tab-evolution', mockup: '#rk-t-evo' }, mockup: '.evo-table summary', app: '[data-cy="palmares-evolution-toggle"]' }
]

const toRowBox = async (page: Page, selector: string): Promise<IClip> => await box(page, selector)

for (const viewport of VIEWPORTS) {
  test.describe(`palmarès @${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } })

    for (const entry of ZONES) {
      test(entry.zone, async ({ page, browser }) => {
        const { mockup, mockContext } = await open(page, browser, viewport, 'palmares.html', '/palmares')
        await page.waitForFunction(() => (window as unknown as { useNuxtApp?: () => { isHydrating: boolean } }).useNuxtApp?.().isHydrating === false)
        if (entry.tab) {
          await page.getByTestId(entry.tab.app).click()
          await mockup.locator(entry.tab.mockup).click()
        }
        await alignMockupText(mockup, page, TEXT_PAIRS)
        if (entry.tied) {
          await tieMostTitled(mockup, page)
        }
        await alignMissingScores(mockup, page)
        await alignStars(mockup, page, '.champ__who', '.palmares-titles__who')
        await alignStars(mockup, page, '.champ__final', '.palmares-titles__final')
        await alignStars(mockup, page, '#rk-p-acp tbody tr td:nth-child(2)', '[data-cy="palmares-table-acp"] tbody tr td:nth-child(2)')
        await alignStars(mockup, page, '#rk-p-all tbody tr td:nth-child(2)', '[data-cy="palmares-table-all-time"] tbody tr td:nth-child(2)')
        await page.addStyleTag({ content: `.palmares-ranking-table tbody tr:nth-child(n+${MOCK_ROWS + 1}) { display: none !important; }` })
        await hideInk(mockup, MOCKUP_INK)
        await hideInk(page, APP_INK)
        await mockup.evaluate(() => window.scrollTo(0, 0))
        await page.evaluate(() => window.scrollTo(0, 0))
        await equalizeHeights(mockup, page)
        await alignToPixel(mockup, entry.mockup)
        await alignToPixel(page, entry.app)
        await compare(page, mockup, entry.zone, viewport.name, await toRowBox(mockup, entry.mockup), await toRowBox(page, entry.app))
        await mockContext.close()
      })
    }
  })
}

import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { pairUrl, resolvePair } from '../helpers/head-to-head'
import { e2eSecrets } from '../helpers/session'
import { MOCKUP_DIR } from '../visual.util'
import { md, newContext, open, settle } from './audit.util'
import { SPACING_AUDIT_VIEWPORTS } from './spacing.const'
import {
  SPACING_MOCKUP_CASES,
  SPACING_MOCKUP_DEFAULT_OUT,
  SPACING_MOCKUP_GLOBAL_CSS,
  SPACING_MOCKUP_MAX_DELTA
} from './spacing-mockup.const'

/*********************************************************
 * Audit des espacements contre la maquette (F-64) — lancé avec `npm run audit:spacing`
 *
 * @description
 * Pour chaque écran qui a une maquette, à 1440 et 390, compare les écarts verticaux entre blocs CORRESPONDANTS.
 *
 * Ancres : dans `main`, chaque bloc qui porte du texte (le plus proche ancêtre non `inline` d'un nœud de texte), visible,
 * hors `aria-hidden`. Dans un contrôle (bouton, lien, label, onglet, pastille), l'ancre est le contrôle entier. Position
 * mesurée sur l'ENCRE du texte (union des boîtes de ses nœuds de texte), pas sur la boîte de l'élément : Origam enveloppe
 * les libellés (`origam-btn__content`, `origam-chip__content`), une carte de la maquette porte parfois son texte en direct ;
 * l'encre rend les deux côtés comparables. L'écart mesuré est donc la distance visible entre deux textes. Texte normalisé : minuscules, espaces réduits, chiffres remplacés par `#` (les données diffèrent).
 * Correspondance : une ancre de l'application et une de la maquette correspondent si leur texte normalisé est UNIQUE des
 * deux côtés. Comparaison : deux ancres correspondantes consécutives dans l'application (aucune autre ancre entre elles)
 * ET consécutives dans la maquette, empilées (la seconde commence sous la première, chevauchement horizontal > 0) des
 * deux côtés : écart = haut de la seconde − bas de la première. Signalé si |app − maquette| > `SPACING_MOCKUP_MAX_DELTA`.
 *
 * Limites : un bloc sans texte (image, champ vide, graphique) n'est pas une ancre ; un libellé différent entre maquette et
 * application (données, texte reformulé) casse la correspondance de ce bloc ; l'écart entre deux textes inclut leur
 * interligne : une différence de typographie (taille, interligne) apparaît comme une différence d'écart.
 *
 * Cause : composant de l'application qui contient les deux blocs (premier ancêtre commun portant une classe d'application).
 ********************************************************/

interface IAnchor {
  text: string
  top: number
  bottom: number
  left: number
  right: number
  label: string
  chain: string[]
}

interface IDiff {
  page: string
  width: number
  a: string
  b: string
  mock: number
  app: number
  delta: number
  owner: string
  appA: string
  appB: string
}

interface IPageStat { page: string, width: number, appAnchors: number, mockAnchors: number, matched: number, compared: number, flagged: number }

const anchorsOf = (): IAnchor[] => {
  const CONTROL_BOX = 'a, button, label, [role="tab"], .origam-btn, .origam-chip, .origam-tab, .btn, .chip, .tab'
  const scope = document.querySelector('main') ?? document.body
  const ids = new WeakMap<Element, number>()
  let next = 0
  const idOf = (el: Element) => {
    if (!ids.has(el)) ids.set(el, next++)
    return ids.get(el)!
  }
  const label = (el: Element): string => {
    let out = el.tagName.toLowerCase()
    const cy = el.getAttribute('data-cy')
    if (cy) out += `[data-cy="${cy}"]`
    const classes = [...el.classList].filter(c => !c.startsWith('origam--') && !c.startsWith('font-')).slice(0, 2)
    if (classes.length) out += `.${classes.join('.')}`
    return out
  }
  const owner = (el: Element): string => [...el.classList].find(c => /^[a-z][a-z0-9-]*(__[a-z0-9-]+)?$/.test(c) && !c.startsWith('origam') && !c.startsWith('page-wrap') && !c.startsWith('neon')) ?? ''
  const inkOf = (el: Element): { top: number, bottom: number, left: number, right: number } | null => {
    const texts = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
    let box: { top: number, bottom: number, left: number, right: number } | null = null
    for (let t = texts.nextNode(); t; t = texts.nextNode()) {
      if (!(t.textContent ?? '').trim()) continue
      const range = document.createRange()
      range.selectNodeContents(t)
      const r = range.getBoundingClientRect()
      if (r.height <= 0) continue
      box = box ? { top: Math.min(box.top, r.top), bottom: Math.max(box.bottom, r.bottom), left: Math.min(box.left, r.left), right: Math.max(box.right, r.right) } : { top: r.top, bottom: r.bottom, left: r.left, right: r.right }
    }
    return box
  }
  const out: IAnchor[] = []
  const seen = new Set<Element>()
  const walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT)
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (!(node.textContent ?? '').trim()) continue
    let el = node.parentElement
    while (el && el !== scope && getComputedStyle(el).display === 'inline') el = el.parentElement
    el = el?.closest(CONTROL_BOX) ?? el
    if (!el || seen.has(el)) continue
    seen.add(el)
    const rect = el.getBoundingClientRect()
    if (rect.width <= 1 || rect.height <= 1 || getComputedStyle(el).visibility === 'hidden' || el.closest('[aria-hidden="true"]')) continue
    const text = (el as HTMLElement).innerText.trim().toLowerCase().replace(/\s+/g, ' ').replace(/\d+/g, '#').slice(0, 80)
    if (!text) continue
    const chain: string[] = []
    for (let up: Element | null = el.parentElement; up && up !== scope.parentElement; up = up.parentElement) chain.unshift(`${idOf(up)}:${owner(up)}`)
    const ink = inkOf(el)
    if (!ink) continue
    out.push({ text, top: ink.top + window.scrollY, bottom: ink.bottom + window.scrollY, left: ink.left, right: ink.right, label: label(el), chain })
  }
  return out
}

const commonOwner = (a: string[], b: string[]): string => {
  let owner = ''
  for (let i = 0; i < Math.min(a.length, b.length) && a[i] === b[i]; i++) {
    const name = a[i]!.split(':')[1]
    if (name) owner = name
  }
  return owner
}

const stacked = (a: IAnchor, b: IAnchor) => b.top >= a.bottom - 1 && Math.min(a.right, b.right) - Math.max(a.left, b.left) > 0

const compareAnchors = (pageName: string, width: number, app: IAnchor[], mock: IAnchor[]): { diffs: IDiff[], stat: IPageStat } => {
  const count = (list: IAnchor[]) => list.reduce((acc, x) => acc.set(x.text, (acc.get(x.text) ?? 0) + 1), new Map<string, number>())
  const appCount = count(app)
  const mockCount = count(mock)
  const mockIndex = new Map(mock.map((x, i) => [x.text, i]))
  const isMatched = (x: IAnchor) => appCount.get(x.text) === 1 && mockCount.get(x.text) === 1
  const diffs: IDiff[] = []
  let compared = 0
  for (let i = 1; i < app.length; i++) {
    const a = app[i - 1]!
    const b = app[i]!
    if (!isMatched(a) || !isMatched(b)) continue
    const ma = mock[mockIndex.get(a.text)!]!
    const mb = mock[mockIndex.get(b.text)!]!
    if (mockIndex.get(b.text) !== mockIndex.get(a.text)! + 1) continue
    if (!stacked(a, b) || !stacked(ma, mb)) continue
    compared++
    const appGap = Math.round((b.top - a.bottom) * 10) / 10
    const mockGap = Math.round((mb.top - ma.bottom) * 10) / 10
    const delta = Math.round((appGap - mockGap) * 10) / 10
    if (Math.abs(delta) <= SPACING_MOCKUP_MAX_DELTA) continue
    diffs.push({ page: pageName, width, a: a.text, b: b.text, mock: mockGap, app: appGap, delta, owner: commonOwner(a.chain, b.chain), appA: a.label, appB: b.label })
  }
  const matched = app.filter(isMatched).length
  return { diffs, stat: { page: pageName, width, appAnchors: app.length, mockAnchors: mock.length, matched, compared, flagged: diffs.length } }
}

const openMockup = async (mockup: Page, entry: typeof SPACING_MOCKUP_CASES[number]) => {
  await mockup.goto(`file://${MOCKUP_DIR}/${entry.mockup}`)
  await mockup.waitForLoadState('load')
  if (entry.mockupHash) await mockup.evaluate((hash) => { location.hash = hash }, `#${entry.mockupHash}`)
  if (entry.mockupTab) await mockup.locator(entry.mockupTab).click()
  await mockup.addStyleTag({ content: `${SPACING_MOCKUP_GLOBAL_CSS} ${entry.mockupCss ?? ''}` })
  await mockup.evaluate(() => document.fonts.ready)
}

const report = (diffs: IDiff[], stats: IPageStat[]): string => {
  const lines: string[] = []
  const tally = (key: (d: IDiff) => string) => [...diffs.reduce((acc, d) => acc.set(key(d), (acc.get(key(d)) ?? 0) + 1), new Map<string, number>())].sort((x, y) => y[1] - x[1])
  lines.push('# Audit des espacements contre la maquette (F-64)', '')
  lines.push(`Généré par \`npm run audit:spacing\` (\`packages/web/tests/e2e/audit/spacing-mockup.audit.ts\`) le ${new Date().toISOString().slice(0, 10)}.`)
  lines.push(`Écart vertical entre deux blocs correspondants consécutifs (ancres de texte uniques des deux côtés), application − maquette ; signalé au-delà de ${SPACING_MOCKUP_MAX_DELTA} px. Largeurs : ${SPACING_AUDIT_VIEWPORTS.map(v => v.width).join(', ')}. Méthode et limites : en tête du script.`, '')
  lines.push(`Écarts comparés : ${stats.reduce((s, x) => s + x.compared, 0)}. Différences > ${SPACING_MOCKUP_MAX_DELTA} px : **${diffs.length}** (application plus serrée : ${diffs.filter(d => d.delta < 0).length} ; plus lâche : ${diffs.filter(d => d.delta > 0).length}).`, '')
  lines.push('## Couverture par écran', '', '| écran | largeur | ancres app | ancres maquette | correspondantes | écarts comparés | signalés |', '|---|---|---|---|---|---|---|')
  for (const s of stats) lines.push(`| ${s.page} | ${s.width} | ${s.appAnchors} | ${s.mockAnchors} | ${s.matched} | ${s.compared} | ${s.flagged} |`)
  lines.push('', '## Par composant (cause)', '', '| composant de l\'application | cas |', '|---|---|')
  for (const [k, v] of tally(d => d.owner || '—')) lines.push(`| ${md(k)} | ${v} |`)
  lines.push('', '## Détail', '', '| écran | largeur | bloc A | bloc B | maquette (px) | app (px) | Δ (px) | composant | sélecteur A | sélecteur B |', '|---|---|---|---|---|---|---|---|---|---|')
  for (const d of diffs) lines.push(`| ${d.page} | ${d.width} | ${md(d.a)} | ${md(d.b)} | ${d.mock} | ${d.app} | ${d.delta > 0 ? '+' : ''}${d.delta} | ${md(d.owner)} | \`${md(d.appA)}\` | \`${md(d.appB)}\` |`)
  return `${lines.join('\n')}\n`
}

test('audit des espacements contre la maquette (F-64)', async ({ browser }) => {
  test.setTimeout(45 * 60 * 1000)
  const admin = await newContext(browser, 'admin')
  const competitors = await (await admin.request.get('/api/v1/competiteurs?pageSize=1&sort=displayName')).json() as { items: Array<{ id: string }> }
  const pair = await resolvePair(admin.request)
  await admin.close()
  const replacements: Record<string, string> = {
    '{competitor}': competitors.items[0]?.id ?? '',
    '{invitation}': e2eSecrets().invitations.valid,
    '{pair}': pairUrl(pair.a, pair.b)
  }

  const diffs: IDiff[] = []
  const stats: IPageStat[] = []
  for (const viewport of SPACING_AUDIT_VIEWPORTS) {
    const mockContext = await browser.newContext({ viewport, reducedMotion: 'reduce' })
    const mockup = await mockContext.newPage()
    for (const entry of SPACING_MOCKUP_CASES) {
      const path = Object.entries(replacements).reduce((p, [k, v]) => p.replace(k, v), entry.path)
      const context = await newContext(browser, entry.role)
      const page = await context.newPage()
      await page.setViewportSize(viewport)
      await open(page, path)
      await settle(page)
      await openMockup(mockup, entry)
      const result = compareAnchors(entry.name, viewport.width, await page.evaluate(anchorsOf), await mockup.evaluate(anchorsOf))
      diffs.push(...result.diffs)
      stats.push(result.stat)
      await context.close()
    }
    await mockContext.close()
  }

  writeFileSync(resolve(process.env.SPACING_MOCKUP_AUDIT_OUT ?? SPACING_MOCKUP_DEFAULT_OUT), report(diffs, stats))
  writeFileSync(resolve('test-results', 'spacing-mockup-audit.json'), JSON.stringify({ diffs, stats }, null, 2))
})

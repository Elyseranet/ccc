import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { test } from '@playwright/test'
import type { Browser, BrowserContext, Page } from '@playwright/test'
import { E2E_BASE_URL } from '../helpers/e2e.const'
import { e2eSecrets, signIn } from '../helpers/session'
import {
  SPACING_AUDIT_CASES,
  SPACING_AUDIT_COMPETITOR_PLACEHOLDER,
  SPACING_AUDIT_DEFAULT_OUT,
  SPACING_AUDIT_INVITATION_PLACEHOLDER,
  SPACING_AUDIT_MIN_GAP,
  SPACING_AUDIT_RULES,
  SPACING_AUDIT_VIEWPORTS
} from './spacing.const'
import type { ISpacingAuditCase, TSpacingAuditRole } from './spacing.const'

/*********************************************************
 * Audit des espacements (F-63) — `npm run audit:spacing`
 *
 * @description
 * Pour chaque route et état (voir `spacing.const.ts`), à 1440 et 390, liste les paires de blocs frères visibles,
 * consécutifs dans le flux, empilés verticalement (chevauchement horizontal > 0) dont l'écart vertical est inférieur à
 * `SPACING_AUDIT_MIN_GAP` px, ou qui se chevauchent (écart négatif). Un enfant `display: contents` est remplacé par ses
 * propres enfants (ils sont frères dans la mise en page du parent). Sont ignorés : éléments hors flux (absolute, fixed),
 * en ligne (`display: inline`), invisibles ou de 1 px au plus (texte masqué pour lecteur d'écran).
 *
 * Règles d'exclusion (faux positifs par design) : `SPACING_AUDIT_RULES` (`spacing.const.ts`), recopiées et comptées dans le rapport.
 * Les identifiants (uuid) sont retirés des sélecteurs : une même paire répétée par ligne de données compte une fois.
 *
 * Cause attribuée selon le parent direct (celui à qui il manque l'espacement) : `card__content`, `form__content`,
 * `dialog` (contenu de carte dans une boîte de dialogue), `async-state` (enveloppe de slot), sinon `local`.
 ********************************************************/

interface IFinding {
  parent: string
  a: string
  b: string
  gap: number
  wrapper: string
  cause: string
  parentGap: string
  lostGap: string
  visible: number
  excluded: string | null
}

interface IRow extends IFinding {
  path: string
  state: string
  width: number
}

const collect = (minGap: number): IFinding[] => {
  const TABLE_TAGS = new Set(['TABLE', 'THEAD', 'TBODY', 'TFOOT', 'TR', 'TD', 'TH', 'CAPTION', 'COLGROUP'])
  const TABLE_ROLES = new Set(['row', 'cell', 'rowgroup', 'columnheader', 'rowheader', 'gridcell', 'table', 'grid'])
  const ITEM_ROLES = new Set(['option', 'listitem', 'menuitem', 'tab', 'treeitem'])
  const CONTROL_SELECTOR = 'button, a, label, .origam-btn, .origam-input, .origam-field, .origam-chip, .origam-avatar, .origam-skeleton-group'
  const SKIPPED_TAGS = new Set(['SCRIPT', 'STYLE', 'TEMPLATE', 'BR', 'NOSCRIPT', 'LINK', 'META'])
  const TEXT_TAGS = new Set(['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'LABEL', 'SMALL', 'B', 'STRONG'])
  const LANDMARK_TAGS = new Set(['HEADER', 'MAIN', 'FOOTER', 'NAV', 'ASIDE'])
  const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g

  const label = (el: Element): string => {
    let out = el.tagName.toLowerCase()
    const cy = el.getAttribute('data-cy')
    if (cy) out += `[data-cy="${cy.replace(UUID, '*')}"]`
    const classes = [...el.classList].filter(c => !c.startsWith('origam--') && !c.startsWith('font-') && !c.startsWith('data-v-')).slice(0, 2)
    if (classes.length) out += `.${classes.join('.')}`
    return out
  }

  const path = (el: Element): string => {
    const parts: string[] = []
    let node: Element | null = el
    while (node && node !== document.body && parts.length < 4) {
      parts.unshift(label(node))
      if (node.getAttribute('data-cy')) break
      node = node.parentElement
    }
    return parts.join(' > ')
  }

  const isRendered = (el: Element): boolean => {
    if (SKIPPED_TAGS.has(el.tagName)) return false
    const style = getComputedStyle(el)
    if (style.display === 'none' || style.visibility === 'hidden' || style.display === 'inline') return false
    if (style.position === 'absolute' || style.position === 'fixed') return false
    const rect = el.getBoundingClientRect()
    return rect.width > 1 && rect.height > 1
  }

  const flowChildren = (el: Element): Element[] => [...el.children].flatMap((child) => {
    if (SKIPPED_TAGS.has(child.tagName)) return []
    if (getComputedStyle(child).display === 'contents') return flowChildren(child)
    return isRendered(child) ? [child] : []
  })

  const isTable = (el: Element): boolean => TABLE_TAGS.has(el.tagName) || TABLE_ROLES.has(el.getAttribute('role') ?? '')
  const isItem = (el: Element): boolean => el.tagName === 'LI' || ITEM_ROLES.has(el.getAttribute('role') ?? '') || el.classList.contains('origam-list-item')
  const isOrigamPart = (el: Element): boolean => [...el.classList].some(c => /^origam-[a-z0-9-]+__[a-z0-9-]+$/.test(c))

  const isPainted = (el: Element): boolean => {
    const style = getComputedStyle(el)
    const transparent = style.backgroundColor === 'transparent' || /rgba\(.*,\s*0\)$/.test(style.backgroundColor)
    const bordered = ['Top', 'Bottom'].some(side => parseFloat(style.getPropertyValue(`border-${side.toLowerCase()}-width`)) > 0 && style.getPropertyValue(`border-${side.toLowerCase()}-style`) !== 'none')
    return !transparent || style.backgroundImage !== 'none' || bordered || style.boxShadow !== 'none'
  }

  const UNPAINTED_CONTROL_SELECTOR = '.origam-btn, button, a'
  const FORM_CONTROL_SELECTOR = 'input, select, textarea, [role="combobox"], [role="textbox"], .origam-field'
  const REPLACED_TAGS = new Set(['IMG', 'SVG', 'VIDEO', 'CANVAS', 'INPUT', 'TEXTAREA', 'SELECT', 'IFRAME'])
  const hasOwnText = (el: Element): boolean => [...el.childNodes].some(n => n.nodeType === Node.TEXT_NODE && (n.textContent ?? '').trim() !== '')
  const isInk = (el: Element): boolean => isPainted(el) || REPLACED_TAGS.has(el.tagName.toUpperCase()) || hasOwnText(el) || el.children.length === 0

  /** Bord visible d'un bloc : sa boîte s'il est peint, sinon celle du premier (ou dernier) descendant visible qui l'est. */
  const textEdges = (el: Element, edge: 'top' | 'bottom'): number[] => {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
    const edges: number[] = []
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      if (!(node.textContent ?? '').trim()) continue
      const range = document.createRange()
      range.selectNodeContents(node)
      const rect = range.getBoundingClientRect()
      if (rect.height > 0) edges.push(rect[edge])
    }
    return edges
  }

  /** Élément qui porte le bord visible (`source`) et la position de ce bord. */
  const inkFace = (el: Element, edge: 'top' | 'bottom'): { source: Element, at: number } => {
    if (el.matches(UNPAINTED_CONTROL_SELECTOR) && !isPainted(el)) {
      const edges = textEdges(el, edge)
      if (edges.length) return { source: el, at: edge === 'top' ? Math.min(...edges) : Math.max(...edges) }
    }
    if (isInk(el)) return { source: el, at: el.getBoundingClientRect()[edge] }
    const faces = [...el.querySelectorAll('*')]
      .filter(d => isInk(d) && getComputedStyle(d).visibility !== 'hidden' && d.getBoundingClientRect().height > 1)
      .map(d => ({ source: d, at: d.getBoundingClientRect()[edge] }))
    if (!faces.length) return { source: el, at: el.getBoundingClientRect()[edge] }
    return faces.reduce((best, f) => (edge === 'top' ? f.at < best.at : f.at > best.at) ? f : best)
  }

  const inkEdge = (el: Element, edge: 'top' | 'bottom'): number => inkFace(el, edge).at

  /** Face de texte en ligne : du texte, sans fond de bloc (une puce en ligne est admise), ni contrôle de formulaire. */
  const isTextFace = (el: Element): boolean => {
    if (el.matches(FORM_CONTROL_SELECTOR) || el.closest(FORM_CONTROL_SELECTOR) || el.querySelector(FORM_CONTROL_SELECTOR)) return false
    if (isPainted(el) && !getComputedStyle(el).display.startsWith('inline')) return false
    return (el.textContent ?? '').trim() !== ''
  }

  const visibleGap = (a: Element, b: Element): number => inkEdge(b, 'top') - inkEdge(a, 'bottom')

  const exclusion = (parent: Element, a: Element, b: Element, gap: number): string | null => {
    if (isTable(parent) || isTable(a) || isTable(b)) return 'tableau'
    if (isItem(a) && isItem(b)) return 'liste'
    if (parent.closest('.origam-bracket')) return 'bracket'
    if ((isOrigamPart(a) && isOrigamPart(b)) || parent.closest(CONTROL_SELECTOR)) return 'interne-origam'
    if (TEXT_TAGS.has(parent.tagName)) return 'typo'
    if (LANDMARK_TAGS.has(a.tagName) && LANDMARK_TAGS.has(b.tagName) && !parent.closest('main')) return 'coque'
    if (gap >= 0 && getComputedStyle(parent).rowGap !== 'normal') return 'gap-explicite'
    if (gap >= 0 && visibleGap(a, b) >= minGap) return 'padding'
    if (gap >= 0 && causeOf(parent) === 'local' && isTextFace(inkFace(a, 'bottom').source) && isTextFace(inkFace(b, 'top').source)) return 'texte-interligne'
    return null
  }

  const wrapperOf = (el: Element): string => {
    let node: Element | null = el
    while (node && node !== document.body) {
      const block = [...node.classList].find(c => /^origam-[a-z0-9-]+$/.test(c) && !c.startsWith('origam--'))
      if (block) return block
      node = node.parentElement
    }
    return ''
  }

  const causeOf = (parent: Element): string => {
    const inDialog = Boolean(parent.closest('.origam-dialog, [role="dialog"]'))
    if (parent.classList.contains('origam-card__content')) return inDialog ? 'dialog' : 'card__content'
    if (parent.classList.contains('origam-form__content')) return inDialog ? 'dialog' : 'form__content'
    if (parent.classList.contains('async-state')) return 'async-state'
    return inDialog ? 'dialog' : 'local'
  }

  const gapOf = (el: Element | null): string => {
    if (!el) return ''
    const style = getComputedStyle(el)
    return `${style.display} ${style.rowGap}`
  }

  const lostGapOf = (parent: Element): string => {
    let node = parent.parentElement
    for (let depth = 0; node && depth < 3; depth++, node = node.parentElement) {
      const gap = getComputedStyle(node).rowGap
      if (gap !== 'normal' && gap !== '0px') return `${label(node)} ${gap}`
    }
    return ''
  }

  const findings: IFinding[] = []
  for (const parent of document.body.querySelectorAll('*')) {
    if (getComputedStyle(parent).display === 'contents' || !isRendered(parent)) continue
    const children = flowChildren(parent)
    for (let i = 1; i < children.length; i++) {
      const a = children[i - 1]!
      const b = children[i]!
      const ra = a.getBoundingClientRect()
      const rb = b.getBoundingClientRect()
      const overlapX = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left)
      if (overlapX <= 0) continue
      const gap = rb.top >= ra.top ? rb.top - ra.bottom : ra.top - rb.bottom
      if (gap >= minGap) continue
      const excluded = exclusion(parent, a, b, gap)
      findings.push({
        parent: path(parent),
        a: label(a),
        b: label(b),
        gap: Math.round(gap * 10) / 10,
        wrapper: wrapperOf(parent),
        cause: causeOf(parent),
        parentGap: gapOf(parent),
        lostGap: lostGapOf(parent),
        visible: excluded && excluded !== 'padding' ? gap : Math.round(visibleGap(a, b) * 10) / 10,
        excluded
      })
    }
  }
  return findings
}

/**
 * Relevé de mise en page (`SPACING_AUDIT_LAYOUT=<fichier>`) : pour chaque élément visible portant un `data-cy`, sa hauteur et
 * sa distance verticale au précédent dans l'ordre du document. Deux relevés (avant / après un changement) se comparent sans
 * effet de cascade : un décalage en haut de page ne change pas les distances plus bas.
 */
const layoutOf = (): Record<string, number[]> => {
  const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g
  const out: Record<string, number[]> = {}
  let previousTop: number | null = null
  for (const el of document.querySelectorAll('[data-cy]')) {
    const rect = el.getBoundingClientRect()
    if (rect.height <= 1 || rect.width <= 1) continue
    let key = (el.getAttribute('data-cy') ?? '').replace(UUID, '*')
    for (let n = 2; key in out; n++) key = `${key.split('#')[0]}#${n}`
    out[key] = [Math.round(rect.height), previousTop === null ? 0 : Math.round(rect.top - previousTop)]
    previousTop = rect.top
  }
  return out
}

const settle = async (page: Page) => {
  await page.waitForLoadState('networkidle')
  await page.locator('[data-cy="async-state-loading"]').first().waitFor({ state: 'detached', timeout: 10000 }).catch(() => undefined)
}

const open = async (page: Page, path: string) => {
  await page.goto(path)
  await page.waitForFunction(() => (window as unknown as { useNuxtApp?: () => { isHydrating: boolean } }).useNuxtApp?.().isHydrating === false, undefined, { timeout: 30000 }).catch(() => undefined)
  await settle(page)
}

const newContext = async (browser: Browser, role: TSpacingAuditRole): Promise<BrowserContext> => {
  const context = await browser.newContext({ baseURL: E2E_BASE_URL, reducedMotion: 'reduce', locale: 'fr-FR' })
  if (role !== 'anonymous') await signIn(context, role)
  return context
}

const md = (value: string | number) => String(value).replaceAll('|', '\\|')

const report = (rows: IRow[], unreached: string[], paths: string[]): string => {
  const kept = rows.filter(r => !r.excluded)
  const count = <K extends keyof IRow>(list: IRow[], key: K) => list.reduce<Record<string, number>>((acc, r) => {
    const k = String(r[key]) || '—'
    acc[k] = (acc[k] ?? 0) + 1
    return acc
  }, {})
  const sorted = (rec: Record<string, number>) => Object.entries(rec).sort((x, y) => y[1] - x[1])
  const lines: string[] = []
  lines.push('# Audit des espacements (F-63)', '')
  lines.push(`Généré par \`npm run audit:spacing\` (\`packages/web/tests/e2e/audit/spacing.audit.ts\`) le ${new Date().toISOString().slice(0, 10)}.`)
  lines.push(`Seuil : écart vertical < ${SPACING_AUDIT_MIN_GAP} px entre deux blocs frères empilés, ou chevauchement (écart négatif). Largeurs : ${SPACING_AUDIT_VIEWPORTS.map(v => v.width).join(', ')}.`, '')
  lines.push(`Pages et états visités : ${paths.length}. Cas retenus : **${kept.length}** ; exclus par règle : ${rows.length - kept.length}.`, '')
  lines.push('## Par cause', '', '| cause | cas |', '|---|---|')
  for (const [k, v] of sorted(count(kept, 'cause'))) lines.push(`| ${md(k)} | ${v} |`)
  lines.push('', '## Par composant Origam enveloppant', '', '| composant | cas |', '|---|---|')
  for (const [k, v] of sorted(count(kept, 'wrapper'))) lines.push(`| ${md(k)} | ${v} |`)
  lines.push('', '## Par page', '', '| page | 1440 | 390 |', '|---|---|---|')
  const pages = [...new Set(kept.map(r => r.path))]
  for (const p of pages) lines.push(`| ${md(p)} | ${kept.filter(r => r.path === p && r.width === 1440).length} | ${kept.filter(r => r.path === p && r.width === 390).length} |`)
  lines.push('', '## Règles d\'exclusion', '')
  for (const [rule, text] of Object.entries(SPACING_AUDIT_RULES)) lines.push(`- \`${rule}\` : ${text}`)
  lines.push('', '## Exclusions par règle', '', '| règle | cas |', '|---|---|')
  for (const [k, v] of sorted(count(rows.filter(r => r.excluded), 'excluded'))) lines.push(`| ${md(k)} | ${v} |`)
  if (unreached.length) {
    lines.push('', '## États non atteints', '')
    for (const u of unreached) lines.push(`- ${md(u)}`)
  }
  lines.push('', '## Détail', '', '| page | état | largeur | parent | enfant A | enfant B | écart boîtes (px) | écart visible (px) | Origam | cause | parent (display gap) | gap perdu (ancêtre) |', '|---|---|---|---|---|---|---|---|---|---|---|---|')
  for (const r of kept) lines.push(`| ${md(r.path)} | ${md(r.state)} | ${r.width} | \`${md(r.parent)}\` | \`${md(r.a)}\` | \`${md(r.b)}\` | ${r.gap} | ${r.visible} | ${md(r.wrapper)} | ${md(r.cause)} | ${md(r.parentGap)} | ${md(r.lostGap)} |`)
  return `${lines.join('\n')}\n`
}

test('audit des espacements (F-63)', async ({ browser }) => {
  test.setTimeout(45 * 60 * 1000)
  const admin = await newContext(browser, 'admin')
  const competitors = await (await admin.request.get('/api/v1/competiteurs?pageSize=1&sort=displayName')).json() as { items: Array<{ id: string }> }
  const replacements: Record<string, string> = {
    [SPACING_AUDIT_COMPETITOR_PLACEHOLDER]: competitors.items[0]?.id ?? '',
    [SPACING_AUDIT_INVITATION_PLACEHOLDER]: e2eSecrets().invitations.valid
  }
  await admin.close()

  const rows: IRow[] = []
  const layout: Record<string, Record<string, number[]>> = {}
  const unreached: string[] = []
  const seen = new Set<string>()
  const visited: string[] = []

  for (const viewport of SPACING_AUDIT_VIEWPORTS) {
    for (const entry of SPACING_AUDIT_CASES as ISpacingAuditCase[]) {
      const path = Object.entries(replacements).reduce((p, [k, v]) => p.replace(k, v), entry.path)
      const displayPath = entry.path.includes('{') ? entry.route : path
      const context = await newContext(browser, entry.role)
      const page = await context.newPage()
      await page.setViewportSize(viewport)
      const audit = async (state: string) => {
        if (process.env.SPACING_AUDIT_LAYOUT) layout[`${displayPath} | ${state} | ${viewport.width}`] = await page.evaluate(layoutOf)
        visited.push(`${displayPath} ${state} ${viewport.width}`)
        for (const f of await page.evaluate(collect, SPACING_AUDIT_MIN_GAP)) {
          const key = [viewport.width, displayPath, f.parent, f.a, f.b].join('|')
          if (seen.has(key)) continue
          seen.add(key)
          rows.push({ ...f, path: displayPath, state, width: viewport.width })
        }
      }
      await open(page, path)
      await audit('initial')
      for (const action of entry.actions ?? []) {
        if (action.kind === 'tabs') {
          const tabs = page.locator('main [role="tab"]')
          const total = await tabs.count()
          for (let i = 1; i < total; i++) {
            const tab = tabs.nth(i)
            if (!(await tab.isVisible())) continue
            const name = (await tab.innerText()).trim()
            await tab.click()
            await settle(page)
            await audit(`onglet ${name}`)
          }
          continue
        }
        const trigger = page.locator(action.trigger).first()
        if (!(await trigger.isVisible().catch(() => false)) || !(await trigger.isEnabled().catch(() => false))) {
          unreached.push(`${displayPath} @${viewport.width} : ${action.kind} ${action.trigger} (déclencheur absent ou désactivé)`)
          continue
        }
        await trigger.click()
        if (action.kind === 'dialog') {
          const dialog = page.locator('[role="dialog"]').first()
          const opened = await dialog.waitFor({ state: 'visible', timeout: 5000 }).then(() => true).catch(() => false)
          if (!opened) {
            unreached.push(`${displayPath} @${viewport.width} : boîte ${action.trigger} non ouverte`)
            continue
          }
          await settle(page)
          await audit(`boîte ${action.trigger}`)
          await page.keyboard.press('Escape')
        } else {
          await settle(page)
          await audit(`soumis vide ${action.trigger}`)
        }
      }
      await context.close()
    }
  }

  const out = resolve(process.env.SPACING_AUDIT_OUT ?? SPACING_AUDIT_DEFAULT_OUT)
  writeFileSync(out, report(rows, unreached, visited))
  writeFileSync(resolve('test-results', 'spacing-audit.json'), JSON.stringify(rows, null, 2))
  if (process.env.SPACING_AUDIT_LAYOUT) writeFileSync(resolve(process.env.SPACING_AUDIT_LAYOUT), JSON.stringify(layout))
})

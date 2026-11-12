import { test } from '@playwright/test'
import { signIn } from '../helpers/session'

// JETABLE (T-A11Y-01 M1) : ratio du filet des champs contre le fond réel, avant (règle neutralisée) et après.
const SCREENS: Array<{ path: string, role: 'admin' | 'member' | null }> = [
  { path: '/joueurs', role: null },
  { path: '/joueurs/face-a-face', role: null },
  { path: '/connexion', role: null },
  { path: '/profil', role: 'member' },
  { path: '/admin/editions', role: 'admin' },
  { path: '/admin/participants', role: 'admin' },
  { path: '/admin/tirages', role: 'admin' },
  { path: '/admin/plus', role: 'admin' },
  { path: '/admin/competiteurs', role: 'admin' },
  { path: '/admin/matchs', role: 'admin' }
]

const MEASURE = () => {
  const parse = (value: string): number[] | null => {
    const m = value.match(/rgba?\(([^)]+)\)/) ?? value.match(/color\(srgb ([^)]+)\)/)
    if (!m) return null
    const raw = m[1]!.replace('/', ' ').split(/[ ,]+/).filter(Boolean).map(Number)
    if (value.startsWith('color(')) return [raw[0]! * 255, raw[1]! * 255, raw[2]! * 255, raw[3] ?? 1]
    return [raw[0]!, raw[1]!, raw[2]!, raw[3] ?? 1]
  }
  const over = (top: number[], bottom: number[]): number[] => {
    const a = top[3]!
    return [0, 1, 2].map(i => top[i]! * a + bottom[i]! * (1 - a)).concat([1])
  }
  const lum = (c: number[]): number => {
    const f = (v: number) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4 }
    return 0.2126 * f(c[0]!) + 0.7152 * f(c[1]!) + 0.0722 * f(c[2]!)
  }
  const ratio = (a: number[], b: number[]) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x! + 0.05) / (y! + 0.05) }
  const rootBg = parse(getComputedStyle(document.documentElement).getPropertyValue('--origam-color__surface---default').trim()) ?? [255, 255, 255, 1]
  const backdrop = (el: Element): number[] => {
    const layers: number[][] = []
    for (let n: Element | null = el.parentElement; n; n = n.parentElement) {
      const c = parse(getComputedStyle(n).backgroundColor)
      if (c && c[3]! > 0) { layers.push(c); if (c[3] === 1) break }
    }
    let acc = layers.length && layers[layers.length - 1]![3] === 1 ? layers.pop()! : [...rootBg.slice(0, 3), 1]
    while (layers.length) acc = over(layers.pop()!, acc)
    return acc
  }
  const rows: string[] = []
  document.querySelectorAll('.origam-field').forEach((field) => {
    const target = [field, ...field.querySelectorAll('*')].find((e) => { const s = getComputedStyle(e); return parseFloat(s.borderTopWidth) > 0 && s.borderTopStyle !== 'none' })
    if (!target) return
    const style = getComputedStyle(target)
    const border = parse(style.borderTopColor)
    if (!border) return
    const bg = backdrop(target)
    const flat = over(border, bg)
    const inCard = !!field.closest('.origam-card, .origam-dialog')
    const err = field.classList.toString().includes('error') || !!field.closest('[class*="--error"]')
    rows.push(`${inCard ? 'carte' : 'hors'}${err ? ' ERR' : ''} ${(field.querySelector('input,textarea,select,[role=combobox]')?.getAttribute('aria-label') ?? field.textContent ?? '').slice(0, 24).trim()} | ${ratio(flat, bg).toFixed(2)}`)
  })
  return rows
}

for (const screen of SCREENS) {
  test(`mesure ${screen.path}`, async ({ page, context }) => {
    if (screen.role) await signIn(context, screen.role)
    await page.goto(screen.path)
    await page.waitForFunction(() => (window as unknown as { useNuxtApp?: () => { isHydrating: boolean } }).useNuxtApp?.().isHydrating === false).catch(() => undefined)
    await page.waitForTimeout(1500)
    const after = await page.evaluate(MEASURE)
    await page.addStyleTag({ content: 'html, body, .origam-card, .origam-dialog { --origam-field---border-color: var(--origam-color__border---default) !important; }' })
    await page.waitForTimeout(300)
    const before = await page.evaluate(MEASURE)
    console.log(`RATIO ${screen.path} url=${page.url().replace(/^https?:\/\/[^/]+/, '')}\n  AVANT: ${before.join(' ; ')}\n  APRES: ${after.join(' ; ')}`)
  })
}

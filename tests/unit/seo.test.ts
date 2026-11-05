import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'
import { SEO_DESCRIPTION_MAX_LENGTH, SEO_MESSAGES, SEO_PRIVATE_ROUTE_PATTERNS, SEO_TITLE_MAX_LENGTH } from '../../src/consts/seo.const'
import { SEO_PAGE } from '../../src/enums/seo.enum'
import { buildAbsoluteImageUrl, buildCanonicalUrl } from '../../src/utils/seo.util'

const read = (file: string): Record<string, string> => JSON.parse(readFileSync(file, 'utf8'))
const fr = read('src/assets/locales/fr.json')
const en = read('src/assets/locales/en.json')

/** Paramètres réalistes : le code d'une édition, le nom le plus long qu'on puisse raisonnablement afficher. */
const SAMPLE_PARAMS = { code: '2012b', name: 'Prénom Nom-Composé-Long' }
const fill = (text: string): string => Object.entries(SAMPLE_PARAMS).reduce((message, [name, value]) => message.replaceAll(`{${name}}`, value), text)

describe('URL canonique et image de partage', () => {
  it('l’origine du site suivie du chemin, sans query, fragment, ni slash final', () => {
    expect(buildCanonicalUrl('https://ccc.example.test', '/regles?onglet=jeu#variantes')).toBe('https://ccc.example.test/regles')
    expect(buildCanonicalUrl('https://ccc.example.test/', '/editions/2025/')).toBe('https://ccc.example.test/editions/2025')
    expect(buildCanonicalUrl('https://ccc.example.test//', 'joueurs/face-a-face?a=1&b=2')).toBe('https://ccc.example.test/joueurs/face-a-face')
  })

  it('la racine a pour canonique l’origine seule', () => {
    expect(buildCanonicalUrl('https://ccc.example.test/', '/')).toBe('https://ccc.example.test')
    expect(buildCanonicalUrl('https://ccc.example.test', '')).toBe('https://ccc.example.test')
  })

  it('l’image : vide si rien n’est configuré, chemin rattaché au site, URL absolue gardée', () => {
    expect(buildAbsoluteImageUrl('https://ccc.example.test', '  ')).toBe('')
    expect(buildAbsoluteImageUrl('https://ccc.example.test/', '/partage.png')).toBe('https://ccc.example.test/partage.png')
    expect(buildAbsoluteImageUrl('https://ccc.example.test', 'https://cdn.example.test/partage.png')).toBe('https://cdn.example.test/partage.png')
  })
})

describe('textes de référencement : une clé par page, uniques, bornés', () => {
  const pages = Object.values(SEO_PAGE)

  it('chaque page a ses clés seo.<page>.title et seo.<page>.description, en français comme en anglais', () => {
    for (const page of pages) {
      expect(SEO_MESSAGES[page].title.key).toBe(`seo.${page}.title`)
      expect(SEO_MESSAGES[page].description.key).toBe(`seo.${page}.description`)
      for (const locale of [fr, en]) {
        expect(locale[`seo.${page}.title`], page).toBeTruthy()
        expect(locale[`seo.${page}.description`], page).toBeTruthy()
      }
    }
    const extra = Object.keys(fr).filter(key => key.startsWith('seo.') && !pages.some(page => key === `seo.${page}.title` || key === `seo.${page}.description`))
    expect(extra).toEqual([])
  })

  it('les libellés de repli du code sont ceux de fr.json', () => {
    for (const page of pages) {
      expect(SEO_MESSAGES[page].title.label).toBe(fr[`seo.${page}.title`])
      expect(SEO_MESSAGES[page].description.label).toBe(fr[`seo.${page}.description`])
    }
  })

  it.each([['fr', fr], ['en', en]])('chaque titre et chaque description sont uniques (%s)', (_, locale) => {
    const titles = pages.map(page => locale[`seo.${page}.title`])
    const descriptions = pages.map(page => locale[`seo.${page}.description`])
    expect(new Set(titles).size).toBe(titles.length)
    expect(new Set(descriptions).size).toBe(descriptions.length)
  })

  it.each([['fr', fr], ['en', en]])('un titre tient en %i caractères et une description en %i (%s)'.replace('%i', String(SEO_TITLE_MAX_LENGTH)).replace('%i', String(SEO_DESCRIPTION_MAX_LENGTH)), (_, locale) => {
    for (const page of pages) {
      expect(fill(locale[`seo.${page}.title`]!).length, `${page} title`).toBeLessThanOrEqual(SEO_TITLE_MAX_LENGTH)
      expect(fill(locale[`seo.${page}.description`]!).length, `${page} description`).toBeLessThanOrEqual(SEO_DESCRIPTION_MAX_LENGTH)
    }
  })
})

const PAGES_DIR = 'src/pages'
const listPages = (dir: string): string[] => readdirSync(dir).flatMap((name) => {
  const path = join(dir, name)
  return statSync(path).isDirectory() ? listPages(path) : [path]
})
const routeOf = (file: string): string => `/${relative(PAGES_DIR, file).replace(/\.vue$/, '').replace(/(^|\/)index$/, '')}`.replace(/\/$/, '') || '/'

describe('chaque page appelle useSeo', () => {
  const files = listPages(PAGES_DIR)
  const source = (file: string): string => readFileSync(file, 'utf8')
  const publicPages: Record<string, SEO_PAGE> = {
    'src/pages/index.vue': SEO_PAGE.HOME,
    'src/pages/editions/index.vue': SEO_PAGE.EDITIONS,
    'src/pages/editions/[id].vue': SEO_PAGE.EDITION,
    'src/pages/joueurs/index.vue': SEO_PAGE.PLAYERS,
    'src/pages/joueurs/[id].vue': SEO_PAGE.PLAYER,
    'src/pages/joueurs/face-a-face.vue': SEO_PAGE.HEAD_TO_HEAD,
    'src/pages/regles.vue': SEO_PAGE.RULES,
    'src/pages/palmares.vue': SEO_PAGE.HALL_OF_FAME
  }

  it('chaque page publique appelle useSeo avec sa page, et une seule fois', () => {
    for (const [file, page] of Object.entries(publicPages)) {
      const calls = source(file).match(/useSeo\(/g) ?? []
      expect(calls, file).toHaveLength(1)
      expect(source(file), file).toContain(`SEO_PAGE.${Object.keys(SEO_PAGE).find(key => SEO_PAGE[key as keyof typeof SEO_PAGE] === page)}`)
    }
  })

  it('toute page qui n’est pas publique est privée : useSeo({ noindex: true }), et sa route est couverte par une règle X-Robots-Tag', () => {
    const privateFiles = files.filter(file => !(file in publicPages))
    expect(privateFiles.length).toBeGreaterThanOrEqual(8)
    for (const file of privateFiles) {
      expect(source(file), file).toContain('useSeo({ noindex: true })')
      const route = routeOf(file).replace(/\[[^\]]+\]/g, 'x')
      const covered = SEO_PRIVATE_ROUTE_PATTERNS.some(pattern => pattern.endsWith('/**') ? route.startsWith(pattern.slice(0, -3)) : route === pattern)
      expect(covered, `${file} -> ${route}`).toBe(true)
    }
  })
})

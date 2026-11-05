import { mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { injectHead } from '@unhead/vue'
import { renderSSRHead } from 'unhead/server'
import { defineComponent } from 'vue'
import { SEO_ROBOTS_NOINDEX } from '../../../src/consts/seo.const'
import { SEO_PAGE } from '../../../src/enums/seo.enum'
import type { ISeoOptions } from '../../../src/interfaces/seo.interface'
import { useSeo } from '../../../src/composables/useSeo'

/*********************************************************
 * useSeo (T-SEO-01)
 *
 * @description
 * Les balises posées dans le `<head>` par le composable : titre et description issus des clés `seo.*`, canonique et `og:url` bâties sur
 * `runtimeConfig.public.siteUrl` sans query, Open Graph et Twitter, `robots` des pages privées et des sites non indexables, image de
 * partage seulement si elle est configurée.
 ********************************************************/
let rendered: Document = new DOMParser().parseFromString('', 'text/html')

/** Le head tel qu'unhead le rend (`renderSSRHead`) : le DOM de test ne reçoit pas le head, la page ne le lit pas non plus. */
const meta = (selector: string): string | null => rendered.querySelector(selector)?.getAttribute('content') ?? null
const canonical = (): string | null => rendered.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? null
const documentTitle = (): string => rendered.querySelector('title')?.textContent ?? ''

const mountSeo = async (options: ISeoOptions) => {
  let head!: ReturnType<typeof injectHead>
  const wrapper = await mountSuspended(defineComponent({ setup () {
    head = injectHead()
    useSeo(options)
    return () => null
  } }))
  await flushPromises()
  const { headTags } = await renderSSRHead(head)
  wrapper.unmount()
  rendered = new DOMParser().parseFromString(`<html><head>${headTags}</head></html>`, 'text/html')
}

describe('useSeo : page publique', () => {
  beforeEach(() => {
    useRuntimeConfig().public.siteUrl = 'https://ccc.example.test/'
    useRuntimeConfig().public.siteOgImage = ''
    useRuntimeConfig().public.siteIndexable = true
  })

  it('pose le titre, la description, la canonique et Open Graph depuis les clés seo.* et siteUrl', async () => {
    await mountSeo({ page: SEO_PAGE.RULES, path: '/regles?onglet=jeu#variantes' })
    expect(documentTitle()).toBe('Règles du Championnat de Caps · CCC')
    expect(meta('meta[name="description"]')).toBe('Les règles du Championnat de Caps : le jeu, le tournoi et les variantes.')
    expect(canonical()).toBe('https://ccc.example.test/regles')
    expect(meta('meta[property="og:url"]')).toBe('https://ccc.example.test/regles')
    expect(meta('meta[property="og:title"]')).toBe(documentTitle())
    expect(meta('meta[property="og:description"]')).toBe(meta('meta[name="description"]'))
    expect(meta('meta[property="og:type"]')).toBe('website')
    expect(meta('meta[property="og:site_name"]')).toBe('CCC')
    expect(meta('meta[property="og:locale"]')).toBe('fr_FR')
    expect(meta('meta[name="twitter:card"]')).toBe('summary')
    expect(meta('meta[name="twitter:title"]')).toBe(documentTitle())
  })

  it('remplace les paramètres du titre et de la description', async () => {
    await mountSeo({ page: SEO_PAGE.EDITION, path: '/editions/2025', params: { code: '2025' } })
    expect(documentTitle()).toBe('Édition 2025 du Championnat de Caps · CCC')
    expect(meta('meta[name="description"]')).toContain('Édition 2025')
    await mountSeo({ page: SEO_PAGE.PLAYER, path: '/joueurs/abc', params: () => ({ name: 'Nicolas Deseine' }) })
    expect(documentTitle()).toBe('Nicolas Deseine · Fiche joueur · CCC')
  })

  it('la racine a pour canonique l’origine seule', async () => {
    await mountSeo({ page: SEO_PAGE.HOME, path: '/' })
    expect(canonical()).toBe('https://ccc.example.test')
  })

  it('sans image de partage, ni og:image ni carte large ; avec, l’image est absolue et la carte large', async () => {
    await mountSeo({ page: SEO_PAGE.HOME, path: '/' })
    expect(meta('meta[property="og:image"]')).toBeNull()
    useRuntimeConfig().public.siteOgImage = '/partage.png'
    await mountSeo({ page: SEO_PAGE.HOME, path: '/' })
    expect(meta('meta[property="og:image"]')).toBe('https://ccc.example.test/partage.png')
    expect(meta('meta[name="twitter:card"]')).toBe('summary_large_image')
    expect(meta('meta[name="twitter:image"]')).toBe('https://ccc.example.test/partage.png')
  })

  it('un site indexable ne pose pas de robots sur une page publique', async () => {
    await mountSeo({ page: SEO_PAGE.RULES, path: '/regles' })
    expect(meta('meta[name="robots"]')).toBeNull()
  })

  it('un site non indexable pose noindex, nofollow dans le HTML de toutes les pages', async () => {
    useRuntimeConfig().public.siteIndexable = false
    await mountSeo({ page: SEO_PAGE.RULES, path: '/regles' })
    expect(meta('meta[name="robots"]')).toBe(SEO_ROBOTS_NOINDEX)
  })
})

describe('useSeo : page privée', () => {
  it('noindex, nofollow quelle que soit la variable d’indexation, sans toucher au titre ni poser de canonique', async () => {
    useRuntimeConfig().public.siteIndexable = true
    await mountSeo({ noindex: true })
    expect(meta('meta[name="robots"]')).toBe(SEO_ROBOTS_NOINDEX)
  })
})

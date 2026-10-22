import { readFileSync } from 'node:fs'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import { RouterLink } from 'vue-router'
import PageHero from '~/components/common/PageHero.vue'
import PlayerLink from '~/components/common/PlayerLink.vue'

const withRouterLink = { global: { components: { RouterLink } } }
const title = { key: 'pages.editions.title', fallback: 'Éditions' }
const subtitle = { key: 'pages.rules.title', fallback: 'Règles' }

describe('PageHero : slots eyebrow et after-lead', () => {
  it('rend l’eyebrow avant le h1 et after-lead après le sous-titre', async () => {
    const wrapper = await mountSuspended(PageHero, {
      props: { title, subtitle },
      slots: { eyebrow: () => 'AVANT', 'after-lead': () => 'APRES' }
    })
    const html = wrapper.html()
    expect(html.indexOf('AVANT')).toBeGreaterThan(-1)
    expect(html.indexOf('AVANT')).toBeLessThan(html.indexOf('<h1'))
    expect(html.indexOf('APRES')).toBeGreaterThan(html.indexOf('data-cy="page-hero-lead"'))
  })

  it('reste identique sans slot fourni', async () => {
    const wrapper = await mountSuspended(PageHero, { props: { title, subtitle } })
    expect(wrapper.text()).toBe('ÉditionsRègles')
    expect(wrapper.findAll('h1')).toHaveLength(1)
  })
})

describe('PlayerLink : prop size', () => {
  it('est petit par défaut', async () => {
    const wrapper = await mountSuspended(PlayerLink, { ...withRouterLink, props: { competitor: { id: 'abc', displayName: 'Lou Bernard' } } })
    expect(wrapper.get('a').classes()).toContain('origam-btn--size-small')
  })

  it('prend la taille demandée', async () => {
    const wrapper = await mountSuspended(PlayerLink, { ...withRouterLink, props: { competitor: { id: 'abc', displayName: 'Lou Bernard' }, size: 'large' } })
    expect(wrapper.get('a').classes()).toContain('origam-btn--size-large')
  })
})

describe('.font-display', () => {
  it('pose aussi famille, graisse et interlettrage display de origam-title', () => {
    const css = readFileSync('src/assets/css/main.css', 'utf8')
    expect(css).toMatch(/\.font-display\s*\{[^}]*--origam-title---font-family:\s*var\(--origam-font__family---display\)/)
    expect(css).toMatch(/\.font-display\s*\{[^}]*--origam-title---font-weight:\s*var\(--origam-font__weight---regular\)/)
    expect(css).toMatch(/\.font-display\s*\{[^}]*--origam-title---letter-spacing:\s*-0\.01em/)
  })
})

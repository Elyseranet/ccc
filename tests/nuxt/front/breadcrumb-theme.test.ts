import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import { RouterLink } from 'vue-router'
import PageHero from '../../../src/components/common/PageHero.vue'
import { CCC_HH_BASE } from '../../../src/themes/ccc.theme'

const BREADCRUMB_VARS = [
  '--origam-breadcrumb---gap',
  '--origam-breadcrumb-item---color',
  '--origam-breadcrumb-item---text-decoration',
  '--origam-breadcrumb-item---opacity-disabled',
  '--origam-breadcrumb-divider---color'
]

describe('fil d’Ariane (F-00p) : thème', () => {
  it('les props viennent d’abord : densité compacte et séparateur ›', () => {
    expect(CCC_HH_BASE.components?.['origam-breadcrumb']).toMatchObject({ density: 'compact', divider: '›' })
  })

  it('les variables CSS pointent vers des tokens existants, jamais vers une valeur brute', () => {
    const cssVars = CCC_HH_BASE.cssVars as Record<string, string>
    for (const name of BREADCRUMB_VARS) {
      expect(cssVars[name], name).toBeDefined()
    }
    expect(cssVars['--origam-breadcrumb---gap']).toBe('var(--origam-space---2)')
    expect(cssVars['--origam-breadcrumb-item---color']).toBe('var(--origam-color__text---secondary)')
    expect(cssVars['--origam-breadcrumb-item---text-decoration']).toBe('underline')
    expect(cssVars['--origam-breadcrumb-divider---color']).toBe('var(--origam-color__text---tertiary)')
  })
})

describe('PageHero : fil d’Ariane au-dessus du corps du hero', () => {
  it('le fil d’Ariane précède le corps (titre, chapô) et n’y est pas contenu', async () => {
    const wrapper = await mountSuspended(PageHero, {
      global: { components: { RouterLink } },
      props: {
        title: { key: 'pages.editions.title', fallback: 'Éditions' },
        subtitle: { key: 'pages.rules.title', fallback: 'Règles' },
        breadcrumb: [
          { text: { key: 'layout.header.nav_editions', fallback: 'Éditions' }, to: '/editions' },
          { text: { key: 'pages.edition.title', fallback: 'Édition' } }
        ]
      }
    })
    const children = [...wrapper.get('header').element.children].map(child => child.className)
    expect(children[0]).toContain('page-hero__breadcrumb')
    expect(children[1]).toContain('page-hero__body')
    expect(wrapper.get('.page-hero__body').find('[data-cy="page-hero-breadcrumb"]').exists()).toBe(false)
    expect(wrapper.get('.page-hero__body').find('h1').exists()).toBe(true)
  })
})

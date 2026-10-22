import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import { RouterLink } from 'vue-router'
import { API_ERROR_CODE } from '../../../src/enums/api-error-code.enum'
import AsyncState from '~/components/common/AsyncState.vue'
import BrandMark from '~/components/common/BrandMark.vue'
import GoldenRules from '~/components/common/GoldenRules.vue'
import PageHero from '~/components/common/PageHero.vue'
import PlayerLink from '~/components/common/PlayerLink.vue'
import SkipLink from '~/components/common/SkipLink.vue'
import { ApiRequestError } from '../../../src/utils/api-request-error.util'

const withRouterLink = { global: { components: { RouterLink } } }

describe('SkipLink', () => {
  it('est un lien vers #contenu avec un libellé traduit', async () => {
    const wrapper = await mountSuspended(SkipLink)
    const link = wrapper.get('a')
    expect(link.attributes('href')).toBe('#contenu')
    expect(link.text()).toBe('Aller au contenu')
    expect(link.attributes('data-cy')).toBe('skip-link')
  })
})

describe('BrandMark', () => {
  it('est décoratif : masqué des lecteurs d’écran', async () => {
    const wrapper = await mountSuspended(BrandMark)
    const svg = wrapper.get('svg')
    expect(svg.attributes('aria-hidden')).toBe('true')
    expect(svg.find('polygon').attributes('points')).toContain('50,2')
  })
})

describe('PageHero', () => {
  it('rend un h1 unique, un sous-titre et un fil d’Ariane traduits', async () => {
    const wrapper = await mountSuspended(PageHero, {
      ...withRouterLink,
      props: {
        title: { key: 'pages.editions.title', fallback: 'Éditions' },
        subtitle: { key: 'pages.rules.title', fallback: 'Règles' },
        breadcrumb: [
          { text: { key: 'layout.header.nav_editions', fallback: 'Éditions' }, to: '/editions' },
          { text: { key: 'pages.edition.title', fallback: 'Édition' } }
        ]
      }
    })
    expect(wrapper.findAll('h1')).toHaveLength(1)
    expect(wrapper.get('h1').text()).toBe('Éditions')
    expect(wrapper.get('[data-cy="page-hero-lead"]').text()).toBe('Règles')
    expect(wrapper.get('[data-cy="page-hero-breadcrumb"]').text()).toContain('Édition')
  })

  it('n’affiche ni sous-titre ni fil d’Ariane quand on n’en fournit pas', async () => {
    const wrapper = await mountSuspended(PageHero, { props: { title: { key: 'pages.editions.title', fallback: 'Éditions' } } })
    expect(wrapper.find('[data-cy="page-hero-lead"]').exists()).toBe(false)
    expect(wrapper.find('[data-cy="page-hero-breadcrumb"]').exists()).toBe(false)
  })
})

describe('GoldenRules', () => {
  it('liste les huit règles d’or dans une liste ordonnée, sans défilement automatique', async () => {
    const wrapper = await mountSuspended(GoldenRules)
    expect(wrapper.findAll('ol > li')).toHaveLength(8)
    expect(wrapper.get('h2').classes()).toContain('sr-only')
    expect(wrapper.text()).toContain('Fair-play : le gagnant finit sa bière')
    expect(wrapper.html()).not.toMatch(/animation|marquee/i)
  })
})

describe('PlayerLink', () => {
  it('mène à la fiche du joueur et annonce les titres', async () => {
    const wrapper = await mountSuspended(PlayerLink, { ...withRouterLink, props: { competitor: { id: 'abc', displayName: 'Lou Bernard' }, titles: 4 } })
    expect(wrapper.get('a').attributes('href')).toBe('/joueurs/abc')
    expect(wrapper.text()).toContain('Lou Bernard')
    expect(wrapper.get('.player-link__stars').text()).toBe('****')
    expect(wrapper.get('.player-link__stars').attributes('aria-hidden')).toBe('true')
    expect(wrapper.text()).toContain('4 titres')
  })

  it('accorde « 1 titre » au singulier et n’affiche rien sans titre', async () => {
    const one = await mountSuspended(PlayerLink, { ...withRouterLink, props: { competitor: { id: 'abc', displayName: 'Sam Dupont' }, titles: 1 } })
    expect(one.text()).toContain('1 titre')
    expect(one.text()).not.toContain('1 titres')
    const none = await mountSuspended(PlayerLink, { ...withRouterLink, props: { competitor: { id: 'abc', displayName: 'Sam Dupont' } } })
    expect(none.find('.player-link__stars').exists()).toBe(false)
  })
})

describe('AsyncState', () => {
  it('affiche le contenu quand rien n’est en cours', async () => {
    const wrapper = await mountSuspended(AsyncState, { slots: { default: () => 'contenu' } })
    expect(wrapper.text()).toContain('contenu')
    expect(wrapper.find('[data-cy="async-state-loading"]').exists()).toBe(false)
  })

  it('affiche un squelette accessible pendant le chargement', async () => {
    const wrapper = await mountSuspended(AsyncState, { props: { pending: true }, slots: { default: () => 'contenu' } })
    expect(wrapper.find('[data-cy="async-state-loading"]').exists()).toBe(true)
    expect(wrapper.text()).not.toContain('contenu')
  })

  it('distingue hors ligne d’une erreur serveur et émet retry', async () => {
    const offline = new ApiRequestError({ statusCode: 0, code: API_ERROR_CODE.INTERNAL_ERROR, message: 'x' }, true)
    const server = new ApiRequestError({ statusCode: 500, code: API_ERROR_CODE.INTERNAL_ERROR, message: 'x' })
    const wrapperOffline = await mountSuspended(AsyncState, { props: { error: offline } })
    expect(wrapperOffline.text()).toContain('Vous semblez hors ligne')
    const wrapperServer = await mountSuspended(AsyncState, { props: { error: server } })
    expect(wrapperServer.text()).toContain('Le chargement a échoué')
    await wrapperServer.get('[data-cy="async-state-retry"]').trigger('click')
    expect(wrapperServer.emitted('retry')).toHaveLength(1)
  })

  it('affiche un message dédié pour un 429 (RATE_LIMITED), avec Réessayer, sans l’erreur générique', async () => {
    const limited = new ApiRequestError({ statusCode: 429, code: API_ERROR_CODE.RATE_LIMITED, message: 'x' })
    const wrapper = await mountSuspended(AsyncState, { props: { error: limited } })
    expect(wrapper.text()).toContain('Trop de requêtes, réessayez dans un instant')
    expect(wrapper.text()).not.toContain('Le chargement a échoué')
    await wrapper.get('[data-cy="async-state-retry"]').trigger('click')
    expect(wrapper.emitted('retry')).toHaveLength(1)
  })

  it('affiche l’état vide avec le titre fourni', async () => {
    const wrapper = await mountSuspended(AsyncState, { props: { empty: true, emptyTitle: { key: 'components.async_state.empty_title', fallback: 'Aucun résultat' } } })
    expect(wrapper.get('[data-cy="async-state-empty"]').text()).toContain('Aucun résultat')
  })
})

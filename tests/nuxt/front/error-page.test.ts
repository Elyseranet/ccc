import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { injectHead } from '@unhead/vue'
import { renderSSRHead } from 'unhead/server'
import { defineComponent } from 'vue'
import { RouterLink } from 'vue-router'
import { SEO_ROBOTS_NOINDEX } from '~/consts/seo.const'
import ErrorPage from '~/error.vue'

const withRouterLink = { global: { components: { RouterLink } } }
const TECHNICAL_MESSAGE = 'Cannot read properties of undefined (reading x)'

describe('page d’erreur (F-19)', () => {
  it('404 : eyebrow avec le vrai code, titre, un seul bouton « Retour à l’accueil »', async () => {
    const wrapper = await mountSuspended(ErrorPage, { ...withRouterLink, props: { error: { statusCode: 404, message: TECHNICAL_MESSAGE } } })
    expect(wrapper.get('[data-cy="error-page-code"]').text()).toBe('Erreur 404')
    expect(wrapper.get('h1').text()).toBe('Page introuvable')
    expect(wrapper.find('[data-cy="error-page-retry"]').exists()).toBe(false)
    expect(wrapper.get('[data-cy="error-page-back"]').text()).toContain('Retour à l’accueil')
  })

  it('erreur générique : « Réessayer » en action principale et « Retour à l’accueil » à côté', async () => {
    const wrapper = await mountSuspended(ErrorPage, { ...withRouterLink, props: { error: { statusCode: 500, message: TECHNICAL_MESSAGE } } })
    expect(wrapper.get('[data-cy="error-page-code"]').text()).toBe('Erreur 500')
    expect(wrapper.get('h1').text()).toBe('Une erreur est survenue')
    expect(wrapper.get('[data-cy="error-page-retry"]').element.tagName).toBe('BUTTON')
    expect(wrapper.get('[data-cy="error-page-retry"]').text()).toBe('Réessayer')
    expect(wrapper.find('[data-cy="error-page-back"]').exists()).toBe(true)
  })

  it('code inconnu : pas d’eyebrow, et le code n’est jamais dans le titre', async () => {
    const wrapper = await mountSuspended(ErrorPage, { ...withRouterLink, props: { error: { message: TECHNICAL_MESSAGE } } })
    expect(wrapper.find('[data-cy="error-page-code"]').exists()).toBe(false)
    expect(wrapper.get('h1').text()).not.toMatch(/\d/)
  })

  it('n’affiche jamais le message technique, et la capsule est décorative', async () => {
    for (const statusCode of [404, 500]) {
      const wrapper = await mountSuspended(ErrorPage, { ...withRouterLink, props: { error: { statusCode, message: TECHNICAL_MESSAGE } } })
      expect(wrapper.text()).not.toContain('Cannot read properties')
      expect(wrapper.get('.error-page svg').attributes('aria-hidden')).toBe('true')
    }
  })

  it('n’est jamais indexée, même sur un site indexable : robots noindex, nofollow, quel que soit le code', async () => {
    useRuntimeConfig().public.siteIndexable = true
    for (const statusCode of [404, 500]) {
      const page = await mountSuspended(ErrorPage, { ...withRouterLink, props: { error: { statusCode, message: TECHNICAL_MESSAGE } } })
      let head!: ReturnType<typeof injectHead>
      const probe = await mountSuspended(defineComponent({ setup () {
        head = injectHead()
        return () => null
      } }))
      await flushPromises()
      const { headTags } = await renderSSRHead(head)
      probe.unmount()
      page.unmount()
      expect(headTags).toContain(`name="robots" content="${SEO_ROBOTS_NOINDEX}"`)
    }
  })
})

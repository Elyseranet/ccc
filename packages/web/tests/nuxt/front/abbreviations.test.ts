import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import AppDataTable from '~/components/common/AppDataTable.vue'
import PageHero from '~/components/common/PageHero.vue'

describe('abréviations : ACP et codes de règle (T-A11Y-01, M6)', () => {
  it('le chapeau d’un PageHero explique ACP', async () => {
    const wrapper = await mountSuspended(PageHero, {
      props: { title: { key: 'pages.hall_of_fame.title', fallback: 'Palmarès' }, subtitle: { key: 'palmares.lead', fallback: '', params: { year: 2012 } } }
    })
    const abbr = wrapper.get('[data-cy="page-hero-lead"] abbr')
    expect(abbr.text()).toBe('ACP')
    expect(abbr.attributes('title')).toBe('Association de Cap’seurs Professionnels')
  })

  it('l’en-tête d’une colonne triable dont le titre contient ACP porte un abbr dans le bouton de tri', async () => {
    const wrapper = await mountSuspended(AppDataTable, {
      props: { headers: [{ key: 'points', title: 'Points ACP', sortable: true }], items: [{ points: 1 }], hideDefaultFooter: true }
    })
    const button = wrapper.get('th button')
    expect(button.text()).toBe('Points ACP')
    expect(button.get('abbr').attributes('title')).toBe('Association de Cap’seurs Professionnels')
  })
})

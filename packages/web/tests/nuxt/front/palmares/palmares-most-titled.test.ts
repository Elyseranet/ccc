import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import PalmaresMostTitled from '~/components/palmares/PalmaresMostTitled.vue'
import type { IPalmaresMostTitled } from '~/interfaces/palmares.interface'

/*********************************************************
 * « Le plus titré » : les trois états (F-02-TIE, decisions.md 68a4899)
 *
 * @description
 * Seul l'état à un détenteur est mesuré au pixel sur les données réelles ; les états à égalité et sans titre sont couverts par ces
 * tests de composant (ARCH-8 : ni `page.route`, ni variante de seed).
 ********************************************************/
const holder = (id: string, displayName: string, titles: number, participations: number, nickname: string | null = null): IPalmaresMostTitled => ({
  competitor: { id, displayName },
  nickname,
  titles,
  participations
})

const mount = async (mostTitled: IPalmaresMostTitled[]) => await mountSuspended(PalmaresMostTitled, { props: { mostTitled } })

describe('PalmaresMostTitled', () => {
  it('un détenteur : « Le plus titré », son nombre de titres et ses participations, sans liste', async () => {
    const wrapper = await mount([holder('a', 'Lou Bernard', 4, 10, 'La Mousse')])
    expect(wrapper.get('[data-cy="palmares-most-titled"]').attributes('aria-label')).toBe('Le plus titré')
    expect(wrapper.get('.palmares-most-titled__eyebrow').text()).toBe('Le plus titré')
    expect(wrapper.get('[data-cy="palmares-most-titled-name"]').text()).toBe('Lou Bernard')
    expect(wrapper.get('.palmares-most-titled__detail').text()).toBe('« La Mousse » · 4 titres · 10 participations')
    expect(wrapper.get('.palmares-most-titled .cap-badge__text').text()).toBe('4')
    expect(wrapper.find('ul').exists()).toBe(false)
  })

  it('plusieurs ex aequo : tous les noms dans une liste, dans l’ordre reçu, étiquette au pluriel', async () => {
    const wrapper = await mount([holder('a', 'Lou Bernard', 4, 10, 'La Mousse'), holder('b', 'Nina Perrin', 4, 5), holder('c', 'Inès Perrin', 4, 8)])
    expect(wrapper.get('.palmares-most-titled__eyebrow').text()).toBe('Les plus titrés · ex aequo, 4 titres chacun')
    const items = wrapper.findAll('ul.palmares-most-titled__ties > li')
    expect(items.map(item => item.get('[data-cy="palmares-most-titled-name"]').text())).toEqual(['Lou Bernard', 'Nina Perrin', 'Inès Perrin'])
    expect(items.map(item => item.get('.palmares-most-titled__detail').text())).toEqual(['« La Mousse » · 10 participations', '5 participations', '8 participations'])
    expect(wrapper.get('.palmares-most-titled .cap-badge__text').text()).toBe('4')
  })

  it('ex aequo à un titre : l’étiquette est au singulier', async () => {
    const wrapper = await mount([holder('a', 'Lou Bernard', 1, 1), holder('b', 'Nina Perrin', 1, 5)])
    expect(wrapper.get('.palmares-most-titled__eyebrow').text()).toBe('Les plus titrés · ex aequo, 1 titre chacun')
    expect(wrapper.findAll('.palmares-most-titled__detail')[0]?.text()).toBe('1 participation')
  })

  it('personne sans titre : le bloc est absent', async () => {
    const wrapper = await mount([])
    expect(wrapper.find('[data-cy="palmares-most-titled"]').exists()).toBe(false)
    expect(wrapper.find('.palmares-most-titled .cap-badge__text').exists()).toBe(false)
  })
})

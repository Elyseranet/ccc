import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import AppDataTable from '~/components/common/AppDataTable.vue'

const headers = [
  { key: 'name', title: 'Nom', sortable: true },
  { key: 'age', title: 'Âge', sortable: true },
  { key: 'city', title: 'Ville', sortable: false }
]
const items = [{ name: 'Lou', age: 31, city: 'Lyon' }, { name: 'Inès', age: 28, city: 'Nantes' }]

describe('AppDataTable : tri au clavier (T-A11Y-01, M2)', () => {
  it('chaque colonne triable porte un bouton natif dans son th, la colonne non triable aucun', async () => {
    const wrapper = await mountSuspended(AppDataTable, { props: { headers, items, hideDefaultFooter: true } })
    const cells = wrapper.findAll('th')
    expect(cells.map(cell => cell.find('button').exists())).toEqual([true, true, false])
    expect(cells[0]!.get('button').text()).toBe('Nom')
    expect(cells[0]!.get('button').attributes('type')).toBe('button')
  })

  it('un clic sur le bouton (ce qu’Entrée et Espace produisent) trie et met aria-sort à jour', async () => {
    const wrapper = await mountSuspended(AppDataTable, { props: { headers, items, hideDefaultFooter: true } })
    const first = wrapper.findAll('th')[0]!
    expect(first.attributes('aria-sort')).toBe('none')
    await first.get('button').trigger('click')
    expect(wrapper.findAll('th')[0]!.attributes('aria-sort')).toBe('ascending')
    await wrapper.findAll('th')[0]!.get('button').trigger('click')
    expect(wrapper.findAll('th')[0]!.attributes('aria-sort')).toBe('descending')
  })

  it('un slot header.<clé> fourni par l’écran garde la priorité', async () => {
    const wrapper = await mountSuspended(AppDataTable, {
      props: { headers, items, hideDefaultFooter: true },
      slots: { 'header.name': () => 'Nom perso' }
    })
    const first = wrapper.findAll('th')[0]!
    expect(first.find('button').exists()).toBe(false)
    expect(first.text()).toContain('Nom perso')
  })
})

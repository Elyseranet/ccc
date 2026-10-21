import { mountSuspended } from '@nuxt/test-utils/runtime'
import { h } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import { OrigamDataTable } from 'origam/components'
import AppDataTable from '~/components/common/AppDataTable.vue'
import { pickPassedListeners, pickPassedProps } from '~/utils/passed-props.util'

const HEADERS = [
  { key: 'name', title: 'Nom', sortable: true },
  { key: 'wins', title: 'Victoires' }
]
const ITEMS = [
  { name: 'Alix', wins: 3 },
  { name: 'Basile', wins: 5 }
]

describe('AppDataTable (F-00j, Origam #1246)', () => {
  it('se monte avec headers et items, sans prop `item`', async () => {
    const wrapper = await mountSuspended(AppDataTable, { props: { headers: HEADERS, items: ITEMS, hideDefaultFooter: true } })
    expect(wrapper.findAll('tbody tr')).toHaveLength(2)
    expect(wrapper.findAll('thead th').map(cell => cell.text())).toEqual(expect.arrayContaining(['Nom', 'Victoires']))
  })

  it('rend le même DOM racine (mêmes classes) que origam-data-table utilisé directement', async () => {
    const props = { headers: HEADERS, items: ITEMS, hideDefaultFooter: true }
    const wrapped = await mountSuspended(AppDataTable, { props })
    const direct = await mountSuspended(OrigamDataTable, { props: { ...props, item: {} } as never })
    const classesOf = (html: string | undefined) => (html ?? '').split(/\s+/).filter(name => name.startsWith('origam-') || name.startsWith('origam--')).sort()
    expect(classesOf(wrapped.element.getAttribute('class') ?? '')).toEqual(classesOf(direct.element.getAttribute('class') ?? ''))
  })

  it('retransmet un slot de cellule avec sa portée', async () => {
    const wrapper = await mountSuspended(AppDataTable, {
      props: { headers: HEADERS, items: ITEMS, hideDefaultFooter: true },
      slots: { 'item.name': (scope: { value: string }) => h('strong', { class: 'cell-name' }, `#${scope.value}`) }
    })
    expect(wrapper.findAll('.cell-name').map(cell => cell.text())).toEqual(['#Alix', '#Basile'])
  })

  it('retransmet l’événement de tri au parent', async () => {
    const onSort = vi.fn()
    const wrapper = await mountSuspended(AppDataTable, {
      props: { headers: HEADERS, items: ITEMS, hideDefaultFooter: true, 'onUpdate:sortBy': onSort }
    })
    await wrapper.get('thead th.origam-data-table-header-cell--sortable').trigger('click')
    expect(onSort).toHaveBeenCalledTimes(1)
    expect(onSort.mock.calls[0]![0]).toEqual([{ key: 'name', order: 'asc' }])
  })
})

describe('passed-props.util', () => {
  it('ne retient que les props réellement passées (kebab-case ou camelCase), pas les booléens à false par défaut', () => {
    const props = { headers: HEADERS, hover: false, hideDefaultFooter: true, density: undefined }
    expect(pickPassedProps({ headers: HEADERS, 'hide-default-footer': '' }, props)).toEqual({ headers: HEADERS, hideDefaultFooter: true })
    expect(pickPassedProps(null, props)).toEqual({})
  })

  it('retransmet les écouteurs tels quels', () => {
    const handler = () => undefined
    expect(pickPassedListeners({ headers: HEADERS, 'onUpdate:sortBy': handler })).toEqual({ 'onUpdate:sortBy': handler })
  })
})

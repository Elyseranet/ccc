import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import FilterChips from '~/components/common/FilterChips.vue'

const items = [
  { value: 'all', label: 'Tous', count: 12, dataCy: 'chip-all' },
  { value: 'pools', label: 'Poules', count: 8, dataCy: 'chip-pools' },
  { value: 'knockout', label: 'Phase finale', count: 4, dataCy: 'chip-knockout' }
]
const mountChips = (modelValue: string) => mountSuspended(FilterChips, { props: { items, modelValue, ariaLabel: 'Filtrer les matchs' } })

describe('FilterChips (F-20)', () => {
  it('une puce par item avec son libellé, son compteur et son data-cy ; le groupe porte l’aria-label', async () => {
    const wrapper = await mountChips('all')
    expect(wrapper.findAll('[data-cy^="chip-"]')).toHaveLength(3)
    expect(wrapper.get('[data-cy="chip-pools"]').text()).toContain('Poules')
    expect(wrapper.get('[data-cy="chip-pools"] .filter-chips__count').text()).toBe('8')
    expect(wrapper.find('[aria-label="Filtrer les matchs"]').exists()).toBe(true)
  })

  it('aria-pressed vrai sur la seule puce active, et le compteur actif prend la variante sélectionnée', async () => {
    const wrapper = await mountChips('pools')
    expect(wrapper.get('[data-cy="chip-pools"]').attributes('aria-pressed')).toBe('true')
    expect(wrapper.get('[data-cy="chip-all"]').attributes('aria-pressed')).toBe('false')
    expect(wrapper.get('[data-cy="chip-knockout"]').attributes('aria-pressed')).toBe('false')
    expect(wrapper.findAll('.filter-chips__count--selected')).toHaveLength(1)
    expect(wrapper.get('[data-cy="chip-pools"] .filter-chips__count').classes()).toContain('filter-chips__count--selected')
  })

  it('un clic sur une autre puce émet sa valeur ; re-cliquer la puce active n’émet pas de désélection (mandatory)', async () => {
    const wrapper = await mountChips('all')
    await wrapper.get('[data-cy="chip-knockout"]').trigger('click')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['knockout'])
    const before = wrapper.emitted('update:modelValue')?.length ?? 0
    await wrapper.get('[data-cy="chip-all"]').trigger('click')
    const events = wrapper.emitted('update:modelValue') ?? []
    expect(events.slice(before).every(event => event[0] !== undefined && event[0] !== null)).toBe(true)
  })
})

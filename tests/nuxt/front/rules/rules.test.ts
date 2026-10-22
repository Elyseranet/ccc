import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import GoldenRules from '~/components/common/GoldenRules.vue'
import RulesGame from '~/components/rules/RulesGame.vue'
import RulesTournament from '~/components/rules/RulesTournament.vue'
import RulesVariantFigure from '~/components/rules/RulesVariantFigure.vue'
import RulesVariants from '~/components/rules/RulesVariants.vue'
import { RULES_STEPS, RULES_TOURNAMENT_CARDS, RULES_VARIANTS } from '../../../../src/consts/rules.const'
import { GOLDEN_RULES_VARIANT } from '../../../../src/enums/golden-rules-variant.enum'
import { RULES_TAB } from '../../../../src/enums/rules-tab.enum'
import { resolveRulesTab } from '../../../../src/utils/rules-tab.util'

describe('resolveRulesTab', () => {
  it('ouvre l’onglet désigné par le hash', () => {
    expect(resolveRulesTab('#variantes')).toBe(RULES_TAB.VARIANTS)
    expect(resolveRulesTab('#tournoi')).toBe(RULES_TAB.TOURNAMENT)
    expect(resolveRulesTab('#jeu')).toBe(RULES_TAB.GAME)
  })

  it('retombe sur Le jeu sans hash ou avec un hash inconnu', () => {
    expect(resolveRulesTab('')).toBe(RULES_TAB.GAME)
    expect(resolveRulesTab(undefined)).toBe(RULES_TAB.GAME)
    expect(resolveRulesTab('#autre')).toBe(RULES_TAB.GAME)
  })
})

describe('contenu des règles', () => {
  it('compte 4 étapes, 6 cartes de tournoi et 3 variantes', () => {
    expect(RULES_STEPS).toHaveLength(4)
    expect(RULES_TOURNAMENT_CARDS).toHaveLength(6)
    expect(RULES_VARIANTS.map(variant => variant.beers.length)).toEqual([3, 10, 3])
  })
})

describe('RulesGame', () => {
  it('affiche le déroulé, la règle du bûcheron et les règles d’or', async () => {
    const wrapper = await mountSuspended(RulesGame)
    expect(wrapper.find('[data-cy="rules-steps"]').exists()).toBe(true)
    expect(wrapper.get('[data-cy="rules-note"]').text()).toContain('Le bûcheron ne compte pas')
    expect(wrapper.findAll('[data-cy="golden-rules"] li')).toHaveLength(8)
  })
})

describe('GoldenRules variante cards', () => {
  it('affiche le texte complet de RG26 et le code RG, le bandeau garde le libellé court', async () => {
    const cards = await mountSuspended(GoldenRules, { props: { variant: GOLDEN_RULES_VARIANT.CARDS } })
    expect(cards.findAll('ol > li')).toHaveLength(8)
    expect(cards.get('[data-cy="golden-rule-26"]').text()).toContain('un second shifumi départage le choix du côté')
    expect(cards.get('[data-cy="golden-rule-26"]').text()).toContain('RG26')
    const band = await mountSuspended(GoldenRules)
    expect(band.text()).not.toContain('second shifumi')
    expect(band.find('.golden-rules__list').exists()).toBe(true)
    expect(band.find('.golden-rules__cards').exists()).toBe(false)
  })
})

describe('RulesTournament', () => {
  it('rend une carte par règle de format', async () => {
    const wrapper = await mountSuspended(RulesTournament)
    expect(wrapper.findAll('li')).toHaveLength(6)
    expect(wrapper.get('[data-cy="rules-card-pools-score"]').text()).toContain('5')
  })
})

describe('RulesVariants', () => {
  it('porte l’ancre #variantes, focalisable, et trois schémas décrits', async () => {
    const wrapper = await mountSuspended(RulesVariants)
    const section = wrapper.get('#variantes')
    expect(section.attributes('tabindex')).toBe('-1')
    const figures = wrapper.findAll('svg[role="img"]')
    expect(figures).toHaveLength(3)
    for (const figure of figures) {
      expect(figure.attributes('aria-label')).toMatch(/^Vue /)
    }
  })

  it('dessine autant de bières que la variante en compte', async () => {
    const bowling = RULES_VARIANTS.find(variant => variant.id === 'bowling')!
    const wrapper = await mountSuspended(RulesVariantFigure, { props: { variant: bowling } })
    expect(wrapper.findAll('g.rules-variant-figure__beer')).toHaveLength(10)
  })
})

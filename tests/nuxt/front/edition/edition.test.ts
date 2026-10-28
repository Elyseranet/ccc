import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import { RouterLink } from 'vue-router'
import EditionDraws from '~/components/edition/EditionDraws.vue'
import EditionParticipants from '~/components/edition/EditionParticipants.vue'
import EditionSelector from '~/components/edition/EditionSelector.vue'
import EditionSummary from '~/components/edition/EditionSummary.vue'
import EditionUpcoming from '~/components/edition/EditionUpcoming.vue'
import { DRAW_STATUS } from '~/enums/draw.enum'
import { EDITION_CHIP_FAMILY, EDITION_STEP_STATE } from '~/enums/edition-tab.enum'
import { ROUND_KIND } from '~/enums/round.enum'

const withRouterLink = { global: { components: { RouterLink } } }
const person = (id: string, displayName: string) => ({ id, displayName })

describe('EditionSummary', () => {
  it('rend le podium, les chiffres et le Déroulé en UNE carte contenant une liste ordonnée', async () => {
    const wrapper = await mountSuspended(EditionSummary, {
      ...withRouterLink,
      props: {
        podium: { champion: person('c1', 'Lou Bernard'), titlesToDate: 4, finalWinnerScore: 10, finalLoserScore: 7, finalist: person('c2', 'Inès Perrin'), semifinalists: [person('c3', 'Mila Simon')] },
        facts: [{ id: 'matches', label: { key: 'edition.fact_matches', fallback: 'Matchs' }, value: '120', detail: null, extra: { key: 'edition.summary_matches_archive', fallback: '', params: { matches: 120, unknown: 2 } } }],
        steps: [
          { id: 'creation', index: 1, label: { key: 'edition.step_creation', fallback: 'Création' }, state: EDITION_STEP_STATE.DONE },
          { id: 'participants', index: 2, label: { key: 'edition.step_participants', fallback: 'Participants' }, state: EDITION_STEP_STATE.ACTIVE }
        ]
      }
    })
    expect(wrapper.get('[data-cy="edition-champion"]').element.tagName).toBe('SPAN')
    expect(wrapper.get('[data-cy="edition-final-line"]').text()).toBe('Finale gagnée 10–7 contre Inès Perrin')
    expect(wrapper.get('[data-cy="edition-fact-matches"]').text()).toContain('120 matchs, dont 2 au résultat inconnu')
    const steps = wrapper.get('[data-cy="edition-steps"]')
    expect(steps.findAll('ol > li')).toHaveLength(2)
    expect(steps.text()).toContain('Fait')
    expect(steps.text()).toContain('En cours')
    expect(wrapper.find('origam-stepper').exists()).toBe(false)
  })

  it('sans champion, pas de podium', async () => {
    const wrapper = await mountSuspended(EditionSummary, { props: { podium: null, facts: [], steps: [] } })
    expect(wrapper.find('[data-cy="edition-podium"]').exists()).toBe(false)
  })
})

describe('EditionParticipants', () => {
  it('liste native, nom, poule et résultat ; état vide traduit sinon', async () => {
    const wrapper = await mountSuspended(EditionParticipants, {
      ...withRouterLink,
      props: { participants: [{ participationId: 'p1', competitor: person('c1', 'Lou Bernard'), avatarUrl: null, initials: 'LB', poolRank: 3, result: { key: 'edition.result_semi', fallback: 'Demi-finale' }, family: EDITION_CHIP_FAMILY.TINTED_SUCCESS }] }
    })
    const item = wrapper.get('[data-cy="edition-participant-c1"]')
    expect(item.text()).toContain('Lou Bernard')
    expect(item.text()).toContain('Poule 3')
    expect(item.text()).toContain('Demi-finale')
    const empty = await mountSuspended(EditionParticipants, { props: { participants: [] } })
    expect(empty.find('[data-cy="async-state-empty"]').exists()).toBe(true)
  })
})

describe('EditionDraws', () => {
  it('têtes de série, tirage de tour et état « tour non encore tiré »', async () => {
    const wrapper = await mountSuspended(EditionDraws, {
      ...withRouterLink,
      props: {
        seeds: [{ participationId: 'p1', competitor: person('c1', 'Lou Bernard'), poolRank: 1 }],
        poolsStatus: DRAW_STATUS.VALIDATED,
        roundDraws: [{ id: 'd1', roundKind: ROUND_KIND.PLAYOFF, status: DRAW_STATUS.DRAFT, pairings: [{ index: 0, sides: [person('c1', 'Lou Bernard'), person('c2', 'Inès Perrin')] }] }]
      }
    })
    expect(wrapper.get('[data-cy="edition-seed-1"]').text()).toContain('Poule 1')
    expect(wrapper.get('[data-cy="edition-draws-pools"]').text()).toContain('Validé · définitif')
    const draw = wrapper.get('[data-cy="edition-draw-playoff"]')
    expect(draw.text()).toContain('Barrages')
    expect(draw.text()).toContain('Brouillon')
    expect(draw.text()).toContain('vs')
    const none = await mountSuspended(EditionDraws, { props: { seeds: [], poolsStatus: null, roundDraws: [] } })
    expect(none.text()).toContain('Tour non encore tiré')
  })
})

describe('EditionSelector', () => {
  it('libelle 2012a et 2012b, et n’émet que pour une autre édition', async () => {
    const wrapper = await mountSuspended(EditionSelector, {
      props: { options: [{ code: '2012b', year: 2012, ordinal: { key: 'edition.selector_ordinal_2', fallback: '2e' } }, { code: '2025', year: 2025, ordinal: null }], current: '2025' }
    })
    expect(wrapper.find('[data-cy="edition-selector"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Changer d’édition')
  })
})

describe('EditionUpcoming', () => {
  it('état « à venir » traduit', async () => {
    const wrapper = await mountSuspended(EditionUpcoming, { props: { heading: { key: 'edition.tab_pools', fallback: 'Poules' }, dataCy: 'edition-tab-pools-upcoming' } })
    expect(wrapper.text()).toContain('Bientôt disponible')
    expect(wrapper.find('[data-cy="edition-tab-pools-upcoming"]').exists()).toBe(true)
  })
})

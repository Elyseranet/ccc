import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import { RouterLink } from 'vue-router'
import EditionDraws from '~/components/edition/EditionDraws.vue'
import EditionMatches from '~/components/edition/EditionMatches.vue'
import EditionParticipants from '~/components/edition/EditionParticipants.vue'
import EditionSelector from '~/components/edition/EditionSelector.vue'
import EditionSummary from '~/components/edition/EditionSummary.vue'
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
        podium: { champion: person('c1', 'Lou Bernard'), titlesToDate: 4, finalWinnerScore: 10, finalLoserScore: 7, finalist: person('c2', 'Inès Perrin'), finalistTitles: 1, semifinalists: [{ person: person('c3', 'Mila Simon'), titles: 2 }] },
        facts: [{ id: 'matches', label: { key: 'edition.fact_matches', fallback: 'Matchs' }, value: '120', detail: null, extra: { key: 'edition.summary_matches_archive', fallback: '', params: { matches: 120, unknown: 2 } } }],
        steps: [
          { id: 'creation', index: 1, label: { key: 'edition.step_creation', fallback: 'Création' }, state: EDITION_STEP_STATE.DONE },
          { id: 'participants', index: 2, label: { key: 'edition.step_participants', fallback: 'Participants' }, state: EDITION_STEP_STATE.ACTIVE }
        ]
      }
    })
    expect(wrapper.get('[data-cy="edition-champion"]').element.tagName).toBe('SPAN')
    const places = wrapper.findAll('.edition-summary__place')
    expect(places.map(place => place.find('.player-link__stars').text())).toEqual(['*', '**'])
    expect(wrapper.find('.edition-summary__champ .player-link__stars').exists()).toBe(false)
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

describe('EditionMatches : match d’archive sans score (B-21, F-34)', () => {
  const row = (overrides: Record<string, unknown>) => ({
    id: 'm', sequence: 1, number: '2013-1', roundKind: ROUND_KIND.QUARTER, poolRank: null, isTiebreak: false,
    first: person('c1', 'Simon Vaur'), others: [person('c2', 'Kevin Mercurio')], firstScore: null, otherScores: [null], hasManyOthers: false, scoreText: null,
    hasWinner: true, winnerWithoutScore: false, status: 'VALIDATED', ...overrides
  })

  it('affiche « score non archivé » pour un vainqueur sans score, le score ailleurs, « – » sans vainqueur', async () => {
    const rows = [
      row({ id: 'a', sequence: 3, winnerWithoutScore: true }),
      row({ id: 'b', sequence: 2, firstScore: 10, otherScores: [6], scoreText: '10 – 6' }),
      row({ id: 'c', sequence: 1, hasWinner: false, status: 'SCHEDULED' })
    ]
    const wrapper = await mountSuspended(EditionMatches, { ...withRouterLink, props: { rows: rows as never, counts: { all: 3, pools: 0, knockout: 3 }, code: '2013' } })
    const scores = wrapper.findAll('.edition-matches__score').map(node => node.text())
    expect(scores).toEqual(['score non archivé', '10 – 6', '–'])
    expect(wrapper.find('.edition-matches__others').exists()).toBe(false)
  })

  it('un départage à 3 côtés liste les trois joueurs et joint les trois scores (F-21)', async () => {
    const rows = [row({ id: 'd', firstScore: 3, others: [person('c2', 'Emma Petit'), person('c3', 'Noé Garnier')], otherScores: [1, 0], hasManyOthers: true, scoreText: '3 – 1 – 0', isTiebreak: true })]
    const wrapper = await mountSuspended(EditionMatches, { ...withRouterLink, props: { rows: rows as never, counts: { all: 1, pools: 0, knockout: 1 }, code: '2013' } })
    expect(wrapper.get('.edition-matches__score').text()).toBe('3 – 1 – 0')
    const others = wrapper.get('.edition-matches__others')
    expect(others.element.tagName).toBe('UL')
    expect(wrapper.findAll('.edition-matches__others')).toHaveLength(1)
    expect(others.findAll('li').map(item => item.text())).toEqual(['Emma Petit', 'Noé Garnier'])
  })
})

describe('EditionDraws : tirages reconstitués (F-35)', () => {
  const reconstituted = {
    pools: [{ id: 'p1', rank: 1, players: [person('c1', 'Éloïse Adam'), person('c2', 'Lou Bernard')] }],
    rounds: [
      { kind: ROUND_KIND.PLAYOFF, pairings: [{ index: 0, sides: [person('c3', 'Camille Morel'), person('c4', 'Manon Henry')] }] },
      { kind: ROUND_KIND.QUARTER, pairings: [{ index: 0, sides: [person('c1', 'Éloïse Adam'), person('c3', 'Camille Morel')] }] }
    ]
  }

  it('montre l’alerte, la composition des poules en liste native et une carte « Reconstitué » par tour, sans « Tour non encore tiré »', async () => {
    const wrapper = await mountSuspended(EditionDraws, { ...withRouterLink, props: { seeds: [], poolsStatus: null, roundDraws: [], reconstituted } })
    expect(wrapper.get('[data-cy="edition-draws-reconstituted"]').text()).toContain('Tirages reconstitués à partir des résultats')
    const pool = wrapper.get('[data-cy="edition-rec-pool-1"]')
    expect(pool.text()).toContain('Poule 1')
    expect(pool.find('ul').exists()).toBe(true)
    expect(pool.find('[tabindex]').exists()).toBe(false)
    expect(pool.findAll('li').map(item => item.text())).toEqual(['Éloïse Adam', 'Lou Bernard'])
    expect(wrapper.get('[data-cy="edition-rec-draw-playoff"]').text()).toContain('Barrages')
    expect(wrapper.get('[data-cy="edition-rec-draw-playoff"]').text()).toContain('Reconstitué')
    expect(wrapper.get('[data-cy="edition-rec-draw-quarter"]').findAll('li')[0]!.text()).toContain('Éloïse Adam')
    expect(wrapper.text()).not.toContain('Tour non encore tiré')
    expect(wrapper.text()).not.toContain('Aucune tête de série')
  })

  it('sans poule, la carte de composition n’est pas rendue et les affiches restent', async () => {
    const wrapper = await mountSuspended(EditionDraws, { ...withRouterLink, props: { seeds: [], poolsStatus: null, roundDraws: [], reconstituted: { ...reconstituted, pools: [] } } })
    expect(wrapper.find('[data-cy="edition-draws-reconstituted"]').exists()).toBe(true)
    expect(wrapper.find('[data-cy="edition-draws-rec-pools"]').exists()).toBe(false)
    expect(wrapper.find('[data-cy="edition-rec-pool-1"]').exists()).toBe(false)
    expect(wrapper.find('.edition-draws__layout--single').exists()).toBe(true)
    expect(wrapper.find('[data-cy="edition-rec-draw-quarter"]').exists()).toBe(true)
  })

  it('sans `reconstituted` (édition en cours), l’affichage d’avant est conservé', async () => {
    const wrapper = await mountSuspended(EditionDraws, { ...withRouterLink, props: { seeds: [], poolsStatus: null, roundDraws: [] } })
    expect(wrapper.find('[data-cy="edition-draws-reconstituted"]').exists()).toBe(false)
    expect(wrapper.text()).toContain('Aucune tête de série')
    expect(wrapper.text()).toContain('Tour non encore tiré')
  })
})


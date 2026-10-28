import { describe, expect, it } from 'vitest'
import { EDITION_DEFAULT_TAB } from '../../src/consts/edition-view.const'
import { DRAW_KIND, DRAW_STATUS } from '../../src/enums/draw.enum'
import { EDITION_CHIP_FAMILY, EDITION_STEP_STATE, EDITION_TAB } from '../../src/enums/edition-tab.enum'
import { EDITION_STATUS } from '../../src/enums/edition.enum'
import { FINAL_STAGE, PARTICIPATION_STATUS } from '../../src/enums/participation.enum'
import { ROUND_KIND } from '../../src/enums/round.enum'
import type { IEditionDetail } from '../../src/interfaces/edition.interface'
import {
  buildEditionFacts,
  buildEditionHeroMeta,
  buildEditionParticipants,
  buildEditionPodium,
  buildEditionRoundDraws,
  buildEditionSeeds,
  buildEditionSteps,
  currentEditionCode,
  editionOption,
  formatTitlePoints,
  initialsOf,
  resolveEditionTab
} from '../../src/utils/edition-view.util'

const person = (id: string, displayName: string) => ({ id, displayName, firstName: null, lastName: null, nickname: null, avatarUrl: null })

const detail = (overrides: Partial<IEditionDetail> = {}): IEditionDetail => ({
  id: 'e1',
  code: '2025',
  year: 2025,
  name: null,
  heldOn: null,
  location: null,
  status: EDITION_STATUS.CLOSED,
  origin: 'LEGACY_IMPORT',
  participantCount: 45,
  unidentifiedParticipantCount: 0,
  matchCount: 120,
  scoredMatchCount: 118,
  unknownResultMatchCount: 2,
  champion: { competitor: person('c1', 'Lou Bernard'), titlesToDate: 4 },
  description: null,
  participants: [
    { participationId: 'p1', competitor: person('c1', 'Lou Bernard'), poolId: 'pool1', isSeed: true, seedRank: 1, status: PARTICIPATION_STATUS.WINNER, finalStage: FINAL_STAGE.CHAMPION, points: null, poolRank: 1 },
    { participationId: 'p2', competitor: person('c2', 'Inès Perrin'), poolId: 'pool2', isSeed: true, seedRank: 2, status: PARTICIPATION_STATUS.ELIMINATED, finalStage: FINAL_STAGE.FINALIST, points: null, poolRank: 1 },
    { participationId: 'p3', competitor: person('c3', 'Mila Simon'), poolId: 'pool1', isSeed: false, seedRank: null, status: PARTICIPATION_STATUS.ELIMINATED, finalStage: FINAL_STAGE.SEMI, points: null, poolRank: 2 },
    { participationId: 'p4', competitor: person('c4', 'Alice Vincent'), poolId: 'pool2', isSeed: false, seedRank: null, status: PARTICIPATION_STATUS.ELIMINATED, finalStage: FINAL_STAGE.POOL_ELIMINATED, points: null, poolRank: 5 }
  ],
  pools: [
    { id: 'pool2', rank: 2, standing: [] },
    { id: 'pool1', rank: 1, standing: [] }
  ],
  rounds: [
    { id: 'r1', kind: ROUND_KIND.POOLS, sequence: 1, status: 'COMPLETED', matchCount: 105, validatedMatchCount: 105 },
    { id: 'r2', kind: ROUND_KIND.FINAL, sequence: 2, status: 'COMPLETED', matchCount: 15, validatedMatchCount: 13 }
  ] as IEditionDetail['rounds'],
  matches: [
    {
      id: 'm1', sequence: 120, roundKind: ROUND_KIND.FINAL, poolRank: null, purpose: 'REGULAR', targetScore: 10, status: 'VALIDATED',
      sides: [
        { participationId: 'p2', competitorId: 'c2', displayName: 'Inès Perrin', score: 7 },
        { participationId: 'p1', competitorId: 'c1', displayName: 'Lou Bernard', score: 10 }
      ],
      winnerParticipationId: 'p1'
    }
  ] as IEditionDetail['matches'],
  draws: [
    { id: 'd1', kind: DRAW_KIND.POOLS, roundKind: null, status: DRAW_STATUS.VALIDATED, parameters: { poolCount: 2, seedCount: 2 }, createdAt: '', validatedAt: null, assignments: [] },
    {
      id: 'd2', kind: DRAW_KIND.ROUND, roundKind: ROUND_KIND.SEMI, status: DRAW_STATUS.VALIDATED, parameters: { poolCount: 0, seedCount: 0 }, createdAt: '', validatedAt: null,
      assignments: [
        { participationId: 'p3', competitorId: 'c3', displayName: 'Mila Simon', poolId: null, pairingIndex: 1, sidePosition: 2, drawnOrder: 3, assignedAt: '' },
        { participationId: 'p1', competitorId: 'c1', displayName: 'Lou Bernard', poolId: null, pairingIndex: 0, sidePosition: 1, drawnOrder: 1, assignedAt: '' },
        { participationId: 'p2', competitorId: 'c2', displayName: 'Inès Perrin', poolId: null, pairingIndex: 0, sidePosition: 2, drawnOrder: 2, assignedAt: '' },
        { participationId: 'p4', competitorId: 'c4', displayName: 'Alice Vincent', poolId: null, pairingIndex: 1, sidePosition: 1, drawnOrder: 4, assignedAt: '' }
      ]
    }
  ] as IEditionDetail['draws'],
  bracket: [],
  ...overrides
})

describe('resolveEditionTab', () => {
  it('lit ?onglet= et retombe sur la Synthèse', () => {
    expect(resolveEditionTab('tirages', EDITION_DEFAULT_TAB)).toBe(EDITION_TAB.DRAWS)
    expect(resolveEditionTab(['matchs', 'poules'], EDITION_DEFAULT_TAB)).toBe(EDITION_TAB.MATCHES)
    expect(resolveEditionTab('inconnu', EDITION_DEFAULT_TAB)).toBe(EDITION_TAB.SUMMARY)
    expect(resolveEditionTab(undefined, EDITION_DEFAULT_TAB)).toBe(EDITION_TAB.SUMMARY)
  })
})

describe('Déroulé', () => {
  it('compte 9 étapes, toutes faites pour une édition close', () => {
    const steps = buildEditionSteps(EDITION_STATUS.CLOSED)
    expect(steps).toHaveLength(9)
    expect(steps.every(step => step.state === EDITION_STEP_STATE.DONE)).toBe(true)
  })

  it('marque l’étape en cours puis les étapes à venir', () => {
    const steps = buildEditionSteps(EDITION_STATUS.POOLS_PLAYING)
    expect(steps.map(step => step.state)).toEqual([
      EDITION_STEP_STATE.DONE, EDITION_STEP_STATE.DONE, EDITION_STEP_STATE.DONE,
      EDITION_STEP_STATE.ACTIVE,
      ...Array(5).fill(EDITION_STEP_STATE.PENDING)
    ])
  })
})

describe('chiffres de l’édition (R-10)', () => {
  it('archive : « N matchs, dont M au résultat inconnu » seulement si M > 0', () => {
    const matches = buildEditionFacts(detail()).find(fact => fact.id === 'matches')
    expect(matches?.value).toBe('120')
    expect(matches?.extra?.key).toBe('edition.summary_matches_archive')
    expect(matches?.extra?.params).toEqual({ matches: 120, unknown: 2 })
    expect(matches?.detail?.params).toEqual({ pools: 105, knockout: 15 })
    const none = buildEditionFacts(detail({ unknownResultMatchCount: 0 })).find(fact => fact.id === 'matches')
    expect(none?.extra).toBeNull()
  })

  it('en cours : « N programmés, dont M validés », jamais un total seul', () => {
    const matches = buildEditionFacts(detail({ status: EDITION_STATUS.POOLS_PLAYING })).find(fact => fact.id === 'matches')
    expect(matches?.extra?.key).toBe('edition.summary_matches_in_progress')
    expect(matches?.extra?.params).toEqual({ programmed: 120, validated: 118 })
  })

  it('points du titre : 18 × N / 50 (RG2), absents si l’effectif est inconnu', () => {
    expect(formatTitlePoints(45)).toBe('16.20')
    expect(buildEditionFacts(detail()).find(fact => fact.id === 'title_points')?.value).toBe('16.20')
    expect(buildEditionFacts(detail({ participantCount: null })).some(fact => fact.id === 'title_points')).toBe(false)
  })

  it('ne compte pas les effectifs de poule vides', () => {
    expect(buildEditionFacts(detail()).find(fact => fact.id === 'pools')?.detail).toBeNull()
  })
})

describe('en-tête', () => {
  it('statut (famille de pastille) et résumé', () => {
    const closed = buildEditionHeroMeta(detail())
    expect(closed.family).toBe(EDITION_CHIP_FAMILY.TINTED_SUCCESS)
    expect(closed.summary.params).toEqual({ players: 45, pools: 2, matches: 120 })
    expect(buildEditionHeroMeta(detail({ status: EDITION_STATUS.PLAYOFFS })).family).toBe(EDITION_CHIP_FAMILY.FULL_SECONDARY)
  })
})

describe('podium', () => {
  it('champion, score de la finale (vainqueur en premier), finaliste et demi-finalistes', () => {
    const podium = buildEditionPodium(detail())
    expect(podium?.champion.displayName).toBe('Lou Bernard')
    expect(podium?.titlesToDate).toBe(4)
    expect([podium?.finalWinnerScore, podium?.finalLoserScore]).toEqual([10, 7])
    expect(podium?.finalist?.displayName).toBe('Inès Perrin')
    expect(podium?.semifinalists.map(person => person.displayName)).toEqual(['Mila Simon'])
  })

  it('aucun podium sans champion', () => {
    expect(buildEditionPodium(detail({ champion: null }))).toBeNull()
  })
})

describe('participants, têtes de série et tirages', () => {
  it('participants par ordre alphabétique, avec la poule et le tour atteint', () => {
    const rows = buildEditionParticipants(detail())
    expect(rows.map(row => row.competitor.displayName)).toEqual(['Alice Vincent', 'Inès Perrin', 'Lou Bernard', 'Mila Simon'])
    expect(rows[0]?.family).toBe(EDITION_CHIP_FAMILY.NEUTRAL)
    expect(rows[2]?.family).toBe(EDITION_CHIP_FAMILY.TINTED_SUCCESS)
    expect(rows[2]?.poolRank).toBe(1)
    expect(rows[0]?.initials).toBe('AV')
  })

  it('têtes de série dans l’ordre des poules (RG9)', () => {
    expect(buildEditionSeeds(detail()).map(seed => [seed.poolRank, seed.competitor.displayName])).toEqual([[1, 'Lou Bernard'], [2, 'Inès Perrin']])
  })

  it('tirages de tour : affiches regroupées par pairingIndex et par côté (RG13)', () => {
    const draws = buildEditionRoundDraws(detail())
    expect(draws).toHaveLength(1)
    expect(draws[0]?.roundKind).toBe(ROUND_KIND.SEMI)
    expect(draws[0]?.pairings.map(pairing => pairing.sides.map(side => side.displayName))).toEqual([['Lou Bernard', 'Inès Perrin'], ['Alice Vincent', 'Mila Simon']])
  })
})

describe('sélecteur et redirection', () => {
  it('2012a et 2012b ont un ordinal, une année simple n’en a pas', () => {
    expect(editionOption({ code: '2025', year: 2025 }).ordinal).toBeNull()
    expect(editionOption({ code: '2012a', year: 2012 }).ordinal?.key).toBe('edition.selector_ordinal_1')
    expect(editionOption({ code: '2012b', year: 2012 }).ordinal?.key).toBe('edition.selector_ordinal_2')
    expect(editionOption({ code: '2012c', year: 2012 }).ordinal?.params).toEqual({ n: 3 })
  })

  it('/editions mène à la première édition non close, sinon à la plus récente (A5)', () => {
    expect(currentEditionCode([])).toBeNull()
    expect(currentEditionCode([{ code: '2025', year: 2025, status: EDITION_STATUS.CLOSED }, { code: '2026', year: 2026, status: EDITION_STATUS.POOLS_PLAYING }])).toBe('2026')
    expect(currentEditionCode([{ code: '2024', year: 2024, status: EDITION_STATUS.CLOSED }, { code: '2025', year: 2025, status: EDITION_STATUS.CLOSED }])).toBe('2025')
  })

  it('initiales', () => {
    expect(initialsOf('Lou  Bernard Dupont')).toBe('LB')
  })
})

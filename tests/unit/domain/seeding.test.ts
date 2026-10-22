import { describe, expect, it } from 'vitest'
import type { ISeedCandidate } from '../../../src/server/interfaces/draw.interface'
import { countStagesReached, rankSeedCandidates } from '../../../src/server/utils/draw/seeding.util'
import { FINAL_STAGE } from '../../../src/enums/participation.enum'

const candidate = (playerId: string, overrides: Partial<ISeedCandidate> = {}): ISeedCandidate => ({
  playerId,
  acp: 10,
  titles: 0,
  finals: 0,
  semis: 0,
  quarters: 0,
  roundsOf16: 0,
  playoffs: 0,
  participations: 5,
  ...overrides,
})

const order = (candidates: ISeedCandidate[]) => rankSeedCandidates(candidates).ranked.map((c) => c.playerId)

describe('RG9, RG10 : têtes de série', () => {
  it('classe d abord par ACP', () => {
    expect(order([candidate('a', { acp: 5 }), candidate('b', { acp: 9 })])).toEqual(['b', 'a'])
  })

  it('égalité d ACP départagée par les titres', () => {
    expect(order([candidate('a'), candidate('b', { titles: 1 })])).toEqual(['b', 'a'])
  })

  it.each([
    ['finals'],
    ['semis'],
    ['quarters'],
    ['roundsOf16'],
    ['playoffs'],
  ] as const)('puis par %s décroissant', (field) => {
    expect(order([candidate('a'), candidate('b', { [field]: 2 })])).toEqual(['b', 'a'])
  })

  it('en dernier, le nombre de participations croissant', () => {
    expect(order([candidate('a', { participations: 9 }), candidate('b', { participations: 3 })])).toEqual(['b', 'a'])
  })

  it('un critère prioritaire l emporte sur tous les suivants', () => {
    expect(order([candidate('a', { titles: 1, participations: 99 }), candidate('b', { finals: 9 })])).toEqual(['a', 'b'])
  })

  it('une égalité totale est remontée, jamais tranchée', () => {
    const result = rankSeedCandidates([
      candidate('a'),
      candidate('b'),
      candidate('c', { acp: 20 }),
      candidate('d', { acp: 1 }),
      candidate('e', { acp: 1 }),
      candidate('f', { acp: 1 }),
    ])
    expect(result.ranked[0]!.playerId).toBe('c')
    expect(result.unresolvedTies).toEqual([['a', 'b'], ['d', 'e', 'f']])
  })

  it('aucune égalité : liste vide', () => {
    expect(rankSeedCandidates([candidate('a', { acp: 1 }), candidate('b', { acp: 2 })]).unresolvedTies).toEqual([])
    expect(rankSeedCandidates([]).unresolvedTies).toEqual([])
  })
})

describe('countStagesReached', () => {
  it('compte cumulativement les tours atteints', () => {
    const stages = [
      FINAL_STAGE.CHAMPION,
      FINAL_STAGE.FINALIST,
      FINAL_STAGE.SEMI,
      FINAL_STAGE.QUARTER,
      FINAL_STAGE.ROUND_OF_16,
      FINAL_STAGE.PLAYOFF,
      FINAL_STAGE.POOL_ELIMINATED,
    ].map((finalStage) => ({ playerId: 'a', editionId: finalStage, finalStage }))
    expect(countStagesReached(stages)).toEqual({
      titles: 1,
      finals: 2,
      semis: 3,
      quarters: 4,
      roundsOf16: 5,
      playoffs: 1,
      participations: 7,
    })
  })
})

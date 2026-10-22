import { describe, expect, it } from 'vitest'
import type {
  IRankingEdition,
  IScoredParticipation,
  IStagedParticipation,
} from '../../../src/interfaces/ranking.interface'
import {
  computeAcp,
  computeAllTime,
  computeAverage,
  countTitles,
  rankTotals,
} from '../../../src/utils/ranking.util'
import { EDITION_STATUS } from '../../../src/enums/edition.enum'
import { FINAL_STAGE } from '../../../src/enums/participation.enum'

const edition = (id: string, chronologicalRank: number, status = EDITION_STATUS.CLOSED): IRankingEdition => ({
  id,
  chronologicalRank,
  status,
})
const part = (playerId: string, editionId: string, points: number): IScoredParticipation => ({
  playerId,
  editionId,
  points,
})

describe('RG4 : All Time et ACP (jeu synthétique)', () => {
  // 7 éditions dont 2012a et 2012b (même année) ; fournies dans le désordre
  const editions = [
    edition('2014', 4),
    edition('2012a', 1),
    edition('2013', 3),
    edition('2012b', 2),
    edition('2015', 5),
    edition('2016', 6),
    edition('2017', 7),
  ]
  const participations = [
    ...editions.map((e) => part('ann', e.id, 1)),
    part('bob', '2012a', 100),
    part('bob', '2017', 0.5),
  ]

  it('All Time somme toutes les éditions', () => {
    expect(computeAllTime(participations)).toEqual([
      { playerId: 'bob', total: 100.5, rank: 1 },
      { playerId: 'ann', total: 7, rank: 2 },
    ])
  })

  it('ACP ne somme que les 5 dernières éditions : 2012a et 2012b comptent pour deux', () => {
    // 5 dernières = 2013, 2014, 2015, 2016, 2017 ; 2012a et 2012b sont hors fenêtre
    expect(computeAcp(participations, editions)).toEqual([
      { playerId: 'ann', total: 5, rank: 1 },
      { playerId: 'bob', total: 0.5, rank: 2 },
    ])
    // fenêtre de 6 : 2012b entre, 2012a reste dehors (la fenêtre porte sur des éditions)
    expect(computeAcp(participations, editions, 6)[0]).toEqual({ playerId: 'ann', total: 6, rank: 1 })
  })

  it('A8 : une édition POOLS_PLAYING n entre pas dans l ACP', () => {
    const withCurrent = [...editions, edition('2018', 8, EDITION_STATUS.POOLS_PLAYING)]
    const current = [...participations, part('ann', '2018', 50)]
    expect(computeAcp(current, withCurrent)).toEqual(computeAcp(participations, editions))
  })

  it('un joueur sans point dans la fenêtre sort avec 0 et partage le rang', () => {
    const result = computeAcp([part('ann', '2012a', 4), part('bob', '2012a', 4), part('cat', '2017', 1)], editions)
    expect(result).toEqual([
      { playerId: 'cat', total: 1, rank: 1 },
      { playerId: 'ann', total: 0, rank: 2 },
      { playerId: 'bob', total: 0, rank: 2 },
    ])
  })

  it('rankTotals ajoute un joueur absent de la liste fournie', () => {
    expect(rankTotals(['ann'], [part('bob', 'e', 2)], new Set(['e']))).toEqual([
      { playerId: 'bob', total: 2, rank: 1 },
      { playerId: 'ann', total: 0, rank: 2 },
    ])
  })

  it('refuse une fenêtre invalide', () => {
    for (const window of [0, -1, 2.5]) {
      expect(() => computeAcp(participations, editions, window)).toThrow()
    }
  })

  it('somme en centièmes : pas de dérive flottante', () => {
    const tenths = Array.from({ length: 10 }, (_, i) => part('ann', `e${i}`, 0.1))
    expect(computeAllTime(tenths)[0]!.total).toBe(1)
  })
})

describe('RG5 : moyenne par participation', () => {
  it('compte les participations à 0 point', () => {
    expect(computeAverage([part('ann', 'a', 6), part('ann', 'b', 0), part('bob', 'a', 3)])).toEqual([
      { playerId: 'ann', participations: 2, total: 6, average: 3 },
      { playerId: 'bob', participations: 1, total: 3, average: 3 },
    ])
  })
})

describe('RG6 : titres', () => {
  it('compte les CHAMPION', () => {
    const staged = (playerId: string, finalStage: FINAL_STAGE): IStagedParticipation => ({
      playerId,
      editionId: 'x',
      finalStage,
    })
    expect(
      countTitles([
        staged('ann', FINAL_STAGE.CHAMPION),
        staged('ann', FINAL_STAGE.CHAMPION),
        staged('ann', FINAL_STAGE.FINALIST),
        staged('bob', FINAL_STAGE.SEMI),
      ]),
    ).toEqual([
      { playerId: 'ann', titles: 2 },
      { playerId: 'bob', titles: 0 },
    ])
  })
})

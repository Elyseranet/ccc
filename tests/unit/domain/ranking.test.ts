import { describe, expect, it } from 'vitest'
import type {
  IRankingEdition,
  IScoredParticipation,
  IStagedParticipation,
} from '../../../src/server/interfaces/ranking.interface'
import {
  computeAcp,
  computeAllTime,
  computeAverage,
  countTitles,
  rankTotals,
} from '../../../src/server/utils/ranking/ranking.util'
import { EDITION_STATUS } from '../../../src/enums/edition.enum'
import { FINAL_STAGE } from '../../../src/enums/participation.enum'
import { dataSheet, sheetRows, workbookEditions, workbookParticipations } from './workbook.fixture'

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

describe('RG4 à RG6 sur le classeur (onglet Data, 145 joueurs)', () => {
  const { players, editionLabels } = dataSheet()
  const participations = workbookParticipations()
  const editions = workbookEditions()
  const allTime = new Map(computeAllTime(participations).map((s) => [s.playerId, s]))
  const acp = new Map(computeAcp(participations, editions).map((s) => [s.playerId, s]))

  it('Nicolas Deseine : ACP 50,8 et All Time 91,06 (ligne 12)', () => {
    expect(acp.get('Nicolas Deseine')!.total).toBe(50.8)
    expect(allTime.get('Nicolas Deseine')!.total).toBe(91.06)
    expect(acp.get('Nicolas Deseine')!.rank).toBe(1)
  })

  it('recalcule l ACP et l All Time de chacun des 145 joueurs', () => {
    expect(players).toHaveLength(145)
    for (const player of players) {
      expect(acp.get(player.name)!.total, `ACP ${player.name}`).toBeCloseTo(player.acp, 9)
      expect(allTime.get(player.name)!.total, `AT ${player.name}`).toBeCloseTo(player.allTime, 9)
    }
  })

  it('reproduit le rang All Time (colonne I) et le rang ACP (colonne A) du classeur', () => {
    // RANK du classeur compare des flottants : deux totaux égaux au centime peuvent y être
    // départagés par du bruit d arrondi. B-03 compte en centièmes entiers : les ex aequo
    // partagent le rang. On exige donc rang B-03 <= rang classeur < rang B-03 + taille du groupe.
    const rows = sheetRows('Data').filter((row) => typeof row.values[2] === 'string' && row.rowNumber >= 12)
    const groupSize = (scores: Map<string, { total: number }>, total: number) =>
      [...scores.values()].filter((s) => s.total === total).length
    let exact = 0
    for (const { values } of rows) {
      const name = values[2] as string
      for (const [label, scores, expected] of [
        ['ACP', acp, values[0]],
        ['AT', allTime, values[8]],
      ] as const) {
        const mine = scores.get(name)!
        expect(expected, `rang ${label} ${name}`).toBeGreaterThanOrEqual(mine.rank)
        expect(expected, `rang ${label} ${name}`).toBeLessThan(mine.rank + groupSize(scores, mine.total))
        exact += expected === mine.rank ? 1 : 0
      }
    }
    expect(exact).toBeGreaterThan(250)
  })

  it('reproduit la moyenne par participation (colonne H) et le nombre de participations (E)', () => {
    const averages = new Map(computeAverage(participations).map((a) => [a.playerId, a]))
    const rows = sheetRows('Data').filter((row) => typeof row.values[2] === 'string' && row.rowNumber >= 12)
    for (const { values } of rows) {
      const average = averages.get(values[2] as string)
      // un joueur sans aucune cellule chiffrée n a pas de participation : la moyenne du classeur est 0/0
      if (average) {
        expect(average.participations).toBe(values[4])
        expect(average.average, String(values[2])).toBeCloseTo(Number(values[7]), 6)
      }
    }
  })

  it('reproduit le nombre de titres (astérisques, colonne B)', () => {
    const champion = new Map(
      editionLabels.map((label, index) => [label, Number(sheetRows('Data')[2]!.values[10 + index])]),
    )
    const staged: IStagedParticipation[] = participations.map((p) => ({
      playerId: p.playerId,
      editionId: p.editionId,
      finalStage:
        Math.abs(p.points - champion.get(p.editionId)!) < 0.005 ? FINAL_STAGE.CHAMPION : FINAL_STAGE.SEMI,
    }))
    const titles = new Map(countTitles(staged).map((t) => [t.playerId, t.titles]))
    const rows = sheetRows('Data').filter((row) => typeof row.values[2] === 'string' && row.rowNumber >= 12)
    for (const { values } of rows) {
      const stars = typeof values[1] === 'string' ? values[1].length : 0
      expect(titles.get(values[2] as string) ?? 0, String(values[2])).toBe(stars)
    }
  })
})

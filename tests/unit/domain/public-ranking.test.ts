import { describe, expect, it } from 'vitest'
import { EDITION_STATUS } from '../../../src/enums/edition.enum'
import { FINAL_STAGE } from '../../../src/enums/participation.enum'
import { RANKING_TYPE } from '../../../src/enums/ranking.enum'
import type { ICompetitorPublic } from '../../../src/interfaces/competitor.interface'
import type { IRankingEditionInfo, IRankingSourceParticipation } from '../../../src/server/interfaces/ranking.interface'
import { buildEvolutionSeries, buildRankingRows } from '../../../src/server/utils/ranking/public-ranking.util'

const competitor = (id: string, displayName: string): ICompetitorPublic => ({
  id,
  displayName,
  firstName: null,
  lastName: null,
  nickname: null,
  avatarUrl: null,
})
const competitors = new Map([
  ['a', competitor('a', 'Alice')],
  ['b', competitor('b', 'Bob')],
  ['c', competitor('c', 'Chloé')],
])

// 7 éditions clôturées dont 2012a/2012b (même année), plus une édition en cours
const edition = (id: string, year: number, chronologicalRank: number, status = EDITION_STATUS.CLOSED): IRankingEditionInfo => ({
  id,
  code: id,
  year,
  chronologicalRank,
  status,
})
const editions = [
  edition('2013', 2013, 3),
  edition('2012a', 2012, 1),
  edition('2012b', 2012, 2),
  edition('2014', 2014, 4),
  edition('2015', 2015, 5),
  edition('2016', 2016, 6),
  edition('2017', 2017, 7),
  edition('2018', 2018, 8, EDITION_STATUS.POOLS_PLAYING),
]
const part = (
  playerId: string,
  editionId: string,
  points: number | null,
  finalStage: FINAL_STAGE | null = null,
): IRankingSourceParticipation => ({ playerId, editionId, points, finalStage })

const participations = [
  // a joue tout, 10 points par édition, champion en 2012a
  ...['2012a', '2012b', '2013', '2014', '2015', '2016', '2017'].map((id) =>
    part('a', id, 10, id === '2012a' ? FINAL_STAGE.CHAMPION : null),
  ),
  // b : 4 en 2012a, 20 en 2017
  part('b', '2012a', 4),
  part('b', '2017', 20),
  // c : mêmes points que b en 2012a et 2017, issue inconnue en 2015, édition en cours ignorée
  part('c', '2012a', 4),
  part('c', '2015', null),
  part('c', '2017', 20),
  part('c', '2018', 99, FINAL_STAGE.CHAMPION),
]

describe('buildRankingRows', () => {
  it('ACP : ne somme que les 5 dernières éditions clôturées (2013..2017), pas les années', () => {
    const rows = buildRankingRows(RANKING_TYPE.ACP, competitors, editions, participations)
    const byId = new Map(rows.map((row) => [row.competitor.id, row]))
    expect(byId.get('a')!.points).toBe(50)
    expect(byId.get('b')!.points).toBe(20)
    expect(rows[0]!.competitor.id).toBe('a')
  })

  it('All Time : somme tout, édition en cours et points null exclus', () => {
    const rows = buildRankingRows(RANKING_TYPE.ALL_TIME, competitors, editions, participations)
    const byId = new Map(rows.map((row) => [row.competitor.id, row]))
    expect(byId.get('a')).toMatchObject({ points: 70, participations: 7, average: 10, titles: 1 })
    expect(byId.get('c')).toMatchObject({ points: 24, participations: 2, average: 12, titles: 0 })
  })

  it('ex aequo : rang partagé (1, 2, 2) et ordre d\'affichage par displayName', () => {
    const rows = buildRankingRows(RANKING_TYPE.ALL_TIME, competitors, editions, participations)
    expect(rows.map((row) => [row.rank, row.competitor.displayName])).toEqual([
      [1, 'Alice'],
      [2, 'Bob'],
      [2, 'Chloé'],
    ])
  })

  it('une édition en cours ne compte pas, y compris pour les titres', () => {
    const rows = buildRankingRows(RANKING_TYPE.ALL_TIME, competitors, editions, participations)
    expect(rows.find((row) => row.competitor.id === 'c')!.titles).toBe(0)
  })

  it('ne porte que ICompetitorPublic', () => {
    const rows = buildRankingRows(RANKING_TYPE.ACP, competitors, editions, participations)
    expect(Object.keys(rows[0]!.competitor).sort()).toEqual(
      ['avatarUrl', 'displayName', 'firstName', 'id', 'lastName', 'nickname'],
    )
  })
})

describe('buildEvolutionSeries', () => {
  it('un point par édition clôturée dès la première participation, dans l\'ordre chronologique', () => {
    const [alice] = buildEvolutionSeries(RANKING_TYPE.ALL_TIME, competitors, editions, participations, 'a')
    expect(alice!.points.map((point) => point.editionCode)).toEqual(
      ['2012a', '2012b', '2013', '2014', '2015', '2016', '2017'],
    )
    expect(alice!.points.map((point) => point.points)).toEqual([10, 20, 30, 40, 50, 60, 70])
    expect(alice!.points[1]!.year).toBe(2012)
  })

  it('ACP : fenêtre glissante de 5 éditions', () => {
    const [alice] = buildEvolutionSeries(RANKING_TYPE.ACP, competitors, editions, participations, 'a')
    expect(alice!.points.map((point) => point.points)).toEqual([10, 20, 30, 40, 50, 50, 50])
  })

  it('l\'édition en cours n\'apparaît pas', () => {
    const series = buildEvolutionSeries(RANKING_TYPE.ACP, competitors, editions, participations)
    expect(series.flatMap((s) => s.points).some((point) => point.editionCode === '2018')).toBe(false)
  })

  it('sans filtre : tous les joueurs en un appel, triés par nom', () => {
    const series = buildEvolutionSeries(RANKING_TYPE.ALL_TIME, competitors, editions, participations)
    expect(series.map((s) => s.competitor.displayName)).toEqual(['Alice', 'Bob', 'Chloé'])
  })
})

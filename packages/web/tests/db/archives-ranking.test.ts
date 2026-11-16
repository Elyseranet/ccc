import 'reflect-metadata'
import type { DataSource } from 'typeorm'
import { afterAll, describe, expect, it } from 'vitest'
import type {
  IStagedParticipation
} from '../../src/interfaces/ranking.interface'
import {
  computeAcp,
  computeAllTime,
  computeAverage,
  countTitles
} from '../../src/utils/ranking.util'
import { FINAL_STAGE } from '../../src/enums/participation.enum'
import { seedArchives } from './helpers/archives'
import { cleanup, resetSchema } from './helpers/test-database'
import { dataSheet, loadArchivesWorkbook, sheetRows, workbookEditions, workbookParticipations } from './helpers/archives-workbook'

// Chargement au niveau du module (await de premier niveau) : les blocs `describe` lisent le classeur dès la
// collecte, avant tout `beforeAll`.
const dataSource: DataSource = await resetSchema()
await seedArchives(dataSource)
await loadArchivesWorkbook(dataSource)

afterAll(async () => {
  await cleanup()
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

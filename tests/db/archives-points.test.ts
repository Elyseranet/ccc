import 'reflect-metadata'
import type { DataSource } from 'typeorm'
import { afterAll, describe, expect, it } from 'vitest'
import {
  computeParticipationPoints
} from '../../src/utils/points.util'
import { DomainRuleError } from '../../src/utils/domain-rule-error.util'
import { FINAL_STAGE } from '../../src/enums/participation.enum'
import { seedArchives } from './helpers/archives'
import { cleanup, resetSchema } from './helpers/test-database'
import { dataSheet, loadArchivesWorkbook, sheetRows } from './helpers/archives-workbook'

const STAGE_BY_DATA_ROW: Record<number, FINAL_STAGE> = {
  3: FINAL_STAGE.CHAMPION,
  4: FINAL_STAGE.FINALIST,
  5: FINAL_STAGE.SEMI,
  6: FINAL_STAGE.QUARTER,
  7: FINAL_STAGE.ROUND_OF_16,
  8: FINAL_STAGE.PLAYOFF,
  9: FINAL_STAGE.POOL_ELIMINATED,
}

// Chargement au niveau du module (await de premier niveau) : les blocs `describe` lisent le classeur dès la
// collecte, avant tout `beforeAll`.
const dataSource: DataSource = await resetSchema()
await seedArchives(dataSource)
await loadArchivesWorkbook(dataSource)

afterAll(async () => {
  await cleanup()
})

describe('RG1 à RG3 sur le classeur (onglet Data)', () => {
  const rows = new Map(sheetRows('Data').map((row) => [row.rowNumber, row.values]))
  const { participantCounts, editionLabels, players } = dataSheet()

  it('reproduit chaque cellule du tableau de barème, et le garde-fou colle aux `/`', () => {
    let checked = 0
    editionLabels.forEach((label, index) => {
      const played = Object.entries(STAGE_BY_DATA_ROW)
        .filter(([rowNumber]) => typeof rows.get(Number(rowNumber))![10 + index] === 'number')
        .map(([, stage]) => stage)
      for (const [rowNumber, stage] of Object.entries(STAGE_BY_DATA_ROW)) {
        const cell = rows.get(Number(rowNumber))![10 + index]
        if (typeof cell === 'number') {
          expect(computeParticipationPoints(stage, participantCounts[index]!, played), `${label} ${stage}`).toBeCloseTo(cell, 9)
          checked += 1
        } else {
          expect(cell).toBe('/')
          expect(() => computeParticipationPoints(stage, participantCounts[index]!, played)).toThrow(
            DomainRuleError,
          )
        }
      }
    })
    expect(checked).toBeGreaterThan(90)
  })

  it('A7 : seules 2 cellules joueurs sortent du barème (2017, 5,76), valeur source conservée', () => {
    const offenders: string[] = []
    players.forEach((player) =>
      player.points.forEach((points, index) => {
        if (points === null) return
        const valid = Object.values(STAGE_BY_DATA_ROW).map((stage) =>
          computeParticipationPoints(stage, participantCounts[index]!),
        )
        if (!valid.some((value) => Math.abs(value - points) < 0.0051)) {
          offenders.push(`${player.name} ${editionLabels[index]} ${points}`)
        }
      }),
    )
    expect(offenders.sort()).toEqual(['Alan Denoyelle 2017 5.76', 'Simon Legoupil 2017 5.76'])
  })
})

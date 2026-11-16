import 'reflect-metadata'
import type { DataSource } from 'typeorm'
import { afterAll, describe, expect, it } from 'vitest'
import { computeEvolution } from '../../src/utils/evolution.util'
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

describe('RG8 sur le classeur (onglets évo ACP et évo All Time)', () => {
  const evolution = computeEvolution(workbookParticipations(), workbookEditions())
  const { players } = dataSheet()

  const check = (sheetName: string, key: 'acp' | 'allTime'): number => {
    let compared = 0
    for (const { values } of sheetRows(sheetName)) {
      const name = values[1]
      if (typeof name !== 'string' || !players.some((p) => p.name === name)) continue
      evolution.forEach((step, index) => {
        const expected = Number(values[2 + index]) || 0
        const entry = step.entries.find((e) => e.playerId === name)
        expect(entry?.[key] ?? 0, `${sheetName} ${name} #${index}`).toBeCloseTo(expected, 9)
        compared += 1
      })
    }
    return compared
  }

  it('reproduit l évolution ACP de chaque joueur après chaque édition', () => {
    expect(check('évo ACP', 'acp')).toBeGreaterThan(2000)
  })

  it('reproduit l évolution All Time de chaque joueur après chaque édition', () => {
    expect(check('évo All Time', 'allTime')).toBeGreaterThan(2000)
  })
})

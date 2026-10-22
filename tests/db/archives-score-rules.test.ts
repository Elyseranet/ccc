import 'reflect-metadata'
import type { DataSource } from 'typeorm'
import { afterAll, describe, expect, it } from 'vitest'
import { validateScore } from '../../src/utils/score-rules.util'
import { MATCH_PURPOSE } from '../../src/enums/match.enum'
import { ROUND_KIND } from '../../src/enums/round.enum'
import { seedArchives } from './helpers/archives'
import { cleanup, resetSchema } from './helpers/test-database'
import { loadArchivesWorkbook, sheetRows } from './helpers/archives-workbook'

// Chargement au niveau du module (await de premier niveau) : les blocs `describe` lisent le classeur dès la
// collecte, avant tout `beforeAll`.
const dataSource: DataSource = await resetSchema()
await seedArchives(dataSource)
await loadArchivesWorkbook(dataSource)

afterAll(async () => {
  await cleanup()
})

describe('RG21, RG22 sur le classeur', () => {
  it('constat du classeur : les 554 scores renseignés sont tous valides', () => {
    const KNOCKOUT_LABELS = new Set(['1/16', 'Huitième', 'Quart', 'Demi', 'Finale'])
    let checked = 0
    for (const { values } of sheetRows('scores')) {
      const [, label, , scoreA, , scoreB] = values
      if (typeof scoreA !== 'number' || typeof scoreB !== 'number') continue
      const kind = KNOCKOUT_LABELS.has(String(label)) ? ROUND_KIND.FINAL : ROUND_KIND.POOLS
      expect(validateScore(kind, MATCH_PURPOSE.REGULAR, [scoreA, scoreB]), `${values[0]}`).toEqual({ valid: true })
      checked += 1
    }
    expect(checked).toBe(554)
  })
})

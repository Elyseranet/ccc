import 'reflect-metadata'
import type { DataSource } from 'typeorm'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { LEGACY_VERIFICATION_METRIC } from '../../src/enums/legacy-import.enum'
import { verifyAgainstWorkbook } from '../../src/utils/legacy-verification.util'
import { computeWinLoss } from '../../src/utils/record.util'
import { loadVerificationInput, seedArchives } from './helpers/archives'
import { cleanup, resetSchema } from './helpers/test-database'

/*********************************************************
 * Non-régression du dump SQL des archives (ARCH-5, ARCH-10)
 *
 * @description
 * Base neuve, migrations, puis application de `src/assets/seeds/archives.sql` par le même code que
 * `db:seed:archives`. Les contrôles sur les vraies données sont ceux qui ont validé le dump avant sa génération.
 ********************************************************/
let dataSource: DataSource

const count = async (sql: string): Promise<number> => Number((await dataSource.query(sql))[0].n)

beforeAll(async () => {
  dataSource = await resetSchema()
})

afterAll(async () => {
  await cleanup()
})

describe('archives : dump SQL appliqué sur base neuve', () => {
  it('16 éditions, 146 compétiteurs, 729 matchs dont 554 avec score', async () => {
    expect(await seedArchives(dataSource)).toEqual({ editions: 16, competitors: 146, matches: 729, validatedMatches: 554 })
    expect(await count('SELECT count(*)::int AS n FROM matches WHERE status = \'RESULT_UNKNOWN\'')).toBe(175)
    expect(await count('SELECT count(*)::int AS n FROM match_sides')).toBe(1458)
    expect(await count('SELECT count(*)::int AS n FROM participations')).toBe(485)
    expect(await count('SELECT count(*)::int AS n FROM competitor_aliases')).toBe(158)
    expect(await count('SELECT count(*)::int AS n FROM legacy_workbook_rows')).toBe(2478)
    expect(await count('SELECT count(*)::int AS n FROM editions WHERE status = \'CLOSED\' AND origin = \'LEGACY_IMPORT\'')).toBe(16)
  })

  it('Nicolas Deseine est à 39/13 sur les matchs avec score', async () => {
    const input = await loadVerificationInput(dataSource)
    const deseineId = [...input.nameByPlayerId].find(([, name]) => name === 'Nicolas Deseine')![0]
    expect(computeWinLoss(input.matches).find((row) => row.playerId === deseineId)).toMatchObject({ wins: 39, losses: 13 })
  })

  it('classements recalculés = classeur pour les 145 joueurs : 0 écart bloquant', async () => {
    const verification = verifyAgainstWorkbook(await loadVerificationInput(dataSource))
    const metric = (kind: LEGACY_VERIFICATION_METRIC) => verification.metrics.find((entry) => entry.metric === kind)!

    for (const kind of [
      LEGACY_VERIFICATION_METRIC.ALL_TIME,
      LEGACY_VERIFICATION_METRIC.ACP,
      LEGACY_VERIFICATION_METRIC.ACP_RANK,
      LEGACY_VERIFICATION_METRIC.PARTICIPATIONS,
      LEGACY_VERIFICATION_METRIC.TITLES
    ]) {
      expect(metric(kind)).toMatchObject({ compared: 145, mismatches: [] })
    }
    // Seul écart de rang : égalité exacte à 8,76 que le RANK flottant du classeur départage.
    expect(metric(LEGACY_VERIFICATION_METRIC.ALL_TIME_RANK).mismatches.map((entry) => entry.player)).toEqual(['Damien Brien'])
    // V/D : écarts attendus pour les seuls compétiteurs fusionnés (A5), jamais d'écart inattendu.
    const winLoss = metric(LEGACY_VERIFICATION_METRIC.WIN_LOSS).mismatches
    expect(winLoss).toHaveLength(17)
    expect(winLoss.every((entry) => entry.expected)).toBe(true)
    expect(verification.blockingMismatches).toBe(0)
    expect(verification.playersOutsideWorkbook).toEqual(['Marion Cobra'])
  })

  it('refuse une seconde application, sans rien écrire', async () => {
    await expect(seedArchives(dataSource)).rejects.toThrow(/base migrée et vide/)
    expect(await count('SELECT count(*)::int AS n FROM matches')).toBe(729)
  })
})

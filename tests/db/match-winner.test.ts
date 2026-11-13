import 'reflect-metadata'
import type { DataSource } from 'typeorm'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { seedArchives } from './helpers/archives'
import { cleanup, resetSchema, revertMigrationsUntil } from './helpers/test-database'

/*********************************************************
 * `matches.winner_participation_id` (B-21, R-5 bis)
 *
 * @description
 * Les 175 matchs d'archives sans score ont un vainqueur importé (côté position 1 du classeur). Le dump livré les porte déjà ; la
 * migration `AddMatchWinner` fait la même chose sur une base déjà peuplée avec l'ancien dump (RESULT_UNKNOWN). Les trois temps :
 * `up` sur le dump, `down` (retour à RESULT_UNKNOWN sans perte), `up` de nouveau (mêmes vainqueurs).
 ********************************************************/
let dataSource: DataSource

const rows = (sql: string): Promise<Array<Record<string, unknown>>> => dataSource.query(sql)
const count = async (sql: string): Promise<number> => Number((await rows(sql))[0]!.n)
const WINNERS_SQL = 'SELECT id, winner_participation_id FROM matches WHERE winner_participation_id IS NOT NULL ORDER BY id'

beforeAll(async () => {
  dataSource = await resetSchema()
  await seedArchives(dataSource)
})

afterAll(cleanup)

describe('matches.winner_participation_id', () => {
  it('refuses a winner that is not one of the sides of the match, and a winner on a match that is not VALIDATED', async () => {
    const [{ id: matchId }] = await rows(`SELECT m.id FROM matches m WHERE m.winner_participation_id IS NULL AND m.status = 'VALIDATED' LIMIT 1`) as [{ id: string }]
    const [{ id: stranger }] = await rows(`SELECT p.id FROM participations p WHERE p.id NOT IN (SELECT participation_id FROM match_sides WHERE match_id = '${matchId}') LIMIT 1`) as [{ id: string }]
    await expect(dataSource.transaction(async (manager) => {
      await manager.query('UPDATE matches SET winner_participation_id = $1 WHERE id = $2', [stranger, matchId])
    })).rejects.toThrow(/fk_matches_winner_side/)

    const [{ id: scheduled }] = await rows(`SELECT m.id FROM matches m WHERE m.status = 'VALIDATED' LIMIT 1`) as [{ id: string }]
    const [{ participation_id: side }] = await rows(`SELECT participation_id FROM match_sides WHERE match_id = '${scheduled}' LIMIT 1`) as [{ participation_id: string }]
    await expect(dataSource.query(`UPDATE matches SET status = 'SCHEDULED', winner_participation_id = $1 WHERE id = $2`, [side, scheduled]))
      .rejects.toThrow(/ck_matches_winner_validated/)
  })

  it('up on the delivered dump: 175 winners, all VALIDATED, no score invented', async () => {
    expect(await count('SELECT count(*)::int AS n FROM matches WHERE winner_participation_id IS NOT NULL')).toBe(175)
    expect(await count(`SELECT count(*)::int AS n FROM matches WHERE status = 'RESULT_UNKNOWN'`)).toBe(0)
  })

  it('down returns the 175 matches to RESULT_UNKNOWN and drops the column, then up again gives the same winners', async () => {
    const before = await rows(WINNERS_SQL)
    expect(before).toHaveLength(175)
    const scoredBefore = await count('SELECT count(*)::int AS n FROM match_sides WHERE validated_score IS NOT NULL')

    await revertMigrationsUntil(dataSource, 'AddQualificationAndDrawRoundKind')
    expect(await count(`SELECT count(*)::int AS n FROM information_schema.columns WHERE table_name = 'matches' AND column_name = 'winner_participation_id'`)).toBe(0)
    expect(await count(`SELECT count(*)::int AS n FROM matches WHERE status = 'RESULT_UNKNOWN'`)).toBe(175)
    expect(await count(`SELECT count(*)::int AS n FROM matches WHERE status = 'VALIDATED'`)).toBe(554)
    expect(await count('SELECT count(*)::int AS n FROM match_sides WHERE validated_score IS NOT NULL')).toBe(scoredBefore)

    await dataSource.runMigrations()
    expect(await rows(WINNERS_SQL)).toEqual(before)
    expect(await count(`SELECT count(*)::int AS n FROM matches WHERE status = 'VALIDATED'`)).toBe(729)
    expect(await count('SELECT count(*)::int AS n FROM match_sides WHERE validated_score IS NOT NULL')).toBe(scoredBefore)
  })
})

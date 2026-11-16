import 'reflect-metadata'
import type { DataSource } from 'typeorm'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  E2E_IN_PROGRESS_EDITION_CODE,
  E2E_POOL_RECORDED_DENOMINATOR,
  E2E_POOL_RECORDED_NUMERATOR,
  E2E_POOL_REWIND_DENOMINATOR,
  E2E_POOL_REWIND_NUMERATOR
} from '../e2e/helpers/e2e.const'
import { readInProgressEditionState, rewindEditionToPoolsPhase } from '../e2e/helpers/in-progress-edition'
import type { IInProgressEditionState } from '../e2e/helpers/in-progress-edition'
import { EDITION_STATUS } from '../../src/enums/edition.enum'
import { ROUND_KIND, ROUND_STATUS } from '../../src/enums/round.enum'
import { EditionEntity } from '../../src/server/db/typeorm/entities/edition.entity'
import { loadAllEditionSummaries, loadArchiveStats, loadEditionMatches, loadRoundEntities } from '../../src/services/edition.service'
import { buildRounds } from '../../src/utils/edition-assemble.util'
import { seedArchives } from './helpers/archives'
import { cleanup, resetSchema } from './helpers/test-database'

/*********************************************************
 * Édition 2026 en phase de poules dans la base de test (QA-2, T-QA-03)
 *
 * @description
 * Base neuve, dump d'archives, puis `rewindEditionToPoolsPhase` : le même code que `prepare-database`. Le test vérifie que la
 * remise en phase de poules est déterministe (deux préparations successives, mêmes ids de matchs programmés), qu'elle ne crée
 * ni ne supprime aucune ligne (ARCH-8), et que ce que l'API calcule pour 2026 reste cohérent (statut, avancement des poules,
 * champion, compteurs d'archive A16).
 ********************************************************/
let dataSource: DataSource

const TABLES = ['editions', 'rounds', 'pools', 'matches', 'match_sides', 'participations', 'competitors', 'draws']
const rowCounts = async (): Promise<Record<string, number>> => Object.fromEntries(
  await Promise.all(TABLES.map(async table => [table, Number((await dataSource.query(`SELECT count(*) AS n FROM ${table}`))[0].n)]))
)

const prepare = async (): Promise<IInProgressEditionState> => {
  dataSource = await resetSchema()
  await seedArchives(dataSource)
  return rewindEditionToPoolsPhase(dataSource)
}

let first: IInProgressEditionState
let rowsAfterSeedOnly: Record<string, number>
let rowsAfterRewind: Record<string, number>
let archiveBefore: Awaited<ReturnType<typeof loadArchiveStats>>
let archiveAfter: Awaited<ReturnType<typeof loadArchiveStats>>

beforeAll(async () => {
  dataSource = await resetSchema()
  await seedArchives(dataSource)
  rowsAfterSeedOnly = await rowCounts()
  archiveBefore = await loadArchiveStats(dataSource)
  first = await rewindEditionToPoolsPhase(dataSource)
  rowsAfterRewind = await rowCounts()
  archiveAfter = await loadArchiveStats(dataSource)
})

afterAll(cleanup)

describe('2026 remise en phase de poules', () => {
  it('l’édition est en phase de poules : tour de poules en cours, tours suivants en attente', () => {
    expect(first.status).toBe(EDITION_STATUS.POOLS_PLAYING)
    expect(first.rounds[0]).toEqual({ kind: ROUND_KIND.POOLS, status: ROUND_STATUS.PLAYING })
    expect(first.rounds.slice(1).every(round => round.status === ROUND_STATUS.PENDING)).toBe(true)
  })

  it('lu en base : le tour de poules de 2026 est PLAYING, tous les autres tours sont PENDING (B-18 masque un tour PENDING et ses matchs)', async () => {
    const rounds: Array<{ kind: string, status: string }> = await dataSource.query(
      `SELECT r.kind, r.status FROM rounds r JOIN editions e ON e.id = r.edition_id WHERE e.code = $1`, [E2E_IN_PROGRESS_EDITION_CODE]
    )
    expect(rounds.filter(round => round.kind === ROUND_KIND.POOLS)).toEqual([{ kind: ROUND_KIND.POOLS, status: ROUND_STATUS.PLAYING }])
    const others = rounds.filter(round => round.kind !== ROUND_KIND.POOLS)
    expect(others.length).toBeGreaterThan(0)
    expect(others.every(round => round.status === ROUND_STATUS.PENDING)).toBe(true)
  })

  it('aucune ligne n’est créée ni supprimée', () => {
    expect(rowsAfterRewind).toEqual(rowsAfterSeedOnly)
  })

  it('la part de matchs de poule à jouer suit la règle fixe, par poule, avec arrondi à l’inférieur', async () => {
    const pools: Array<{ total: string }> = await dataSource.query(
      `SELECT count(*) AS total FROM matches m JOIN editions e ON e.id = m.edition_id JOIN rounds r ON r.id = m.round_id
       WHERE e.code = $1 AND r.kind = $2 GROUP BY m.pool_id`, [E2E_IN_PROGRESS_EDITION_CODE, ROUND_KIND.POOLS]
    )
    const totals = pools.map(pool => Number(pool.total))
    const expected = totals.reduce((sum, total) => sum + Math.floor(total * E2E_POOL_REWIND_NUMERATOR / E2E_POOL_REWIND_DENOMINATOR), 0)
    expect(first.matches.poolScheduled).toBe(expected)
    expect(first.matches.poolScheduled + first.matches.poolRecorded + first.matches.poolValidated).toBe(totals.reduce((sum, total) => sum + total, 0))
  })

  it('la part de matchs saisis suit la règle fixe, par poule, avec arrondi à l’inférieur, et tient entre les matchs à jouer et les validés', async () => {
    const pools: Array<{ total: string }> = await dataSource.query(
      `SELECT count(*) AS total FROM matches m JOIN editions e ON e.id = m.edition_id JOIN rounds r ON r.id = m.round_id
       WHERE e.code = $1 AND r.kind = $2 GROUP BY m.pool_id`, [E2E_IN_PROGRESS_EDITION_CODE, ROUND_KIND.POOLS]
    )
    const expected = pools.reduce((sum, pool) => sum + Math.floor(Number(pool.total) * E2E_POOL_RECORDED_NUMERATOR / E2E_POOL_RECORDED_DENOMINATOR), 0)
    expect(expected).toBeGreaterThan(0)
    expect(first.matches.poolRecorded).toBe(expected)
    const ordered: Array<{ pool: string, status: string }> = await dataSource.query(
      `SELECT m.pool_id AS pool, m.status FROM matches m JOIN editions e ON e.id = m.edition_id JOIN rounds r ON r.id = m.round_id
       WHERE e.code = $1 AND r.kind = $2 ORDER BY m.pool_id, m.sequence DESC`, [E2E_IN_PROGRESS_EDITION_CODE, ROUND_KIND.POOLS]
    )
    const rank = (status: string): number => ['SCHEDULED', 'RECORDED', 'VALIDATED'].indexOf(status)
    expect(ordered.every((match, index) => index === 0 || match.pool !== ordered[index - 1]!.pool || rank(match.status) >= rank(ordered[index - 1]!.status))).toBe(true)
  })

  it('un match saisi garde son score saisi, sans score validé ni validation ; un match validé a ses deux dates ; un match à jouer n’en a aucune', async () => {
    const recorded = await dataSource.query(
      `SELECT count(*) AS n FROM matches m JOIN editions e ON e.id = m.edition_id
       WHERE e.code = $1 AND m.status = 'RECORDED'
         AND (m.recorded_at IS NULL OR m.validated_at IS NOT NULL OR m.validated_by_user_id IS NOT NULL
              OR EXISTS (SELECT 1 FROM match_sides s WHERE s.match_id = m.id AND (s.validated_score IS NOT NULL OR s.recorded_score IS NULL)))`,
      [E2E_IN_PROGRESS_EDITION_CODE]
    )
    expect(Number(recorded[0].n)).toBe(0)
    const validated = await dataSource.query(
      `SELECT count(*) AS n FROM matches m JOIN editions e ON e.id = m.edition_id JOIN rounds r ON r.id = m.round_id
       WHERE e.code = $1 AND r.kind = 'POOLS' AND m.status = 'VALIDATED' AND (m.recorded_at IS NULL OR m.validated_at IS NULL OR m.recorded_at >= m.validated_at)`,
      [E2E_IN_PROGRESS_EDITION_CODE]
    )
    expect(Number(validated[0].n)).toBe(0)
  })

  it('un match à jouer n’a ni score enregistré, ni score validé, ni date de saisie ou de validation', async () => {
    const leaks = await dataSource.query(
      `SELECT count(*) AS n FROM matches m LEFT JOIN match_sides s ON s.match_id = m.id
       WHERE m.status = 'SCHEDULED' AND (s.recorded_score IS NOT NULL OR s.validated_score IS NOT NULL OR m.recorded_at IS NOT NULL OR m.validated_at IS NOT NULL)`
    )
    expect(Number(leaks[0].n)).toBe(0)
  })

  it('les participations de 2026 n’ont plus d’issue (étape finale, points, rang de poule)', async () => {
    const settled = await dataSource.query(
      `SELECT count(*) AS n FROM participations p JOIN editions e ON e.id = p.edition_id
       WHERE e.code = $1 AND (p.final_stage IS NOT NULL OR p.points IS NOT NULL OR p.pool_rank IS NOT NULL OR p.status <> 'IN_POOL')`,
      [E2E_IN_PROGRESS_EDITION_CODE]
    )
    expect(Number(settled[0].n)).toBe(0)
  })
})

describe('cohérence de ce que l’API publie pour 2026', () => {
  it('GET /editions : statut, avancement et champion', async () => {
    const summaries = await loadAllEditionSummaries(dataSource)
    const current = summaries.find(summary => summary.code === E2E_IN_PROGRESS_EDITION_CODE)!
    expect(current.status).toBe(EDITION_STATUS.POOLS_PLAYING)
    expect(current.champion).toBeNull()
    expect(current.scoredMatchCount).toBe(first.matches.validated)
    expect(summaries.filter(summary => summary.status !== EDITION_STATUS.CLOSED).map(summary => summary.code)).toEqual([E2E_IN_PROGRESS_EDITION_CODE])
  })

  it('GET /editions/{id} : avancement des poules cohérent avec la part de matchs à jouer', async () => {
    const edition = await dataSource.getRepository(EditionEntity).findOneByOrFail({ code: E2E_IN_PROGRESS_EDITION_CODE })
    const rounds = buildRounds(await loadRoundEntities(dataSource, edition.id), await loadEditionMatches(dataSource, edition.id))
    const pools = rounds.find(round => round.kind === ROUND_KIND.POOLS)!
    expect(pools.validatedMatchCount).toBe(first.matches.poolValidated)
    expect(pools.matchCount).toBe(first.matches.poolValidated + first.matches.poolRecorded + first.matches.poolScheduled)
    expect(rounds.filter(round => round.kind !== ROUND_KIND.POOLS).every(round => round.validatedMatchCount === 0)).toBe(true)
  })

  it('GET /stats (A16) : les matchs à jouer sortent des compteurs, les résultats inconnus ne bougent pas', () => {
    const rewoundValidated = archiveBefore.scoredMatches - archiveAfter.scoredMatches
    expect(rewoundValidated).toBeGreaterThan(0)
    expect(archiveAfter.matches).toBe(archiveBefore.matches - rewoundValidated)
    expect(archiveAfter.unknownResultMatches).toBe(archiveBefore.unknownResultMatches)
  })
})

describe('reproductibilité', () => {
  it('deux préparations successives donnent exactement le même état, mêmes ids de matchs programmés compris', async () => {
    const second = await prepare()
    expect(second).toEqual(first)
    expect(second.scheduledMatchIds.length).toBeGreaterThan(0)
    expect(await readInProgressEditionState(dataSource)).toEqual(first)
  })
})

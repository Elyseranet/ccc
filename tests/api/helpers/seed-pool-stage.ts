import type { DataSource } from 'typeorm'
import { EDITION_ORIGIN, EDITION_STATUS } from '../../../src/enums/edition.enum'
import { MATCH_PURPOSE, MATCH_STATUS } from '../../../src/enums/match.enum'
import { PARTICIPATION_STATUS } from '../../../src/enums/participation.enum'
import { ROUND_KIND, ROUND_STATUS } from '../../../src/enums/round.enum'
import { CompetitorEntity } from '../../../src/server/db/typeorm/entities/competitor.entity'
import { EditionEntity } from '../../../src/server/db/typeorm/entities/edition.entity'
import { MatchSideEntity } from '../../../src/server/db/typeorm/entities/match-side.entity'
import { MatchEntity } from '../../../src/server/db/typeorm/entities/match.entity'
import { ParticipationEntity } from '../../../src/server/db/typeorm/entities/participation.entity'
import { PoolEntity } from '../../../src/server/db/typeorm/entities/pool.entity'
import { RoundEntity } from '../../../src/server/db/typeorm/entities/round.entity'

/** [vainqueur, perdant, score du perdant] : le vainqueur marque 5 (RG22). Indices dans la liste des membres de la poule. */
export type TPoolResult = [number, number, number]

export interface IPoolStageSpec {
  code: string
  rank: number
  /** Une entrée par poule : les noms des joueurs et les résultats (tous validés). */
  pools: Array<{ names: string[], results: TPoolResult[] }>
  /** Nombre de matchs de poule laissés SCHEDULED (les derniers de la liste). */
  pendingMatches?: number
  status?: EDITION_STATUS
}

export interface IPoolStageFixture {
  edition: EditionEntity
  pools: PoolEntity[]
  /** participationId par nom de joueur. */
  participationByName: Map<string, ParticipationEntity>
  round: RoundEntity
  matches: MatchEntity[]
}

/**
 * Une édition au stade des poules (POOLS_DRAWN) : poules, inscrits en IN_POOL, tour de poules DRAWN et round-robin dont
 * les résultats sont posés tels quels. Tout est semé directement en base (pas de dépendance au tirage de B-11).
 */
export const seedPoolStage = async (dataSource: DataSource, spec: IPoolStageSpec): Promise<IPoolStageFixture> => {
  const edition = await dataSource.getRepository(EditionEntity).save({
    code: spec.code, year: 2100 + spec.rank, chronologicalRank: spec.rank,
    status: spec.status ?? EDITION_STATUS.POOLS_DRAWN, origin: EDITION_ORIGIN.APP
  })
  const round = await dataSource.getRepository(RoundEntity).save({
    editionId: edition.id, kind: ROUND_KIND.POOLS, sequence: 1, status: ROUND_STATUS.DRAWN
  })
  const participationByName = new Map<string, ParticipationEntity>()
  const pools: PoolEntity[] = []
  const matches: MatchEntity[] = []
  let sequence = 0
  const pending = spec.pendingMatches ?? 0
  const total = spec.pools.reduce((count, pool) => count + pool.results.length, 0)

  for (const [poolIndex, poolSpec] of spec.pools.entries()) {
    const pool = await dataSource.getRepository(PoolEntity).save({ editionId: edition.id, rank: poolIndex + 1 })
    pools.push(pool)
    const competitors = await dataSource.getRepository(CompetitorEntity).save(
      poolSpec.names.map((name) => ({ displayName: `${name}-${spec.code}` }))
    )
    const members = await dataSource.getRepository(ParticipationEntity).save(competitors.map((competitor) => ({
      editionId: edition.id, competitorId: competitor.id, poolId: pool.id, status: PARTICIPATION_STATUS.IN_POOL
    })))
    members.forEach((member, index) => participationByName.set(poolSpec.names[index]!, member))

    for (const [winner, loser, loserScore] of poolSpec.results) {
      sequence += 1
      const open = sequence > total - pending
      const match = await dataSource.getRepository(MatchEntity).save({
        editionId: edition.id, roundId: round.id, poolId: pool.id, sequence, targetScore: 5,
        purpose: MATCH_PURPOSE.REGULAR,
        status: open ? MATCH_STATUS.SCHEDULED : MATCH_STATUS.VALIDATED,
        validatedAt: open ? null : new Date()
      })
      await dataSource.getRepository(MatchSideEntity).save([
        { matchId: match.id, position: 1, participationId: members[winner]!.id, validatedScore: open ? null : 5, recordedScore: open ? null : 5 },
        { matchId: match.id, position: 2, participationId: members[loser]!.id, validatedScore: open ? null : loserScore, recordedScore: open ? null : loserScore }
      ])
      matches.push(match)
    }
  }
  return { edition, pools, participationByName, round, matches }
}

/** Poule x1 > x2 > x3 : x1 bat tout le monde, x2 bat x3 ; les écarts règlent le cap's average. */
export const clearPool = (prefix: string, loserScore = 3, lastScore = loserScore): { names: string[], results: TPoolResult[] } => ({
  names: [`${prefix}1`, `${prefix}2`, `${prefix}3`],
  results: [[0, 1, loserScore], [0, 2, loserScore], [1, 2, lastScore]]
})

/** Poule où chacun gagne une fois (c1 > c2 > c3 > c1) avec les mêmes scores : égalité parfaite à trois. */
export const cyclePool = (prefix: string): { names: string[], results: TPoolResult[] } => ({
  names: [`${prefix}1`, `${prefix}2`, `${prefix}3`],
  results: [[0, 1, 3], [1, 2, 3], [2, 0, 3]]
})

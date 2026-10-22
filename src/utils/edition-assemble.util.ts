import type { MatchEntity } from '../server/db/typeorm/entities/match.entity.js'
import type { ParticipationEntity } from '../server/db/typeorm/entities/participation.entity.js'
import type { PoolEntity } from '../server/db/typeorm/entities/pool.entity.js'
import type { RoundEntity } from '../server/db/typeorm/entities/round.entity.js'
import { MATCH_STATUS } from '../enums/match.enum.js'
import { ROUND_KIND } from '../enums/round.enum.js'
import type { IEditionParticipant } from '../interfaces/edition.interface.js'
import type { IMatch } from '../interfaces/match.interface.js'
import type { IPool, IPoolStandingRow } from '../interfaces/pool.interface.js'
import type { IBracketRound, IRound } from '../interfaces/round.interface.js'
import { MATCH_RECORD_KEY } from '../enums/match-record-key.enum.js'
import { toCompetitorPublic } from './competitor-public.mapper.util.js'
import { toMatchRecord } from './match-record.mapper.util.js'
import { toPublicMatch } from './match-public.mapper.util.js'
import { computePoolStanding } from './standing.util.js'
import { countUnknownResults } from './record.util.js'

export const toEditionParticipant = (participation: ParticipationEntity): IEditionParticipant => ({
  participationId: participation.id,
  competitor: toCompetitorPublic(participation.competitor),
  poolId: participation.poolId,
  isSeed: participation.isSeed,
  seedRank: participation.seedRank,
  status: participation.status,
  finalStage: participation.finalStage,
  points: participation.points,
  poolRank: participation.poolRank
})

/**
 * RG19, A10 : classement par `computePoolStanding` (B-03), identifiant = participation. Seuls les
 * matchs VALIDATED comptent (E-f) : `toMatchRecord` ne lit que `validatedScore`, et un match
 * RECORDED n'est pas compté. R-5 : les résultats inconnus sont comptés à part.
 */
export const buildPools = (
  pools: PoolEntity[],
  participations: ParticipationEntity[],
  matches: MatchEntity[]
): IPool[] =>
  [...pools].sort((a, b) => a.rank - b.rank).map((pool) => {
    const members = participations
      .filter((participation) => participation.poolId === pool.id)
      .sort((a, b) => a.competitor.displayName.localeCompare(b.competitor.displayName) || a.id.localeCompare(b.id))
    const records = matches
      .filter((match) => match.poolId === pool.id)
      .map((match) => toMatchRecord(match, MATCH_RECORD_KEY.PARTICIPATION))
    const standing = computePoolStanding(members.map((member) => member.id), records)
    const unknownResults = countUnknownResults(records)
    const byId = new Map(members.map((member) => [member.id, member]))

    const rows: IPoolStandingRow[] = standing.entries.map((entry) => {
      const member = byId.get(entry.playerId)!
      return {
        rank: entry.rank,
        participationId: member.id,
        competitor: toCompetitorPublic(member.competitor),
        isSeed: member.isSeed,
        participationStatus: member.status,
        played: entry.played,
        wins: entry.wins,
        losses: entry.losses,
        pointsFor: entry.pointsFor,
        pointsAgainst: entry.pointsAgainst,
        capsAverage: entry.capsAverage,
        unknownResults: unknownResults.get(member.id) ?? 0
      }
    })
    return { id: pool.id, rank: pool.rank, standing: rows }
  })

/** RG13 : un tour avec ses compteurs (C3 : « 68 / 105 matchs de poule validés »). */
export const buildRounds = (rounds: RoundEntity[], matches: MatchEntity[]): IRound[] =>
  [...rounds].sort((a, b) => a.sequence - b.sequence).map((round) => {
    const roundMatches = matches.filter((match) => match.roundId === round.id)
    return {
      id: round.id,
      kind: round.kind,
      sequence: round.sequence,
      status: round.status,
      matchCount: roundMatches.length,
      validatedMatchCount: roundMatches.filter((match) => match.status === MATCH_STATUS.VALIDATED).length
    }
  })

/** Tableau final : les tours hors poules, dans l'ordre des tours, avec leurs matchs publics. */
export const buildBracket = (rounds: RoundEntity[], publicMatches: IMatch[]): IBracketRound[] =>
  [...rounds]
    .filter((round) => round.kind !== ROUND_KIND.POOLS)
    .sort((a, b) => a.sequence - b.sequence)
    .map((round) => ({ kind: round.kind, matches: publicMatches.filter((match) => match.roundKind === round.kind) }))

export const toPublicMatches = (matches: MatchEntity[]): IMatch[] =>
  [...matches].sort((a, b) => a.sequence - b.sequence).map(toPublicMatch)

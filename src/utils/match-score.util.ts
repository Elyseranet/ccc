import type { MatchEntity } from '../server/db/typeorm/entities/match.entity.js'
import type { IScoreSideInput } from '../interfaces/score.interface.js'
import type { IAdminMatchListQuery } from '../interfaces/match-score.interface.js'
import { adminMatchListQuerySchema } from '../server/schemas/match-score.schema.js'
import { validationFailed } from './api-error.util.js'
import { parseWithSchema } from './validation.util.js'

export const sidesInOrder = (match: MatchEntity): MatchEntity['sides'] =>
  [...match.sides].sort((a, b) => a.position - b.position)

/**
 * Aligne les scores reçus sur les côtés du match (ordre de `position`). 400 si un côté manque, si un
 * participant est étranger au match ou si un participant est répété.
 */
export const alignScores = (match: MatchEntity, scores: readonly IScoreSideInput[]): number[] => {
  const byParticipation = new Map(scores.map((entry) => [entry.participationId, entry.score]))
  const sides = sidesInOrder(match)
  const sideIds = new Set(sides.map((side) => side.participationId))
  const sound = byParticipation.size === scores.length
    && scores.length === sides.length
    && scores.every((entry) => sideIds.has(entry.participationId))
  if (!sound) {
    throw validationFailed([{ path: 'scores', message: 'Scores must cover exactly the sides of the match, once each' }])
  }
  return sides.map((side) => byParticipation.get(side.participationId)!)
}

export const hasSameScores = (stored: readonly (number | null)[], incoming: readonly number[]): boolean =>
  stored.length === incoming.length && stored.every((score, index) => score === incoming[index])

/** C6 : `statut` est une liste de MATCH_STATUS ; un statut inconnu renvoie 400. */
export const parseAdminMatchListQuery = (query: Record<string, unknown>): IAdminMatchListQuery => {
  const { tour, poule, statut } = parseWithSchema(adminMatchListQuerySchema, {
    tour: query.tour,
    poule: query.poule,
    statut: query.statut
  })
  return { roundKind: tour, poolRank: poule, statuses: statut ? [...new Set(statut)] : undefined }
}

import type { MATCH_PURPOSE, MATCH_STATUS } from '../../enums/match.enum.js'
import type { ROUND_KIND } from '../../enums/round.enum.js'

/**
 * `score` vaut `validated_score` côté public, et `null` tant que le match n'est pas validé :
 * un score saisi mais non validé n'est jamais public.
 */
export interface IMatchSide {
  participationId: string
  competitorId: string
  displayName: string
  score: number | null
}

/**
 * Match tel que le public le lit. Pas de `comment` ici (A13) : il est porté par `IAdminMatch`.
 * Les côtés sont symétriques ; le vainqueur se déduit des scores via `winnerParticipationId`.
 */
export interface IMatch {
  id: string
  sequence: number
  roundKind: ROUND_KIND
  poolRank: number | null
  purpose: MATCH_PURPOSE
  targetScore: number
  status: MATCH_STATUS
  sides: IMatchSide[]
  winnerParticipationId: string | null
}

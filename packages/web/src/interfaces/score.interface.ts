import type { IAdminMatch } from './admin-match.interface.js'
import type { IPool } from './pool.interface.js'
import type { IRound } from './round.interface.js'

/** Score d'un côté dans un corps de requête (`PUT /matchs/{id}/score`, validation, correction). */
export interface IScoreSideInput {
  participationId: string
  score: number
}

/** Corps de `PUT /matchs/{id}/score`, `POST /matchs/{id}/validation` et `POST /matchs/{id}/correction`. */
export interface IScoreSubmission {
  scores: IScoreSideInput[]
}

/**
 * Réponse de la validation et de la correction : l'état recalculé.
 * `pool` : classement de la poule du match (null en phase finale). `round` : le tour du match, avec ses
 * compteurs. `advancingParticipationIds` : le vivier du tour suivant, c'est-à-dire les vainqueurs des matchs
 * VALIDATED du tour en phase finale (vide pour un tour de poules). Il est dérivé, rien n'est stocké.
 */
export interface IMatchValidationResult {
  match: IAdminMatch
  pool: IPool | null
  round: IRound
  advancingParticipationIds: string[]
}

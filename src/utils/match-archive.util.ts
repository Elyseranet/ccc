import { MATCH_STATUS } from '../enums/match.enum.js'
import type { IMatch } from '../interfaces/match.interface.js'

/**
 * Match d'archive sans score (B-21, R-5 bis) : validé, aucun côté n'a de score, mais le vainqueur est connu.
 * Sans le champ `winnerParticipationId` du contrat B-21, ou sans match de ce genre, la réponse est toujours `false` :
 * rien ne change tant que l'API n'envoie pas cet état.
 */
export const isArchivedWinnerWithoutScore = (match: Pick<IMatch, 'status' | 'sides' | 'winnerParticipationId'>): boolean =>
  match.status === MATCH_STATUS.VALIDATED
  && match.sides.length > 0
  && match.sides.every(side => side.score === null)
  && typeof match.winnerParticipationId === 'string'

import type { MatchEntity } from '../../database/entities/match.entity'
import { DOMAIN_ERROR_CODE } from '../../enums/domain.enum'
import { MATCH_RECORD_KEY } from '../../enums/match-record-key.enum'
import type { IMatchRecord } from '../../interfaces/stats.interface'
import { MATCH_STATUS } from '../../../shared/enums/match.enum'
import { DomainRuleError } from '../domain/domain-rule-error.util'

/** Score d'un côté sans résultat : sans effet, le statut écarte le match des bilans V/D. */
const NO_SCORE = 0

/**
 * Convertit un match chargé avec `sides` et `sides.participation` vers l'IMatchRecord de B-03.
 * Le score lu est toujours `validatedScore`, jamais `recordedScore`.
 */
export const toMatchRecord = (match: MatchEntity, key: MATCH_RECORD_KEY): IMatchRecord => ({
  status: match.status,
  purpose: match.purpose,
  sides: match.sides.map((side) => {
    if (side.validatedScore === null && match.status === MATCH_STATUS.VALIDATED) {
      throw new DomainRuleError(DOMAIN_ERROR_CODE.INVALID_MATCH, 'Match validé sans score validé')
    }
    return {
      playerId: key === MATCH_RECORD_KEY.COMPETITOR ? side.participation.competitorId : side.participationId,
      score: side.validatedScore ?? NO_SCORE
    }
  })
})

import type { MatchEntity } from '../server/db/typeorm/entities/match.entity.js'
import { NO_SCORE } from '../consts/match-record.const.js'
import { DOMAIN_ERROR_CODE } from '../enums/domain.enum.js'
import { MATCH_RECORD_KEY } from '../enums/match-record-key.enum.js'
import type { IMatchRecord } from '../interfaces/stats.interface.js'
import { MATCH_STATUS } from '../enums/match.enum.js'
import { DomainRuleError } from './domain-rule-error.util.js'

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

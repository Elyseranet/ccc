import type { MatchEntity } from '../server/db/typeorm/entities/match.entity.js'
import { DOMAIN_ERROR_CODE } from '../enums/domain.enum.js'
import { MATCH_RECORD_KEY } from '../enums/match-record-key.enum.js'
import type { IMatchRecord } from '../interfaces/stats.interface.js'
import { MATCH_STATUS } from '../enums/match.enum.js'
import { DomainRuleError } from './domain-rule-error.util.js'

/**
 * Convertit un match chargé avec `sides` et `sides.participation` vers l'IMatchRecord de B-03.
 * Le score lu est toujours `validatedScore`, jamais `recordedScore` ; il reste null quand il est inconnu (B-21). Un match
 * VALIDATED sans score doit alors porter un vainqueur importé (`winnerParticipationId`), traduit dans la clé demandée.
 */
export const toMatchRecord = (match: MatchEntity, key: MATCH_RECORD_KEY): IMatchRecord => {
  const playerIdOf = (side: MatchEntity['sides'][number]): string =>
    key === MATCH_RECORD_KEY.COMPETITOR ? side.participation.competitorId : side.participationId
  const winnerSide = match.winnerParticipationId === null
    ? undefined
    : match.sides.find((side) => side.participationId === match.winnerParticipationId)
  if (match.status === MATCH_STATUS.VALIDATED && winnerSide === undefined && match.sides.some((side) => side.validatedScore === null)) {
    throw new DomainRuleError(DOMAIN_ERROR_CODE.INVALID_MATCH, 'Match validé sans score validé ni vainqueur')
  }
  return {
    status: match.status,
    purpose: match.purpose,
    sides: match.sides.map((side) => ({ playerId: playerIdOf(side), score: side.validatedScore })),
    winnerPlayerId: winnerSide === undefined ? null : playerIdOf(winnerSide)
  }
}

import { DOMAIN_ERROR_CODE } from '../../enums/domain.enum'
import { DomainRuleError } from '../domain/domain-rule-error.util'

/**
 * RG15 : round-robin intégral, n(n-1)/2 matchs (5 -> 10, 6 -> 15, 7 -> 21, 8 -> 28).
 * L'ordre des côtés n'encode rien (le vainqueur se déduit des scores).
 */
export function generateRoundRobin(participationIds: readonly string[]): [string, string][] {
  if (new Set(participationIds).size !== participationIds.length) {
    throw new DomainRuleError(DOMAIN_ERROR_CODE.INVALID_PARAMETER, 'Participations en double dans la poule')
  }
  const pairs: [string, string][] = []
  participationIds.forEach((first, index) => {
    for (const second of participationIds.slice(index + 1)) {
      pairs.push([first, second])
    }
  })
  return pairs
}

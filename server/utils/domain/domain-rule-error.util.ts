import type { DOMAIN_ERROR_CODE } from '../../enums/domain.enum.js'

/** Erreur levée quand une fonction de domaine reçoit une entrée qui viole une règle. */
export class DomainRuleError extends Error {
  readonly code: DOMAIN_ERROR_CODE

  constructor(code: DOMAIN_ERROR_CODE, message: string) {
    super(message)
    this.name = 'DomainRuleError'
    this.code = code
  }
}

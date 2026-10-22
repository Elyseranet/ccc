import type { LEGACY_IMPORT_ERROR_CODE } from '../../../enums/legacy-import.enum'

/** Erreur de la reprise : elle interrompt l'import avant toute écriture, ou annule la transaction. */
export class LegacyImportError extends Error {
  readonly code: LEGACY_IMPORT_ERROR_CODE
  readonly details: readonly string[]

  constructor(code: LEGACY_IMPORT_ERROR_CODE, message: string, details: readonly string[] = []) {
    super(details.length > 0 ? `${message} : ${details.join(' ; ')}` : message)
    this.name = 'LegacyImportError'
    this.code = code
    this.details = details
  }
}

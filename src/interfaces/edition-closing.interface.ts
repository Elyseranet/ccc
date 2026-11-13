import type { API_ERROR_CODE } from '../enums/api-error-code.enum.js'
import type { FINAL_STAGE } from '../enums/participation.enum.js'

/** Stade final et points (2 décimales) que recevra une participation à la clôture (RG1, RG2). */
export interface IClosingResult {
  participationId: string
  finalStage: FINAL_STAGE
  points: number
}

/**
 * Aperçu de la clôture, calculé par la fonction qui fige aussi les points côté serveur (CLOSE-PREVIEW).
 * `blockedBy` est non null tant que la finale n'est pas validée ; `results` est alors vide.
 */
export interface IClosingPreview {
  participantCount: number
  blockedBy: API_ERROR_CODE.FINAL_NOT_VALIDATED | null
  results: IClosingResult[]
}

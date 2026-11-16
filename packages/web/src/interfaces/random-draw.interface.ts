import type { IAdminDraw, IDrawAssignment, IDrawWriteOutcome } from './draw.interface.js'

/** Entrée du tirage d'un joueur de poule (B-26) : tailles des poules (RG16), joueurs déjà placés par poule, joueurs restants. */
export interface IPoolStepInput {
  sizes: readonly number[]
  filled: readonly number[]
  remainingIds: readonly string[]
}

export interface IPoolStep {
  participationId: string
  poolNumber: number
}

/** L'étape qui vient d'être tirée : les affectations écrites (une en poules, une ou deux en tour) et le nombre de joueurs restant à tirer. */
export interface IDrawStep {
  assignments: IDrawAssignment[]
  remaining: number
}

/** Réponse de `POST /tirages/{id}/tirage-au-sort` : le brouillon à jour et l'étape à révéler. */
export interface IRandomDrawResult {
  draw: IAdminDraw
  step: IDrawStep
}

export interface IRandomDrawOutcome extends IDrawWriteOutcome {
  step: IDrawStep
}

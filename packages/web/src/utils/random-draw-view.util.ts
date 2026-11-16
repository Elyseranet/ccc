import { DRAW_KIND } from '../enums/draw.enum.js'
import type { IAdminDraw, IDrawAssignmentInput } from '../interfaces/draw.interface.js'
import type { IRandomDrawResult } from '../interfaces/random-draw.interface.js'
import type { IDrawArrival, IDrawProjectorView } from '../interfaces/random-draw-screen.interface.js'

/**
 * Vue de l'écran projecteur pour l'étape qui vient d'être tirée (F-52). Poules : un joueur et sa poule, rang = ordre de tirage moins les têtes de série.
 * Tour : l'affiche (le côté déjà saisi à la main est lu dans le brouillon rendu par le serveur), rang = numéro de l'affiche.
 */
export const toProjectorView = (kind: DRAW_KIND, result: IRandomDrawResult, total: number): IDrawProjectorView => {
  const first = result.step.assignments[0]
  if (kind === DRAW_KIND.POOLS) {
    const seeds = result.draw.parameters.seedCount
    return {
      kind,
      names: [first?.displayName ?? ''],
      poolNumber: first?.poolNumber ?? null,
      pairingIndex: null,
      position: (first?.drawnOrder ?? 0) - seeds,
      total: total - seeds
    }
  }
  const pairingIndex = first?.pairingIndex ?? null
  const sides = result.draw.assignments
    .filter(assignment => assignment.pairingIndex === pairingIndex)
    .sort((a, b) => (a.sidePosition ?? 0) - (b.sidePosition ?? 0))
  return { kind, names: sides.map(side => side.displayName), poolNumber: null, pairingIndex, position: pairingIndex ?? 0, total }
}

/** Écran projecteur de la finale (F-56) : l'affiche unique du brouillon validé, côté 1 puis côté 2. */
export const toFinalProjectorView = (draw: IAdminDraw): IDrawProjectorView => {
  const sides = draw.assignments
    .filter(assignment => assignment.pairingIndex === 1)
    .sort((a, b) => (a.sidePosition ?? 0) - (b.sidePosition ?? 0))
  return { kind: DRAW_KIND.ROUND, names: sides.map(side => side.displayName), poolNumber: null, pairingIndex: 1, position: 1, total: 1, final: true }
}

export const toArrival = (result: IRandomDrawResult): IDrawArrival => ({
  participationIds: result.step.assignments.map(assignment => assignment.participationId),
  poolNumber: result.step.assignments[0]?.poolNumber ?? null,
  pairingIndex: result.step.assignments[0]?.pairingIndex ?? null
})

/** Éléments effacés par « Recommencer » : joueurs tirés hors têtes de série (poules), affiches commencées (tour). */
export const drawnCountOf = (kind: DRAW_KIND, draw: IAdminDraw | null): number => {
  if (!draw) {
    return 0
  }
  if (kind === DRAW_KIND.POOLS) {
    return Math.max(0, draw.assignments.length - draw.parameters.seedCount)
  }
  return new Set(draw.assignments.map(assignment => assignment.pairingIndex)).size
}

/** Remise à zéro par `PUT /affectations` : les têtes de série seules en poules (RG9), rien en tour. */
export const resetAssignmentsOf = (kind: DRAW_KIND, draw: IAdminDraw): IDrawAssignmentInput[] =>
  kind === DRAW_KIND.POOLS
    ? draw.assignments
      .filter(assignment => assignment.drawnOrder <= draw.parameters.seedCount)
      .map(assignment => ({ participationId: assignment.participationId, poolNumber: assignment.poolNumber ?? assignment.drawnOrder, drawnOrder: assignment.drawnOrder }))
    : []

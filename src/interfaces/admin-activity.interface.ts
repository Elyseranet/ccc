import type { ADMIN_ACTIVITY_KIND, ADMIN_ACTIVITY_TARGET } from '../enums/admin-activity.enum.js'
import type { DRAW_KIND } from '../enums/draw.enum.js'
import type { ROUND_KIND } from '../enums/round.enum.js'
import type { TAdminActivityTarget } from '../types/admin-activity.type.js'
import type { IAdminActor } from './admin-match.interface.js'
import type { IMatchSide } from './match.interface.js'

/**
 * Cible « match » d'une entrée d'activité. `sides` : les deux côtés dans l'ordre des positions (aucune
 * convention « vainqueur en premier »). `score` = le score validé pour MATCH_VALIDATED, le score corrigé pour
 * MATCH_CORRECTED.
 */
export interface IAdminActivityMatchTarget {
  type: ADMIN_ACTIVITY_TARGET.MATCH
  id: string
  matchSequence: number
  roundKind: ROUND_KIND
  /** Numéro de la poule (1-based) ; null en phase finale. */
  poolNumber: number | null
  sides: [IMatchSide, IMatchSide]
}

/** Cible « tirage ». `poolCount` et `seedCount` : renseignés pour un tirage de poules, null pour un tirage de tour. */
export interface IAdminActivityDrawTarget {
  type: ADMIN_ACTIVITY_TARGET.DRAW
  id: string
  drawKind: DRAW_KIND
  roundKind: ROUND_KIND | null
  poolCount: number | null
  seedCount: number | null
}

/**
 * Entrée du flux d'activité du tableau de bord admin (A17, B-15), dérivé des validations de match et des tirages.
 * Contrat de la liste : triée du plus récent au plus ancien, `?limit=` borné (défaut 20, maximum 100).
 * Aucune chaîne n'est construite par le serveur : le front traduit à partir des champs structurés de `target`.
 */
export interface IAdminActivityItem {
  kind: ADMIN_ACTIVITY_KIND
  /** ISO 8601. */
  at: string
  actor: IAdminActor | null
  target: TAdminActivityTarget
}

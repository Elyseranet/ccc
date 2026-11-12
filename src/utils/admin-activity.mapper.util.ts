import { ADMIN_ACTIVITY_KIND, ADMIN_ACTIVITY_TARGET } from '../enums/admin-activity.enum.js'
import { DRAW_KIND } from '../enums/draw.enum.js'
import type { DrawEntity } from '../server/db/typeorm/entities/draw.entity.js'
import type { MatchEntity } from '../server/db/typeorm/entities/match.entity.js'
import type { UserEntity } from '../server/db/typeorm/entities/user.entity.js'
import type { IAdminActivityDrawTarget, IAdminActivityItem, IAdminActivityMatchTarget } from '../interfaces/admin-activity.interface.js'
import type { IAdminActor } from '../interfaces/admin-match.interface.js'
import type { IMatchSide } from '../interfaces/match.interface.js'
import { toAdminActor } from './admin-actor.mapper.util.js'
import { toPublicMatch } from './match-public.mapper.util.js'

/** Seul point d'appel du mapper d'acteur du flux : la décision sur le repli du nom affiché (arbitrage en attente) se branche ici. */
const toActivityActor = (user: UserEntity | null): IAdminActor | null => toAdminActor(user)

/**
 * Type d'activité d'un match dont `validated_at` est renseigné : toujours MATCH_VALIDATED. `correctMatch` réécrit
 * `validated_at` et `validated_by_user_id` : un match corrigé apparaît donc en MATCH_VALIDATED, à la date de la
 * correction et avec son auteur (décision utilisateur, B-15).
 */
export const matchActivityKind = (_match: MatchEntity): ADMIN_ACTIVITY_KIND => ADMIN_ACTIVITY_KIND.MATCH_VALIDATED

/** Entrée d'un match validé. Le match doit avoir `validatedAt` et être chargé avec `ADMIN_MATCH_RELATIONS`. */
export const toMatchActivity = (match: MatchEntity): IAdminActivityItem => {
  const published = toPublicMatch(match)
  const target: IAdminActivityMatchTarget = {
    type: ADMIN_ACTIVITY_TARGET.MATCH,
    id: match.id,
    matchSequence: match.sequence,
    roundKind: published.roundKind,
    poolNumber: published.poolRank,
    sides: published.sides as [IMatchSide, IMatchSide]
  }
  return { kind: matchActivityKind(match), at: match.validatedAt!.toISOString(), actor: toActivityActor(match.validatedBy), target }
}

const toDrawTarget = (draw: DrawEntity): IAdminActivityDrawTarget => {
  const isPools = draw.kind === DRAW_KIND.POOLS
  return {
    type: ADMIN_ACTIVITY_TARGET.DRAW,
    id: draw.id,
    drawKind: draw.kind,
    roundKind: draw.round?.kind ?? null,
    poolCount: isPools ? draw.parameters.poolCount : null,
    seedCount: isPools ? draw.parameters.seedCount : null
  }
}

/** Création d'un tirage (brouillon compris). Chargé avec `ADMIN_DRAW_RELATIONS`. */
export const toDrawCreatedActivity = (draw: DrawEntity): IAdminActivityItem =>
  ({ kind: ADMIN_ACTIVITY_KIND.DRAW_CREATED, at: draw.createdAt.toISOString(), actor: toActivityActor(draw.createdBy), target: toDrawTarget(draw) })

/** Validation d'un tirage (`validatedAt` renseigné). Chargé avec `ADMIN_DRAW_RELATIONS`. */
export const toDrawValidatedActivity = (draw: DrawEntity): IAdminActivityItem =>
  ({ kind: ADMIN_ACTIVITY_KIND.DRAW_VALIDATED, at: draw.validatedAt!.toISOString(), actor: toActivityActor(draw.validatedBy), target: toDrawTarget(draw) })

/** Du plus récent au plus ancien ; à égalité d'instant, l'id de la cible puis le type d'activité départagent (ordre stable). */
export const compareActivity = (a: IAdminActivityItem, b: IAdminActivityItem): number =>
  Date.parse(b.at) - Date.parse(a.at) || a.target.id.localeCompare(b.target.id) || a.kind.localeCompare(b.kind)

import type { MatchEntity } from '../server/db/typeorm/entities/match.entity.js'
import type { IAdminActor, IAdminMatch } from '../interfaces/admin-match.interface.js'
import { toPublicMatch } from './match-public.mapper.util.js'

const toActor = (match: MatchEntity): IAdminActor | null => {
  const user = match.validatedBy
  return user ? { id: user.id, displayName: user.competitor?.displayName ?? user.email } : null
}

/**
 * DTO admin (C6) : statut réel (RECORDED visible), score saisi et commentaire (A13). Ne jamais le renvoyer hors
 * de `/api/v1/admin/` et des routes d'écriture de score. Le match doit être chargé avec `ADMIN_MATCH_RELATIONS`.
 */
export const toAdminMatch = (match: MatchEntity): IAdminMatch => {
  const base = toPublicMatch(match)
  const recorded = new Map(match.sides.map((side) => [side.participationId, side.recordedScore]))
  return {
    ...base,
    status: match.status,
    sides: base.sides.map((side) => ({ ...side, recordedScore: recorded.get(side.participationId) ?? null })),
    comment: match.comment,
    version: match.version,
    recordedAt: match.recordedAt?.toISOString() ?? null,
    validatedAt: match.validatedAt?.toISOString() ?? null,
    validatedBy: toActor(match)
  }
}

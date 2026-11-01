import type { UserEntity } from '../server/db/typeorm/entities/user.entity.js'
import type { IAdminActor } from '../interfaces/admin-match.interface.js'

/** Auteur d'une action administrateur (validation d'un match, création ou validation d'un tirage). Le compte est chargé avec son compétiteur. */
export const toAdminActor = (user: UserEntity | null): IAdminActor | null =>
  user ? { id: user.id, displayName: user.competitor?.displayName ?? user.email } : null

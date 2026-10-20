import type { IMatch, IMatchSide } from './match.interface'

export interface IAdminActor {
  id: string
  displayName: string
}

export interface IAdminMatchSide extends IMatchSide {
  recordedScore: number | null
}

/**
 * Match vu par l'administrateur (C6). Ne jamais renvoyer ce DTO sur une route publique.
 * `version` sert au verrouillage optimiste (`If-Match`, MATCH_VERSION_CONFLICT).
 */
export interface IAdminMatch extends IMatch {
  sides: IAdminMatchSide[]
  comment: string | null
  version: number
  recordedAt: string | null
  validatedAt: string | null
  validatedBy: IAdminActor | null
}

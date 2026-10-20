import type { EDITION_ORIGIN, EDITION_STATUS } from '../../enums/edition.enum'
import type { FINAL_STAGE, PARTICIPATION_STATUS } from '../../enums/participation.enum'
import type { ICompetitorPublic } from './competitor.interface'
import type { IDraw } from './draw.interface'
import type { IMatch } from './match.interface'
import type { IPool } from './pool.interface'
import type { IBracketRound, IRound } from './round.interface'

export interface IEditionChampion {
  competitor: ICompetitorPublic
  titlesToDate: number
}

export interface IEditionSummary {
  id: string
  code: string
  year: number
  name: string | null
  heldOn: string | null
  location: string | null
  status: EDITION_STATUS
  origin: EDITION_ORIGIN
  participantCount: number | null
  matchCount: number
  scoredMatchCount: number
  champion: IEditionChampion | null
}

export interface IEditionParticipant {
  participationId: string
  competitor: ICompetitorPublic
  poolId: string | null
  isSeed: boolean
  seedRank: number | null
  status: PARTICIPATION_STATUS
  finalStage: FINAL_STAGE | null
  points: number | null
  poolRank: number | null
}

/**
 * `editions.comment` n'est volontairement pas exposé : sa visibilité n'est pas tranchée.
 */
export interface IEditionDetail extends IEditionSummary {
  description: string | null
  participants: IEditionParticipant[]
  pools: IPool[]
  rounds: IRound[]
  matches: IMatch[]
  draws: IDraw[]
  bracket: IBracketRound[]
}

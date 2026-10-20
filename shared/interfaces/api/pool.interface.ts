import type { PARTICIPATION_STATUS } from '../../enums/participation.enum.js'
import type { ICompetitorPublic } from './competitor.interface.js'

export interface IPoolStandingRow {
  rank: number
  participationId: string
  competitor: ICompetitorPublic
  isSeed: boolean
  participationStatus: PARTICIPATION_STATUS
  played: number
  wins: number
  losses: number
  pointsFor: number
  pointsAgainst: number
  /** Cap's average : points marqués moins points encaissés (RG19). */
  capsAverage: number
}

export interface IPool {
  id: string
  rank: number
  standing: IPoolStandingRow[]
}

import type { DRAW_KIND, DRAW_STATUS } from '../../enums/draw.enum.js'
import type { ROUND_KIND } from '../../enums/round.enum.js'

export interface IDrawParameters {
  poolCount: number
  seedCount: number
}

/**
 * Affectation d'un tirage. L'ordre `drawnOrder` conserve le tirage « poule après poule » (RG11).
 */
export interface IDrawAssignment {
  participationId: string
  competitorId: string
  displayName: string
  poolId: string | null
  pairingIndex: number | null
  sidePosition: number | null
  drawnOrder: number
  assignedAt: string
}

export interface IDraw {
  id: string
  kind: DRAW_KIND
  roundKind: ROUND_KIND | null
  status: DRAW_STATUS
  parameters: IDrawParameters
  createdAt: string
  validatedAt: string | null
  assignments: IDrawAssignment[]
}

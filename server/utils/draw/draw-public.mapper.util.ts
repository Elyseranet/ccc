import type { DrawAssignmentEntity } from '../../database/entities/draw-assignment.entity'
import type { DrawEntity } from '../../database/entities/draw.entity'
import type { IDraw, IDrawAssignment } from '../../../shared/interfaces/api/draw.interface'

const toPublicAssignment = (assignment: DrawAssignmentEntity): IDrawAssignment => ({
  participationId: assignment.participationId,
  competitorId: assignment.participation.competitorId,
  displayName: assignment.participation.competitor.displayName,
  poolId: assignment.poolId,
  pairingIndex: assignment.pairingIndex,
  sidePosition: assignment.sidePosition,
  drawnOrder: assignment.drawnOrder,
  assignedAt: assignment.assignedAt.toISOString()
})

/**
 * DTO d'un tirage. L'appelant ne passe que des tirages VALIDATED : un brouillon n'est jamais public.
 * Le tirage est chargé avec `round` ; les affectations avec `participation.competitor`.
 */
export const toPublicDraw = (draw: DrawEntity, assignments: DrawAssignmentEntity[]): IDraw => ({
  id: draw.id,
  kind: draw.kind,
  roundKind: draw.round?.kind ?? null,
  status: draw.status,
  parameters: draw.parameters,
  createdAt: draw.createdAt.toISOString(),
  validatedAt: draw.validatedAt?.toISOString() ?? null,
  assignments: [...assignments].sort((a, b) => a.drawnOrder - b.drawnOrder).map(toPublicAssignment)
})

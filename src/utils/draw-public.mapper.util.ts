import type { DrawAssignmentEntity } from '../server/db/typeorm/entities/draw-assignment.entity.js'
import type { DrawEntity } from '../server/db/typeorm/entities/draw.entity.js'
import type { IDraw, IDrawAssignment } from '../interfaces/draw.interface.js'

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
  // Liste blanche : une clé parasite du jsonb ne devient jamais publique.
  parameters: { poolCount: draw.parameters.poolCount, seedCount: draw.parameters.seedCount },
  createdAt: draw.createdAt.toISOString(),
  validatedAt: draw.validatedAt?.toISOString() ?? null,
  assignments: [...assignments].sort((a, b) => a.drawnOrder - b.drawnOrder).map(toPublicAssignment)
})

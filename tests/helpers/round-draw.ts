import { API_ERROR_CODE } from '../../src/enums/api-error-code.enum'
import { DRAW_KIND, DRAW_STATUS } from '../../src/enums/draw.enum'
import { ROUND_KIND, ROUND_STATUS } from '../../src/enums/round.enum'
import type { IAdminDraw } from '../../src/interfaces/draw.interface'
import type { IRoundDrawPreview } from '../../src/interfaces/qualification.interface'
import type { IRound } from '../../src/interfaces/round.interface'
import { member } from './qualification'

export const candidates = (count: number) => Array.from({ length: count }, (_, index) => member(`p${index + 1}`, `Joueur ${String(index + 1).padStart(2, '0')}`))

/** Aperçu d'un vivier de `count` joueurs : le tour est déduit pour 2, 4, 8 ou 16, sinon `roundKind` est nul et les tours permis sont donnés. */
export const preview = (count: number, overrides: Partial<IRoundDrawPreview> = {}): IRoundDrawPreview => ({
  roundKind: ({ 2: ROUND_KIND.FINAL, 4: ROUND_KIND.SEMI, 8: ROUND_KIND.QUARTER, 16: ROUND_KIND.ROUND_OF_16 } as Record<number, ROUND_KIND>)[count] ?? null,
  allowedRoundKinds: ({ 2: [ROUND_KIND.FINAL], 4: [ROUND_KIND.SEMI], 8: [ROUND_KIND.QUARTER], 16: [ROUND_KIND.ROUND_OF_16] } as Record<number, ROUND_KIND[]>)[count] ?? [ROUND_KIND.QUARTER, ROUND_KIND.SEMI],
  candidates: candidates(count),
  blockedBy: null,
  ...overrides
})

export const draftOf = (assignments: Array<[string, number, 1 | 2, number]>, overrides: Partial<IAdminDraw> = {}): IAdminDraw => ({
  id: 'draw-1',
  kind: DRAW_KIND.ROUND,
  roundKind: ROUND_KIND.QUARTER,
  status: DRAW_STATUS.DRAFT,
  parameters: { poolCount: 0, seedCount: 0 },
  createdAt: '2026-11-13T10:00:00.000Z',
  validatedAt: null,
  assignments: assignments.map(([id, pairingIndex, sidePosition, drawnOrder]) => ({
    participationId: `part-${id}`, competitorId: id, displayName: id, poolId: null, poolNumber: null, pairingIndex, sidePosition, drawnOrder, assignedAt: '2026-11-13T10:00:00.000Z'
  })),
  createdBy: null,
  validatedBy: null,
  ...overrides
})

export const round = (kind: ROUND_KIND, status: ROUND_STATUS, matchCount = 4, validatedMatchCount = 0): IRound => ({
  id: `round-${kind}`, kind, sequence: 1, status, matchCount, validatedMatchCount
})

export const blocked = (code: API_ERROR_CODE): Partial<IRoundDrawPreview> => ({ roundKind: null, allowedRoundKinds: [], blockedBy: code as IRoundDrawPreview['blockedBy'] })

import { describe, expect, it } from 'vitest'
import { ADMIN_ACTIVITY_TARGET } from '../../src/enums/admin-activity.enum'
import { DRAW_KIND } from '../../src/enums/draw.enum'
import { ROUND_KIND } from '../../src/enums/round.enum'
import type { TAdminActivityTarget } from '../../src/types/admin-activity.type'

/**
 * Le `switch` est exhaustif : si une cible est ajoutée à l'union sans être traitée ici, `never` ne s'affecte plus
 * et le typecheck échoue. Il prouve aussi que `type` discrimine l'union (accès à des champs propres à chaque cible).
 */
const describeTarget = (target: TAdminActivityTarget): string => {
  switch (target.type) {
    case ADMIN_ACTIVITY_TARGET.MATCH:
      return `match ${target.matchSequence} ${target.roundKind} ${target.poolNumber ?? '-'} ${target.sides.length}`
    case ADMIN_ACTIVITY_TARGET.DRAW:
      return `draw ${target.drawKind} ${target.roundKind ?? '-'} ${target.poolCount ?? '-'} ${target.seedCount ?? '-'}`
    default: {
      const unreachable: never = target
      return unreachable
    }
  }
}

describe('TAdminActivityTarget', () => {
  it('discriminates match and draw targets', () => {
    const side = { participationId: 'p', competitorId: 'c', displayName: 'Joueur', score: 5 }
    expect(describeTarget({
      type: ADMIN_ACTIVITY_TARGET.MATCH, id: 'm', matchSequence: 4, roundKind: ROUND_KIND.POOLS, poolNumber: 2, sides: [side, side]
    })).toBe('match 4 POOLS 2 2')
    expect(describeTarget({
      type: ADMIN_ACTIVITY_TARGET.DRAW, id: 'd', drawKind: DRAW_KIND.POOLS, roundKind: null, poolCount: 8, seedCount: 8
    })).toBe('draw POOLS - 8 8')
  })
})

import { describe, expect, it } from 'vitest'
import { DOMAIN_ERROR_CODE } from '../../../src/enums/domain.enum'
import {
  computeHeadToHead,
  computePlayerBalance,
  computeWinLoss,
} from '../../../src/utils/record.util'
import { MATCH_PURPOSE, MATCH_STATUS } from '../../../src/enums/match.enum'
import { duel, tiebreak } from './match.factory'

describe('RG7, RG36, RG37 (jeu synthétique)', () => {
  const matches = [
    duel('ann', 5, 'bob', 3),
    duel('bob', 2, 'ann', 5), // le vainqueur est en seconde position : il se déduit des scores
    duel('bob', 10, 'cat', 9),
  ]

  it('RG7 : bilan victoires / défaites', () => {
    expect(computeWinLoss(matches)).toEqual([
      { playerId: 'ann', wins: 2, losses: 0, unknownResults: 0 },
      { playerId: 'bob', wins: 1, losses: 2, unknownResults: 0 },
      { playerId: 'cat', wins: 0, losses: 1, unknownResults: 0 },
    ])
  })

  it('R-5 : un match RESULT_UNKNOWN n est ni victoire ni défaite, il est compté à part', () => {
    const unknown = [
      duel('ann', 0, 'bob', 0, { status: MATCH_STATUS.RESULT_UNKNOWN }),
      duel('ann', 0, 'cat', 0, { status: MATCH_STATUS.RESULT_UNKNOWN }),
      // un départage inconnu n est pas un match REGULAR : non compté
      duel('bob', 0, 'cat', 0, {
        status: MATCH_STATUS.RESULT_UNKNOWN,
        purpose: MATCH_PURPOSE.TIEBREAK,
      }),
    ]
    expect(computeWinLoss([...matches, ...unknown])).toEqual([
      { playerId: 'ann', wins: 2, losses: 0, unknownResults: 2 },
      { playerId: 'bob', wins: 1, losses: 2, unknownResults: 1 },
      { playerId: 'cat', wins: 0, losses: 1, unknownResults: 1 },
    ])
    // un joueur qui n a que des résultats inconnus apparaît, sans ratio
    expect(computePlayerBalance([unknown[0]!])).toEqual([
      expect.objectContaining({ playerId: 'ann', played: 0, winRatio: null, unknownResults: 1 }),
      expect.objectContaining({ playerId: 'bob', played: 0, winRatio: null, unknownResults: 1 }),
    ])
  })

  it('RG7, RG36 : un match TIEBREAK, RESULT_UNKNOWN ou non validé n entre pas dans le bilan', () => {
    const noise = [
      tiebreak(['ann', 5], ['bob', 1]),
      duel('ann', 0, 'bob', 0, { status: MATCH_STATUS.RESULT_UNKNOWN }),
      duel('ann', 5, 'bob', 0, { status: MATCH_STATUS.RECORDED }),
      duel('ann', 5, 'bob', 0, { status: MATCH_STATUS.SCHEDULED }),
      duel('ann', 5, 'bob', 0, { purpose: MATCH_PURPOSE.TIEBREAK }),
    ]
    const withoutUnknown = (rows: { unknownResults: number }[]) =>
      rows.map((row) => ({ ...row, unknownResults: 0 }))
    expect(withoutUnknown(computeWinLoss([...matches, ...noise]))).toEqual(computeWinLoss(matches))
    expect(withoutUnknown(computePlayerBalance([...matches, ...noise]))).toEqual(
      computePlayerBalance(matches),
    )
    expect(computeHeadToHead([...matches, ...noise], 'ann', 'bob')).toEqual(
      computeHeadToHead(matches, 'ann', 'bob'),
    )
  })

  it('RG37 : joués, ratio, points marqués et encaissés, différentiel', () => {
    const bob = computePlayerBalance(matches).find((b) => b.playerId === 'bob')
    expect(bob).toEqual({
      playerId: 'bob',
      played: 3,
      wins: 1,
      losses: 2,
      unknownResults: 0,
      winRatio: 1 / 3,
      pointsFor: 15,
      pointsAgainst: 19,
      differential: -4,
    })
  })

  it('RG36 : confrontations, dans l ordre demandé', () => {
    expect(computeHeadToHead(matches, 'ann', 'bob')).toEqual({
      playerAId: 'ann',
      playerBId: 'bob',
      encounters: 2,
      winsA: 2,
      winsB: 0,
      pointsA: 10,
      pointsB: 5,
    })
    expect(computeHeadToHead(matches, 'bob', 'ann')).toMatchObject({ winsA: 0, winsB: 2, pointsA: 5, pointsB: 10 })
    expect(computeHeadToHead(matches, 'ann', 'cat')).toMatchObject({ encounters: 0, winsA: 0, winsB: 0 })
  })

  it('refuse un match validé incohérent', () => {
    const code = (match: ReturnType<typeof duel>) => {
      try {
        computeWinLoss([match])
      } catch (error) {
        return (error as { code: string }).code
      }
      return null
    }
    expect(code(duel('ann', 5, 'bob', 5))).toBe(DOMAIN_ERROR_CODE.INVALID_MATCH)
    expect(code(duel('ann', 5, 'ann', 1))).toBe(DOMAIN_ERROR_CODE.INVALID_MATCH)
    expect(code({ ...duel('ann', 5, 'bob', 1), sides: [{ playerId: 'ann', score: 5 }] })).toBe(
      DOMAIN_ERROR_CODE.INVALID_MATCH,
    )
  })
})

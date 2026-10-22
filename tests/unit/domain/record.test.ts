import { describe, expect, it } from 'vitest'
import { DOMAIN_ERROR_CODE } from '../../../src/enums/domain.enum'
import {
  computeHeadToHead,
  computePlayerBalance,
  computeWinLoss,
} from '../../../src/server/utils/stats/record.util'
import { MATCH_PURPOSE, MATCH_STATUS } from '../../../src/enums/match.enum'
import { duel, tiebreak } from './match.factory'
import { sheetRows, workbookMatches, workbookUnknownResultPairs } from './workbook.fixture'

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

describe('RG7, RG36, RG37 sur le classeur (onglets scores et F2F)', () => {
  const matches = workbookMatches()
  const balances = new Map(computePlayerBalance(matches).map((b) => [b.playerId, b]))
  const f2f = sheetRows('F2F')

  // Écart connu entre B-03 et le classeur : J, G, P et les confrontations de F2F comptent les
  // 175 lignes nommées mais sans score (RESULT_UNKNOWN dans l'app), que le ticket exclut. Les
  // points (+, -, C/A) ne viennent que des matchs scorés et coïncident exactement.
  const unknown = workbookUnknownResultPairs()
  const unknownWins = (name: string) => unknown.filter(([winner]) => winner === name).length
  const unknownLosses = (name: string) => unknown.filter(([, loser]) => loser === name).length

  it('554 matchs scorés, tous REGULAR et VALIDATED ; 729 lignes nommées au total (A16)', () => {
    expect(matches).toHaveLength(554)
    expect(matches.length + unknown.length).toBe(729)
  })

  it('R-5 : sur les matchs avec score Deseine est à 39/13, et 19 matchs sont au résultat inconnu', () => {
    const asUnknown = unknown.map(([a, b]) =>
      duel(a, 0, b, 0, { status: MATCH_STATUS.RESULT_UNKNOWN }),
    )
    const all = [...matches, ...asUnknown]
    const deseine = computeWinLoss(all).find((w) => w.playerId === 'Nicolas Deseine')
    expect(deseine).toEqual({ playerId: 'Nicolas Deseine', wins: 39, losses: 13, unknownResults: 19 })
    // J du classeur (F2F) = matchs avec score + matchs au résultat inconnu, pour chaque joueur
    const balances = new Map(computePlayerBalance(all).map((b) => [b.playerId, b]))
    let compared = 0
    for (const { values } of f2f.slice(1)) {
      const balance = balances.get(String(values[0]))
      if (typeof values[1] !== 'number' || !balance) continue
      expect(balance.played + balance.unknownResults, String(values[0])).toBe(values[1])
      compared += 1
    }
    expect(compared).toBeGreaterThan(100)
  })

  it('Nicolas Deseine : points 339 / 218 / C/A 121 exacts ; V/D 39/13 scorés + 14/5 sans score = 53/18', () => {
    expect(balances.get('Nicolas Deseine')).toMatchObject({
      played: 52,
      wins: 39,
      losses: 13,
      pointsFor: 339,
      pointsAgainst: 218,
      differential: 121,
    })
    expect([unknownWins('Nicolas Deseine'), unknownLosses('Nicolas Deseine')]).toEqual([14, 5])
  })

  it('reproduit chaque ligne de F2F : points exacts, V/D = scorés + sans score', () => {
    let compared = 0
    for (const { values } of f2f.slice(1)) {
      const name = values[0]
      if (typeof name !== 'string' || typeof values[1] !== 'number') continue
      const balance = balances.get(name) ?? {
        wins: 0,
        losses: 0,
        pointsFor: 0,
        pointsAgainst: 0,
        differential: 0,
      }
      expect(balance.wins + unknownWins(name), `G ${name}`).toBe(values[3])
      expect(balance.losses + unknownLosses(name), `P ${name}`).toBe(values[4])
      expect(balance.pointsFor, `+ ${name}`).toBe(values[5])
      expect(balance.pointsAgainst, `- ${name}`).toBe(values[6])
      expect(balance.differential, `C/A ${name}`).toBe(values[7])
      compared += 1
    }
    expect(compared).toBeGreaterThan(100)
  })

  it('RG7 : Deseine (colonne F de Data) = computeWinLoss + matchs sans score', () => {
    const deseine = computeWinLoss(matches).find((w) => w.playerId === 'Nicolas Deseine')!
    expect(`(${deseine.wins + 14}/${deseine.losses + 5})`).toBe('(53/18)')
  })

  it('RG36 : confrontations `n (v/d)` de F2F contre Arthur Vaur, pour chaque joueur', () => {
    const header = f2f[0]!.values
    let compared = 0
    for (const { values } of f2f.slice(1)) {
      const name = String(values[0])
      for (let column = 8; column < header.length; column++) {
        const cell = values[column]
        const opponent = header[column]
        if (typeof cell !== 'string' || typeof opponent !== 'string' || opponent === name) continue
        const parsed = /^(\d+) \((\d+)\/(\d+)\)$/.exec(cell)
        if (!parsed) continue
        const [encounters, wins, losses] = parsed.slice(1).map(Number)
        const h2h = computeHeadToHead(matches, name, opponent)
        const extraWins = unknown.filter(([w, l]) => w === name && l === opponent).length
        const extraLosses = unknown.filter(([w, l]) => w === opponent && l === name).length
        expect(
          [h2h.encounters + extraWins + extraLosses, h2h.winsA + extraWins, h2h.winsB + extraLosses],
          `${name} vs ${opponent}`,
        ).toEqual([encounters, wins, losses])
        compared += 1
      }
    }
    expect(compared).toBeGreaterThan(100)
  })

  it('Nicolas Deseine contre Arthur Vaur : 6 (3/3) au classeur = 4 (2/2) scorés + 2 (1/1) sans score', () => {
    expect(computeHeadToHead(matches, 'Nicolas Deseine', 'Arthur Vaur')).toMatchObject({
      encounters: 4,
      winsA: 2,
      winsB: 2,
    })
  })
})

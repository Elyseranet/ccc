import { describe, expect, it } from 'vitest'
import { TIEBREAK_FORMAT } from '../../../server/enums/domain.enum'
import { computePoolStanding } from '../../../server/utils/pool/standing.util'
import { generateRoundRobin } from '../../../server/utils/pool/round-robin.util'
import { resolveTiedGroup, tiebreakFormatFor } from '../../../server/utils/pool/tiebreak.util'
import { MATCH_STATUS } from '../../../shared/enums/match.enum'
import { duel, tiebreak } from './match.factory'
import { sheetRows } from './workbook.fixture'

const ranks = (standing: ReturnType<typeof computePoolStanding>) =>
  standing.entries.map((entry) => `${entry.rank}:${entry.playerId}`)

describe('RG19, A10 : classement de poule', () => {
  it('victoires d abord', () => {
    const standing = computePoolStanding(
      ['a', 'b', 'c'],
      [duel('a', 5, 'b', 0), duel('a', 5, 'c', 0), duel('b', 5, 'c', 4)],
    )
    expect(ranks(standing)).toEqual(['1:a', '2:b', '3:c'])
    expect(standing.requiresTiebreak).toEqual([])
    expect(standing.entries[0]).toMatchObject({ played: 2, wins: 2, losses: 0, pointsFor: 10, pointsAgainst: 0, capsAverage: 10 })
  })

  it('même nombre de victoires : départagés par le cap s average', () => {
    // a bat tout le monde ; b, c, d forment un cycle (1 victoire chacun)
    const matches = [
      duel('a', 5, 'b', 0),
      duel('a', 5, 'c', 0),
      duel('a', 5, 'd', 0),
      duel('b', 5, 'c', 3),
      duel('c', 5, 'd', 4),
      duel('d', 5, 'b', 0),
    ]
    const standing = computePoolStanding(['a', 'b', 'c', 'd'], matches)
    // b : 5-13 = -8 ; c : 8-14 = -6 ; d : 9-10 = -1
    expect(ranks(standing)).toEqual(['1:a', '2:d', '3:c', '4:b'])
    expect(standing.entries.map((e) => e.capsAverage)).toEqual([15, -1, -6, -8])
    expect(standing.requiresTiebreak).toEqual([])
  })

  it('victoires et cap s average égaux : départagés par la confrontation directe', () => {
    const matches = [
      duel('x', 5, 'y', 3),
      duel('x', 5, 'z', 2),
      duel('w', 5, 'x', 4),
      duel('y', 5, 'z', 2),
      duel('y', 5, 'w', 2),
      duel('z', 5, 'w', 0),
    ]
    // x et y : 2 victoires, cap's average +4 chacun ; x a battu y
    const standing = computePoolStanding(['y', 'x', 'z', 'w'], matches)
    expect(standing.entries.slice(0, 2).map((e) => [e.playerId, e.wins, e.capsAverage])).toEqual([
      ['x', 2, 4],
      ['y', 2, 4],
    ])
    expect(ranks(standing)).toEqual(['1:x', '2:y', '3:z', '4:w'])
    expect(standing.requiresTiebreak).toEqual([])
  })

  it('égalité à trois sans issue : requiresTiebreak (match à 3 côtés), sans trancher', () => {
    const cycle = [duel('a', 5, 'b', 3), duel('b', 5, 'c', 3), duel('c', 5, 'a', 3)]
    const standing = computePoolStanding(['a', 'b', 'c'], cycle)
    expect(standing.entries.every((e) => e.rank === 1)).toBe(true)
    expect(standing.requiresTiebreak).toEqual([
      { playerIds: ['a', 'b', 'c'], startRank: 1, format: TIEBREAK_FORMAT.THREE_SIDES },
    ])
  })

  it('un départage à trois côtés validé tranche l égalité concernée', () => {
    const cycle = [duel('a', 5, 'b', 3), duel('b', 5, 'c', 3), duel('c', 5, 'a', 3)]
    const standing = computePoolStanding(['a', 'b', 'c'], [...cycle, tiebreak(['a', 2], ['b', 3], ['c', 1])])
    expect(ranks(standing)).toEqual(['1:b', '2:a', '3:c'])
    expect(standing.requiresTiebreak).toEqual([])
  })

  it('départage à trois dont les deux derniers sont ex aequo : il reste un 1v1 à jouer', () => {
    const cycle = [duel('a', 5, 'b', 3), duel('b', 5, 'c', 3), duel('c', 5, 'a', 3)]
    const standing = computePoolStanding(['a', 'b', 'c'], [...cycle, tiebreak(['a', 1], ['b', 3], ['c', 1])])
    expect(ranks(standing)).toEqual(['1:b', '2:a', '2:c'])
    expect(standing.requiresTiebreak).toEqual([
      { playerIds: ['a', 'c'], startRank: 2, format: TIEBREAK_FORMAT.ONE_VS_ONE },
    ])
    const resolved = computePoolStanding(
      ['a', 'b', 'c'],
      [...cycle, tiebreak(['a', 1], ['b', 3], ['c', 1]), tiebreak(['c', 5], ['a', 4])],
    )
    expect(ranks(resolved)).toEqual(['1:b', '2:c', '3:a'])
  })

  it('deux joueurs qui ne se sont pas rencontrés restent à égalité (1v1), à quatre : Je ne sais pas', () => {
    expect(computePoolStanding(['a', 'b'], []).requiresTiebreak).toEqual([
      { playerIds: ['a', 'b'], startRank: 1, format: TIEBREAK_FORMAT.ONE_VS_ONE },
    ])
    expect(computePoolStanding(['a', 'b', 'c', 'd'], []).requiresTiebreak[0]!.format).toBe(
      TIEBREAK_FORMAT.UNDEFINED,
    )
  })

  it('ignore les matchs non validés, les matchs hors poule et les départages non concernés', () => {
    const standing = computePoolStanding(
      ['a', 'b'],
      [
        duel('a', 5, 'b', 0, { status: MATCH_STATUS.RECORDED }),
        duel('a', 5, 'zz', 0),
        duel('b', 5, 'a', 1),
      ],
    )
    expect(ranks(standing)).toEqual(['1:b', '2:a'])
    // un départage à trois ne s applique pas à un groupe de deux
    const tied = computePoolStanding(['a', 'b'], [tiebreak(['a', 3], ['b', 1], ['c', 0])])
    expect(tied.requiresTiebreak).toHaveLength(1)
  })
})

describe('tiebreak.util', () => {
  it('format selon le nombre de joueurs', () => {
    expect(tiebreakFormatFor(2)).toBe(TIEBREAK_FORMAT.ONE_VS_ONE)
    expect(tiebreakFormatFor(3)).toBe(TIEBREAK_FORMAT.THREE_SIDES)
    expect(tiebreakFormatFor(4)).toBe(TIEBREAK_FORMAT.UNDEFINED)
  })

  it('un départage aux scores tous égaux ne tranche rien (pas de boucle)', () => {
    expect(resolveTiedGroup(['a', 'b'], [tiebreak(['a', 2], ['b', 2])])).toEqual([['a', 'b']])
  })
})

describe('RG15, RG19 sur le classeur : toutes les poules entièrement renseignées', () => {
  it('chaque poule complète a n(n-1)/2 matchs et un classement monotone', () => {
    const pools = new Map<string, { players: Set<string>; matches: ReturnType<typeof duel>[] }>()
    for (const { values } of sheetRows('scores')) {
      const [id, label, first, firstScore, second, secondScore] = values
      if (!/^Poule\d$/.test(String(label)) || typeof firstScore !== 'number' || typeof secondScore !== 'number') continue
      const key = `${String(id).split('-')[0]}/${label}`
      const pool = pools.get(key) ?? { players: new Set<string>(), matches: [] }
      pool.players.add(String(first))
      pool.players.add(String(second))
      pool.matches.push(duel(String(first), firstScore, String(second), secondScore))
      pools.set(key, pool)
    }
    let complete = 0
    for (const [key, pool] of pools) {
      const players = [...pool.players]
      if (pool.matches.length !== generateRoundRobin(players).length) continue
      complete += 1
      const standing = computePoolStanding(players, pool.matches)
      expect(standing.entries, key).toHaveLength(players.length)
      expect(standing.entries.reduce((sum, e) => sum + e.wins, 0), key).toBe(pool.matches.length)
      for (let i = 1; i < standing.entries.length; i++) {
        expect(standing.entries[i - 1]!.wins, key).toBeGreaterThanOrEqual(standing.entries[i]!.wins)
        expect(standing.entries[i - 1]!.rank, key).toBeLessThanOrEqual(standing.entries[i]!.rank)
      }
    }
    expect(complete).toBeGreaterThan(20)
  })
})

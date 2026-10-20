import { describe, expect, it } from 'vitest'
import { TIEBREAK_FORMAT } from '../../../server/enums/domain.enum'
import type { IPoolStanding } from '../../../server/interfaces/pool.interface'
import { selectQualifiers } from '../../../server/utils/pool/qualification.util'
import { tiebreak } from './match.factory'

/** [playerId, wins, played, capsAverage] dans l ordre du classement. */
function pool(...rows: [string, number, number, number][]): IPoolStanding {
  return {
    entries: rows.map(([playerId, wins, played, capsAverage], index) => ({
      playerId,
      rank: index + 1,
      played,
      wins,
      losses: played - wins,
      pointsFor: 0,
      pointsAgainst: 0,
      capsAverage,
    })),
    requiresTiebreak: [],
  }
}

describe('RG18, RG20, A10 : sélection des qualifiés', () => {
  it('les n premiers de chaque poule, puis les m meilleurs (n+1)èmes', () => {
    const p1 = pool(['a1', 5, 5, 20], ['a2', 4, 5, 10], ['a3', 2, 5, 0])
    const p2 = pool(['b1', 6, 6, 25], ['b2', 5, 6, 15], ['b3', 3, 6, 1])
    const result = selectQualifiers([p1, p2], 2, 1)
    expect(result.topQualifiers).toEqual(['a1', 'a2', 'b1', 'b2'])
    // 2/5 = 0,40 contre 3/6 = 0,50
    expect(result.bestNextQualifiers).toEqual(['b3'])
    expect(result.requiresTiebreak).toEqual([])
  })

  it('poule de 6 contre poule de 7 : ratio de victoires, puis cap s average par match', () => {
    const six = pool(['s1', 5, 5, 20], ['s2', 3, 5, 3], ['s3', 0, 5, -4])
    const seven = pool(['t1', 6, 6, 20], ['t2', 4, 6, 3], ['t3', 0, 6, -4])
    // ratios égaux (0), cap's average par match : -0,8 contre -0,667 -> la poule de 7 passe,
    // alors que l écart brut (-4 contre -4) est nul
    expect(selectQualifiers([six, seven], 2, 1).bestNextQualifiers).toEqual(['t3'])
    expect(selectQualifiers([seven, six], 2, 1).bestNextQualifiers).toEqual(['t3'])
  })

  it('le ratio prime sur le cap s average', () => {
    const six = pool(['s1', 5, 5, 20], ['s2', 4, 5, 3], ['s3', 3, 5, -9])
    const seven = pool(['t1', 6, 6, 20], ['t2', 5, 6, 3], ['t3', 2, 6, 99])
    expect(selectQualifiers([six, seven], 2, 1).bestNextQualifiers).toEqual(['s3'])
  })

  it('une égalité à la frontière renvoie requiresTiebreak (2 puis 3 joueurs)', () => {
    const p = (id: string) => pool(['x1', 5, 5, 20], [id, 1, 5, 0])
    const two = selectQualifiers([p('a'), p('b'), pool(['y1', 5, 5, 20], ['c', 0, 5, 0])], 1, 1)
    expect(two.bestNextQualifiers).toEqual([])
    expect(two.requiresTiebreak).toEqual([
      { playerIds: ['a', 'b'], startRank: 1, format: TIEBREAK_FORMAT.ONE_VS_ONE },
    ])
    expect(two.tiebreakSlots).toBe(1)

    const three = selectQualifiers([p('a'), p('b'), p('c')], 1, 1)
    expect(three.requiresTiebreak[0]!.format).toBe(TIEBREAK_FORMAT.MULTI_SIDES)
    const four = selectQualifiers([p('a'), p('b'), p('c'), p('d')], 1, 2)
    expect(four.requiresTiebreak[0]!.format).toBe(TIEBREAK_FORMAT.MULTI_SIDES)
    expect(four.tiebreakSlots).toBe(2)
  })

  it('les meilleurs déjà sûrs sont conservés devant une égalité à la frontière', () => {
    const strong = pool(['x1', 5, 5, 20], ['best', 3, 5, 5])
    const p = (id: string) => pool(['z1', 5, 5, 20], [id, 1, 5, 0])
    const result = selectQualifiers([strong, p('a'), p('b')], 1, 2)
    expect(result.bestNextQualifiers).toEqual(['best'])
    expect(result.requiresTiebreak[0]!.playerIds).toEqual(['a', 'b'])
    expect(result.requiresTiebreak[0]!.startRank).toBe(2)
    expect(result.tiebreakSlots).toBe(1)
  })

  it('un départage validé referme l égalité', () => {
    const p = (id: string) => pool(['x1', 5, 5, 20], [id, 1, 5, 0])
    const result = selectQualifiers([p('a'), p('b')], 1, 1, [tiebreak(['a', 3], ['b', 5])])
    expect(result.bestNextQualifiers).toEqual(['b'])
    expect(result.requiresTiebreak).toEqual([])
  })

  it('une égalité entièrement dans les places pourvues ne demande aucun départage', () => {
    const p = (id: string) => pool(['x1', 5, 5, 20], [id, 1, 5, 0])
    const result = selectQualifiers([p('a'), p('b')], 1, 2)
    expect(result.bestNextQualifiers).toEqual(['a', 'b'])
    expect(result.requiresTiebreak).toEqual([])
  })

  it('moins de places que de candidats : on ne dépasse pas m', () => {
    const p = (id: string, wins: number) => pool(['x1', 5, 5, 20], [id, wins, 5, 0])
    const result = selectQualifiers([p('a', 3), p('b', 2), p('c', 1)], 1, 1)
    expect(result.bestNextQualifiers).toEqual(['a'])
  })

  it('une poule sans (n+1)ème ne fournit pas de candidat', () => {
    const result = selectQualifiers([pool(['x1', 1, 1, 5]), pool(['y1', 1, 1, 5], ['y2', 0, 1, -5])], 1, 1)
    expect(result.bestNextQualifiers).toEqual(['y2'])
  })

  it('m = 0 : personne au titre des meilleurs', () => {
    expect(selectQualifiers([pool(['x1', 1, 1, 5], ['x2', 0, 1, -5])], 1, 0).bestNextQualifiers).toEqual([])
  })

  it('une égalité INTERNE à une poule sur la place (n+1) bloque la sélection', () => {
    const tied: IPoolStanding = {
      ...pool(['a1', 3, 4, 5], ['a2', 1, 4, 0], ['a3', 1, 4, 0]),
      requiresTiebreak: [{ playerIds: ['a2', 'a3'], startRank: 2, format: TIEBREAK_FORMAT.ONE_VS_ONE }],
    }
    const result = selectQualifiers([tied], 2, 1)
    expect(result.topQualifiers).toEqual([])
    expect(result.requiresTiebreak).toEqual(tied.requiresTiebreak)
    // la même égalité plus bas dans le classement n est pas concernée
    expect(selectQualifiers([tied], 3, 1).requiresTiebreak).toEqual([])
  })
})

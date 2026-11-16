import { describe, expect, it } from 'vitest'
import { ROUND_KIND_BY_POOL_SIZE } from '../../src/consts/qualification.const'
import { ROUND_KIND } from '../../src/enums/round.enum'
import { checkRoundDrawAssignments } from '../../src/utils/qualification-plan.util'
import { drawPoolAssignments, drawRoundAssignments, secureRandomInt, shuffle } from '../../src/utils/random-draw.util'
import type { TRandomInt } from '../../src/types/random-draw.type'

/** Générateur déterministe (mulberry32) : les tests ne dépendent pas du hasard. */
const seeded = (seed: number): TRandomInt => {
  let state = seed
  return (max) => {
    state = (state + 0x6D2B79F5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return Math.floor((((t ^ (t >>> 14)) >>> 0) / 4294967296) * max)
  }
}

const ids = (count: number, prefix = 'p') => Array.from({ length: count }, (_, index) => `${prefix}${index + 1}`)

describe('shuffle (Fisher-Yates)', () => {
  it('returns a permutation and leaves its input untouched', () => {
    const input = ids(20)
    const copy = [...input]
    const result = shuffle(input, seeded(1))
    expect(input).toEqual(copy)
    expect([...result].sort()).toEqual([...input].sort())
  })

  it('is driven by the injected generator only (fixed generator, fixed result)', () => {
    expect(shuffle(ids(10), seeded(7))).toEqual(shuffle(ids(10), seeded(7)))
    expect(shuffle(ids(10), seeded(7))).not.toEqual(shuffle(ids(10), seeded(8)))
  })

  it('is unbiased: each of the 6 orderings of 3 items appears about 1/6 of the time', () => {
    const runs = 60000
    const random = seeded(42)
    const counts = new Map<string, number>()
    for (let run = 0; run < runs; run += 1) {
      const key = shuffle(['a', 'b', 'c'], random).join('')
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
    expect(counts.size).toBe(6)
    for (const count of counts.values()) {
      // attendu 10000 par ordre ; écart-type ~91 : la tolérance de 5 % est à plus de 5 sigmas.
      expect(Math.abs(count - runs / 6)).toBeLessThan(500)
    }
  })

  it('draws the production generator inside its bounds', () => {
    for (let run = 0; run < 1000; run += 1) {
      const value = secureRandomInt(7)
      expect(Number.isInteger(value) && value >= 0 && value < 7).toBe(true)
    }
  })
})

describe('drawPoolAssignments (RG11, RG16)', () => {
  const cases = [
    { poolCount: 2, total: 6 },
    { poolCount: 4, total: 23 },
    { poolCount: 10, total: 65 },
    { poolCount: 5, total: 5 }
  ]

  it.each(cases)('keeps RG11 and RG16 over 500 draws ($poolCount pools, $total players)', ({ poolCount, total }) => {
    const random = seeded(poolCount * 100 + total)
    const seedIds = ids(poolCount, 's')
    const otherIds = ids(total - poolCount, 'o')
    for (let run = 0; run < 500; run += 1) {
      const drawn = drawPoolAssignments({ seedIds, otherIds, poolCount }, random)
      expect(drawn.map((a) => a.participationId).sort()).toEqual([...seedIds, ...otherIds].sort())
      expect(new Set(drawn.map((a) => a.drawnOrder)).size).toBe(total)
      // RG11 : les têtes de série (drawnOrder <= poolCount) sont dans des poules deux à deux différentes.
      const seeds = drawn.filter((a) => a.drawnOrder <= poolCount)
      expect(seeds.map((a) => a.participationId).sort()).toEqual([...seedIds].sort())
      expect(new Set(seeds.map((a) => a.poolNumber)).size).toBe(poolCount)
      // RG16 : au plus un joueur d'écart, les plus grandes poules d'abord.
      const sizes = Array.from({ length: poolCount }, (_, index) => drawn.filter((a) => a.poolNumber === index + 1).length)
      expect(Math.max(...sizes) - Math.min(...sizes)).toBeLessThanOrEqual(1)
      expect([...sizes].sort((a, b) => b - a)).toEqual(sizes)
      // « poule après poule » : le drawnOrder des autres croît avec le numéro de poule.
      const others = drawn.filter((a) => a.drawnOrder > poolCount).sort((a, b) => a.drawnOrder - b.drawnOrder)
      expect(others.map((a) => a.poolNumber)).toEqual([...others.map((a) => a.poolNumber)].sort((a, b) => a - b))
    }
  })

  it('places each seed in every pool about equally often', () => {
    const random = seeded(5)
    const runs = 20000
    const counts = [0, 0, 0, 0]
    for (let run = 0; run < runs; run += 1) {
      const drawn = drawPoolAssignments({ seedIds: ids(4, 's'), otherIds: ids(8, 'o'), poolCount: 4 }, random)
      counts[drawn.find((a) => a.participationId === 's1')!.poolNumber - 1]! += 1
    }
    for (const count of counts) {
      expect(Math.abs(count - runs / 4)).toBeLessThan(400)
    }
  })

  it('places a non-seed in every pool about equally often when sizes are equal', () => {
    const random = seeded(6)
    const runs = 20000
    const counts = [0, 0, 0, 0]
    for (let run = 0; run < runs; run += 1) {
      const drawn = drawPoolAssignments({ seedIds: ids(4, 's'), otherIds: ids(8, 'o'), poolCount: 4 }, random)
      counts[drawn.find((a) => a.participationId === 'o1')!.poolNumber - 1]! += 1
    }
    for (const count of counts) {
      expect(Math.abs(count - runs / 4)).toBeLessThan(400)
    }
  })
})

describe('drawRoundAssignments (RG13, RG14)', () => {
  it.each([2, 4, 8, 16])('forms %i complete pairings that pass the manual-entry check, over 200 draws', (size) => {
    const random = seeded(size)
    const pool = ids(size)
    for (let run = 0; run < 200; run += 1) {
      const drawn = drawRoundAssignments(pool, random)
      expect(checkRoundDrawAssignments({
        assignments: drawn, candidateIds: pool, roundKind: ROUND_KIND_BY_POOL_SIZE[size]!, poolWinnerIds: [], complete: true
      })).toBeNull()
    }
  })

  it('mixes direct qualifiers and playoff winners: every one of them can meet every other (RG14)', () => {
    const random = seeded(3)
    const pool = ids(8)
    const met = new Set<string>()
    for (let run = 0; run < 2000; run += 1) {
      const drawn = drawRoundAssignments(pool, random)
      for (let pairing = 1; pairing <= 4; pairing += 1) {
        const pair = drawn.filter((a) => a.pairingIndex === pairing).map((a) => a.participationId).sort()
        met.add(pair.join('-'))
      }
    }
    expect(met.size).toBe(28)
  })

  it('leaves an odd pool with an incomplete pairing, which the complete check refuses', () => {
    const pool = ids(5)
    const drawn = drawRoundAssignments(pool, seeded(9))
    expect(checkRoundDrawAssignments({ assignments: drawn, candidateIds: pool, roundKind: ROUND_KIND.PLAYOFF, poolWinnerIds: [], complete: true }))
      .toBe('Every pairing must have two players, numbered from 1')
  })
})

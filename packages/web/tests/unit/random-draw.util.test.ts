import { describe, expect, it } from 'vitest'
import { ROUND_KIND_BY_POOL_SIZE } from '../../src/consts/qualification.const'
import type { TRandomInt } from '../../src/types/random-draw.type'
import { poolSizes } from '../../src/utils/pool-size.util'
import { checkRoundDrawAssignments } from '../../src/utils/qualification-plan.util'
import { drawPoolStep, drawRoundStep, pickRandom, secureRandomInt } from '../../src/utils/random-draw.util'

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

/** Rejoue tous les clics d'un tirage de poules : têtes de série déjà placées (une par poule), puis une étape par joueur. */
const playPools = (poolCount: number, total: number, random: TRandomInt) => {
  const sizes = poolSizes(total, poolCount)
  const filled = Array.from({ length: poolCount }, () => 1)
  const placed = ids(poolCount, 's').map((participationId, index) => ({ participationId, poolNumber: index + 1 }))
  let remainingIds = ids(total - poolCount, 'o')
  while (remainingIds.length > 0) {
    const step = drawPoolStep({ sizes, filled, remainingIds }, random)!
    placed.push(step)
    filled[step.poolNumber - 1]! += 1
    remainingIds = remainingIds.filter((id) => id !== step.participationId)
  }
  return { placed, sizes }
}

describe('pickRandom', () => {
  it('uses the injected generator only', () => {
    expect(pickRandom(ids(10), seeded(7))).toBe(pickRandom(ids(10), seeded(7)))
  })

  it('is unbiased: each of 5 items is picked about 1/5 of the time', () => {
    const runs = 50000
    const random = seeded(42)
    const counts = new Map<string, number>()
    for (let run = 0; run < runs; run += 1) {
      const picked = pickRandom(ids(5), random)
      counts.set(picked, (counts.get(picked) ?? 0) + 1)
    }
    expect(counts.size).toBe(5)
    for (const count of counts.values()) {
      // attendu 10000 ; écart-type ~90 : la tolérance est à plus de 5 sigmas.
      expect(Math.abs(count - runs / 5)).toBeLessThan(500)
    }
  })

  it('draws the production generator inside its bounds', () => {
    for (let run = 0; run < 1000; run += 1) {
      const value = secureRandomInt(7)
      expect(Number.isInteger(value) && value >= 0 && value < 7).toBe(true)
    }
  })
})

describe('drawPoolStep (RG11, RG16)', () => {
  it.each([
    { poolCount: 2, total: 6 },
    { poolCount: 4, total: 23 },
    { poolCount: 10, total: 65 },
    { poolCount: 5, total: 5 }
  ])('keeps RG11 and RG16 over 300 full draws ($poolCount pools, $total players)', ({ poolCount, total }) => {
    const random = seeded(poolCount * 100 + total)
    for (let run = 0; run < 300; run += 1) {
      const { placed, sizes } = playPools(poolCount, total, random)
      expect(placed.map((entry) => entry.participationId).sort()).toEqual([...ids(poolCount, 's'), ...ids(total - poolCount, 'o')].sort())
      // RG16 : tailles exactes, plus grandes poules d'abord ; RG11 : une tête de série par poule.
      expect(Array.from({ length: poolCount }, (_, index) => placed.filter((entry) => entry.poolNumber === index + 1).length)).toEqual(sizes)
      expect(placed.filter((entry) => entry.participationId.startsWith('s')).map((entry) => entry.poolNumber).sort((a, b) => a - b)).toEqual(ids(poolCount).map((_id, index) => index + 1))
      // « poule après poule » : l'ordre de tirage des autres suit le numéro de poule.
      const others = placed.filter((entry) => entry.participationId.startsWith('o')).map((entry) => entry.poolNumber)
      expect(others).toEqual([...others].sort((a, b) => a - b))
    }
  })

  it('returns null when every pool is full', () => {
    expect(drawPoolStep({ sizes: [2, 2], filled: [2, 2], remainingIds: ['a'] }, seeded(1))).toBeNull()
  })

  it('puts a given player in each pool of the same size about equally often', () => {
    const random = seeded(6)
    const runs = 20000
    const counts = [0, 0, 0, 0]
    for (let run = 0; run < runs; run += 1) {
      const { placed } = playPools(4, 12, random)
      counts[placed.find((entry) => entry.participationId === 'o1')!.poolNumber - 1]! += 1
    }
    for (const count of counts) {
      expect(Math.abs(count - runs / 4)).toBeLessThan(400)
    }
  })
})

describe('drawRoundStep (RG13, RG14)', () => {
  it.each([2, 4, 8, 16])('plays a whole round of %i players affiche by affiche and passes the manual-entry check', (size) => {
    const random = seeded(size)
    const pool = ids(size)
    for (let run = 0; run < 200; run += 1) {
      let remaining = pool
      const assignments: Array<{ participationId: string, pairingIndex: number, sidePosition: 1 | 2, drawnOrder: number }> = []
      while (remaining.length > 0) {
        const [first, second] = drawRoundStep(remaining, 2, random)
        const pairingIndex = assignments.length / 2 + 1
        assignments.push({ participationId: first!, pairingIndex, sidePosition: 1, drawnOrder: assignments.length + 1 })
        assignments.push({ participationId: second!, pairingIndex, sidePosition: 2, drawnOrder: assignments.length + 1 })
        expect(first).not.toBe(second)
        remaining = remaining.filter((id) => id !== first && id !== second)
      }
      expect(checkRoundDrawAssignments({
        assignments, candidateIds: pool, roundKind: ROUND_KIND_BY_POOL_SIZE[size]!, poolWinnerIds: [], complete: true
      })).toBeNull()
    }
  })

  it('draws one player to complete a half affiche', () => {
    expect(drawRoundStep(['a', 'b', 'c'], 1, seeded(2))).toHaveLength(1)
  })

  it('is pure chance: every one of 8 players meets every other (28 distinct affiches)', () => {
    const random = seeded(3)
    const met = new Set<string>()
    for (let run = 0; run < 3000; run += 1) {
      met.add(drawRoundStep(ids(8), 2, random).sort().join('-'))
    }
    expect(met.size).toBe(28)
  })

  it('is unbiased on the first slot of an affiche', () => {
    const random = seeded(11)
    const runs = 40000
    const counts = new Map<string, number>()
    for (let run = 0; run < runs; run += 1) {
      const [first] = drawRoundStep(ids(4), 2, random)
      counts.set(first!, (counts.get(first!) ?? 0) + 1)
    }
    for (const count of counts.values()) {
      expect(Math.abs(count - runs / 4)).toBeLessThan(500)
    }
  })
})

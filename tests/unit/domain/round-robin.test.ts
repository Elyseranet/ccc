import { describe, expect, it } from 'vitest'
import { generateRoundRobin } from '../../../src/utils/round-robin.util'

const ids = (n: number) => Array.from({ length: n }, (_, i) => `p${i + 1}`)

describe('RG15 : round-robin', () => {
  it.each([
    [5, 10],
    [6, 15],
    [7, 21],
    [8, 28],
  ])('%i joueurs -> %i matchs', (players, matches) => {
    const pairs = generateRoundRobin(ids(players))
    expect(pairs).toHaveLength(matches)
    expect(pairs).toHaveLength((players * (players - 1)) / 2)
  })

  it('chaque paire se rencontre exactement une fois, personne ne joue contre lui-même', () => {
    const pairs = generateRoundRobin(ids(6))
    const keys = pairs.map(([a, b]) => [a, b].sort().join('|'))
    expect(new Set(keys).size).toBe(pairs.length)
    expect(pairs.every(([a, b]) => a !== b)).toBe(true)
  })

  it('cas limites : moins de deux joueurs, aucun match', () => {
    expect(generateRoundRobin([])).toEqual([])
    expect(generateRoundRobin(['solo'])).toEqual([])
  })

  it('refuse un doublon', () => {
    expect(() => generateRoundRobin(['a', 'b', 'a'])).toThrow()
  })
})

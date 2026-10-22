import 'reflect-metadata'
import type { DataSource } from 'typeorm'
import { afterAll, describe, expect, it } from 'vitest'
import { computePoolStanding } from '../../src/utils/standing.util'
import { generateRoundRobin } from '../../src/utils/round-robin.util'
import { duel } from '../unit/domain/match.factory'
import { seedArchives } from './helpers/archives'
import { cleanup, resetSchema } from './helpers/test-database'
import { loadArchivesWorkbook, sheetRows } from './helpers/archives-workbook'

// Chargement au niveau du module (await de premier niveau) : les blocs `describe` lisent le classeur dès la
// collecte, avant tout `beforeAll`.
const dataSource: DataSource = await resetSchema()
await seedArchives(dataSource)
await loadArchivesWorkbook(dataSource)

afterAll(async () => {
  await cleanup()
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

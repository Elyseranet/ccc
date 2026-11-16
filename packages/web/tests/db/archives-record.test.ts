import 'reflect-metadata'
import type { DataSource } from 'typeorm'
import { afterAll, describe, expect, it } from 'vitest'
import {
  computeHeadToHead,
  computePlayerBalance,
  computeWinLoss,
} from '../../src/utils/record.util'
import { MATCH_STATUS } from '../../src/enums/match.enum'
import { duel } from '../unit/domain/match.factory'
import { seedArchives } from './helpers/archives'
import { cleanup, resetSchema } from './helpers/test-database'
import { loadArchivesWorkbook, sheetRows, workbookMatches, workbookUnknownResultPairs } from './helpers/archives-workbook'

// Chargement au niveau du module (await de premier niveau) : les blocs `describe` lisent le classeur dès la
// collecte, avant tout `beforeAll`.
const dataSource: DataSource = await resetSchema()
await seedArchives(dataSource)
await loadArchivesWorkbook(dataSource)

afterAll(async () => {
  await cleanup()
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

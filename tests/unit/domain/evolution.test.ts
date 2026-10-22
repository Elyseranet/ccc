import { describe, expect, it } from 'vitest'
import { computeEvolution } from '../../../src/server/utils/ranking/evolution.util'
import { EDITION_STATUS } from '../../../src/enums/edition.enum'
import { dataSheet, sheetRows, workbookEditions, workbookParticipations } from './workbook.fixture'

describe('RG8 : évolution (jeu synthétique)', () => {
  const editions = [1, 2, 3].map((rank) => ({
    id: `e${rank}`,
    chronologicalRank: rank,
    status: EDITION_STATUS.CLOSED,
  }))
  const participations = [
    { playerId: 'ann', editionId: 'e1', points: 5 },
    { playerId: 'bob', editionId: 'e2', points: 8 },
    { playerId: 'ann', editionId: 'e3', points: 1 },
  ]

  it('un joueur apparaît dès sa première participation, dans l ordre chronologique', () => {
    const evolution = computeEvolution(participations, [...editions].reverse())
    expect(evolution.map((e) => e.editionId)).toEqual(['e1', 'e2', 'e3'])
    expect(evolution[0]!.entries).toEqual([
      { playerId: 'ann', acp: 5, allTime: 5, acpRank: 1, allTimeRank: 1 },
    ])
    expect(evolution[1]!.entries.map((e) => e.playerId)).toEqual(['bob', 'ann'])
    expect(evolution[2]!.entries).toEqual([
      { playerId: 'bob', acp: 8, allTime: 8, acpRank: 1, allTimeRank: 1 },
      { playerId: 'ann', acp: 6, allTime: 6, acpRank: 2, allTimeRank: 2 },
    ])
  })

  it('applique la fenêtre ACP et ignore les éditions non clôturées', () => {
    const open = [...editions, { id: 'e4', chronologicalRank: 4, status: EDITION_STATUS.POOLS_PLAYING }]
    const evolution = computeEvolution([...participations, { playerId: 'ann', editionId: 'e4', points: 9 }], open, 2)
    expect(evolution).toHaveLength(3)
    // fenêtre de 2 à e3 : e2 + e3 -> ann = 1, bob = 8
    expect(evolution[2]!.entries.find((e) => e.playerId === 'ann')).toMatchObject({ acp: 1, allTime: 6 })
  })
})

describe('RG8 sur le classeur (onglets évo ACP et évo All Time)', () => {
  const evolution = computeEvolution(workbookParticipations(), workbookEditions())
  const { players } = dataSheet()

  const check = (sheetName: string, key: 'acp' | 'allTime'): number => {
    let compared = 0
    for (const { values } of sheetRows(sheetName)) {
      const name = values[1]
      if (typeof name !== 'string' || !players.some((p) => p.name === name)) continue
      evolution.forEach((step, index) => {
        const expected = Number(values[2 + index]) || 0
        const entry = step.entries.find((e) => e.playerId === name)
        expect(entry?.[key] ?? 0, `${sheetName} ${name} #${index}`).toBeCloseTo(expected, 9)
        compared += 1
      })
    }
    return compared
  }

  it('reproduit l évolution ACP de chaque joueur après chaque édition', () => {
    expect(check('évo ACP', 'acp')).toBeGreaterThan(2000)
  })

  it('reproduit l évolution All Time de chaque joueur après chaque édition', () => {
    expect(check('évo All Time', 'allTime')).toBeGreaterThan(2000)
  })
})

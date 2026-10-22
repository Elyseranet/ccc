import { describe, expect, it } from 'vitest'
import { EDITION_STATUS } from '../../../src/enums/edition.enum'
import { MATCH_PURPOSE } from '../../../src/enums/match.enum'
import { LEGACY_VERIFICATION_METRIC } from '../../../src/enums/legacy-import.enum'
import type { IRankingEdition } from '../../../src/server/interfaces/ranking.interface'
import type { IMatchRecord } from '../../../src/server/interfaces/stats.interface'
import { verifyAgainstWorkbook } from '../../../src/server/utils/legacy/legacy-verification.util'
import { buildPlan } from './legacy-import.fixture'

/** Reconstitue, sans base, les entrées que l importeur relit en base (clé du compétiteur = id). */
const verification = () => {
  const plan = buildPlan()
  const editions: IRankingEdition[] = plan.editions.map((edition) => ({
    id: edition.code,
    chronologicalRank: edition.chronologicalRank,
    status: EDITION_STATUS.CLOSED,
  }))
  const matches: IMatchRecord[] = plan.matches.map((match) => ({
    status: match.status,
    purpose: MATCH_PURPOSE.REGULAR,
    sides: match.sides.map((side) => ({ playerId: side.competitorKey, score: side.score ?? 0 })),
  }))
  const result = verifyAgainstWorkbook({
    players: plan.players,
    mergedPlayerNames: plan.mergedPlayerNames,
    nameByPlayerId: new Map(plan.players.map((player) => [player.name, player.name])),
    editions,
    scored: plan.participations.flatMap((entry) =>
      entry.points === null
        ? []
        : [{ playerId: entry.competitorKey, editionId: entry.editionCode, points: entry.points }],
    ),
    staged: plan.participations.flatMap((entry) =>
      entry.finalStage === null
        ? []
        : [{ playerId: entry.competitorKey, editionId: entry.editionCode, finalStage: entry.finalStage }],
    ),
    matches,
    playersOutsideWorkbook: ['Marion Cobra'],
  })
  return { plan, result }
}

describe('verifyAgainstWorkbook sur le plan de reprise', () => {
  const { plan, result } = verification()
  const metric = (kind: LEGACY_VERIFICATION_METRIC) => result.metrics.find((entry) => entry.metric === kind)!

  it('All Time et ACP recalculés égalent les colonnes J et D pour les 145 joueurs', () => {
    expect(metric(LEGACY_VERIFICATION_METRIC.ALL_TIME)).toMatchObject({ compared: 145, mismatches: [] })
    expect(metric(LEGACY_VERIFICATION_METRIC.ACP)).toMatchObject({ compared: 145, mismatches: [] })
    expect(metric(LEGACY_VERIFICATION_METRIC.ACP_RANK)).toMatchObject({ compared: 145, mismatches: [] })
  })

  it('participations (RG5) et titres (RG6) égalent les colonnes E et B', () => {
    expect(metric(LEGACY_VERIFICATION_METRIC.PARTICIPATIONS)).toMatchObject({ compared: 145, mismatches: [] })
    expect(metric(LEGACY_VERIFICATION_METRIC.TITLES)).toMatchObject({ compared: 145, mismatches: [] })
  })

  it('le seul écart de rang All Time est l égalité à 8,76 départagée par le flottant du classeur', () => {
    const { mismatches } = metric(LEGACY_VERIFICATION_METRIC.ALL_TIME_RANK)
    expect(mismatches.map((entry) => entry.player)).toEqual(['Damien Brien'])
    expect(mismatches[0]).toMatchObject({ workbook: 28, computed: 27, expected: true })
    expect(mismatches[0]?.note).toContain('flottant')
  })

  it('les seuls écarts de V/D sont ceux des compétiteurs fusionnés par A5, tous listés', () => {
    const { mismatches } = metric(LEGACY_VERIFICATION_METRIC.WIN_LOSS)
    expect(mismatches.length).toBeGreaterThan(0)
    expect(mismatches.every((entry) => entry.expected)).toBe(true)
    const players = new Set(mismatches.map((entry) => entry.player.replace(/ \([VD]\)$/, '')))
    expect([...players].sort()).toEqual([...plan.mergedPlayerNames].sort())
    expect(result.blockingMismatches).toBe(0)
  })

  it('un compétiteur fusionné par la seule casse (Vincent K/vern) n a aucun écart de V/D', () => {
    expect(plan.mergedPlayerNames).not.toContain('Vincent K/vern')
    expect(plan.mergedPlayerNames).not.toContain('Gauthier Richard')
  })

  it('un écart sur les points est bloquant', () => {
    const tampered = verification()
    const player = tampered.plan.players[0]!
    const broken = verifyAgainstWorkbook({
      players: [{ ...player, allTime: player.allTime + 1 }],
      mergedPlayerNames: [],
      nameByPlayerId: new Map([[player.name, player.name]]),
      editions: [],
      scored: [],
      staged: [],
      matches: [],
      playersOutsideWorkbook: [],
    })
    expect(broken.blockingMismatches).toBeGreaterThan(0)
  })
})

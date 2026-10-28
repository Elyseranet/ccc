import { describe, expect, it } from 'vitest'
import { EDITION_MATCH_FILTER } from '../../src/enums/edition-tab.enum'
import { FINAL_STAGE, PARTICIPATION_STATUS } from '../../src/enums/participation.enum'
import { ROUND_KIND } from '../../src/enums/round.enum'
import type { IEditionDetail } from '../../src/interfaces/edition.interface'
import {
  buildEditionBracket,
  buildEditionMatchRows,
  buildEditionPoolTables,
  editionMatchFilterCounts,
  filterEditionMatchRows,
  pageSlice
} from '../../src/utils/edition-view.util'

const person = (id: string, displayName: string) => ({ id, displayName, firstName: null, lastName: null, nickname: null, avatarUrl: null })
const standing = (id: string, rank: number) => ({ participationId: id, competitor: person(`c-${id}`, `Joueur ${id}`), rank, played: 3, wins: 3 - rank, losses: rank, pointsFor: 30, pointsAgainst: 20, capsAverage: 10 })
const side = (id: string, score: number | null) => ({ participationId: id, competitorId: `c-${id}`, displayName: `Joueur ${id}`, score })

const detail = {
  code: '2025',
  participants: [
    { participationId: 'a', finalStage: FINAL_STAGE.QUARTER, status: PARTICIPATION_STATUS.ELIMINATED },
    { participationId: 'b', finalStage: FINAL_STAGE.POOL_ELIMINATED, status: PARTICIPATION_STATUS.ELIMINATED },
    { participationId: 'c', finalStage: null, status: PARTICIPATION_STATUS.QUALIFIED },
    { participationId: 'd', finalStage: null, status: PARTICIPATION_STATUS.ELIMINATED }
  ],
  pools: [
    { id: 'p2', rank: 2, standing: [standing('c', 1), standing('d', 2)] },
    { id: 'p1', rank: 1, standing: [standing('b', 2), standing('a', 1)] }
  ],
  bracket: [
    { kind: ROUND_KIND.FINAL, matches: [{ id: 'f', winnerParticipationId: 'a', sides: [side('a', 10), side('c', 7)] }] },
    { kind: ROUND_KIND.QUARTER, matches: [{ id: 'q', winnerParticipationId: null, sides: [side('a', null), side('b', null)] }] }
  ],
  matches: [
    { id: 'm1', sequence: 1, roundKind: ROUND_KIND.POOLS, poolRank: 1, purpose: 'REGULAR', status: 'VALIDATED', winnerParticipationId: 'b', sides: [side('a', 4), side('b', 10)] },
    { id: 'm2', sequence: 2, roundKind: ROUND_KIND.FINAL, poolRank: null, purpose: 'TIEBREAK', status: 'SCHEDULED', winnerParticipationId: null, sides: [side('a', 3), side('c', 2)] }
  ]
} as unknown as IEditionDetail

describe('Poules (RG19, RG18)', () => {
  const tables = buildEditionPoolTables(detail)

  it('ordonne les poules et les lignes par rang, comme l’API', () => {
    expect(tables.map(table => table.rank)).toEqual([1, 2])
    expect(tables[0]!.rows.map(row => row.participationId)).toEqual(['a', 'b'])
  })

  it('le Q vient des données : étape finale hors élimination en poule, ou statut qualifié sans étape', () => {
    expect(tables[0]!.rows.map(row => row.qualified)).toEqual([true, false])
    expect(tables[1]!.rows.map(row => row.qualified)).toEqual([true, false])
  })
})

describe('Bracket (B-18)', () => {
  const rounds = buildEditionBracket(detail)

  it('ne publie que les tours de l’API, du premier au dernier', () => {
    expect(rounds.map(round => round.kind)).toEqual([ROUND_KIND.QUARTER, ROUND_KIND.FINAL])
  })

  it('marque le vainqueur, jamais quand il n’y en a pas', () => {
    expect(rounds[1]!.matches[0]!.sides.map(entry => entry.isWinner)).toEqual([true, false])
    expect(rounds[0]!.matches[0]!.sides.every(entry => !entry.isWinner)).toBe(true)
  })

  it('une édition sans tableau donne aucun tour', () => {
    expect(buildEditionBracket({ ...detail, bracket: [] } as IEditionDetail)).toEqual([])
  })
})

describe('Matchs (RG24)', () => {
  const rows = buildEditionMatchRows(detail)

  it('numérote {code}-{séquence}, du plus récent au plus ancien', () => {
    expect(rows.map(row => row.number)).toEqual(['2025-2', '2025-1'])
  })

  it('met le vainqueur en premier et ne montre aucun score sans vainqueur', () => {
    expect(rows[1]!.first?.id).toBe('c-b')
    expect(rows[1]!.firstScore).toBe(10)
    expect(rows[0]!.firstScore).toBeNull()
    expect(rows[0]!.hasWinner).toBe(false)
    expect(rows[0]!.isTiebreak).toBe(true)
  })

  it('filtre et compte par phase', () => {
    expect(editionMatchFilterCounts(rows)).toEqual({ all: 2, pools: 1, knockout: 1 })
    expect(filterEditionMatchRows(rows, EDITION_MATCH_FILTER.POOLS)).toHaveLength(1)
    expect(filterEditionMatchRows(rows, EDITION_MATCH_FILTER.KNOCKOUT)[0]!.roundKind).toBe(ROUND_KIND.FINAL)
    expect(filterEditionMatchRows(rows, EDITION_MATCH_FILTER.ALL)).toHaveLength(2)
  })

  it('pagine par 16 et borne la page', () => {
    const items = Array.from({ length: 93 }, (_, index) => index)
    expect(pageSlice(items, 1, 16)).toMatchObject({ pageCount: 6, page: 1 })
    expect(pageSlice(items, 6, 16).items).toHaveLength(13)
    expect(pageSlice(items, 99, 16).page).toBe(6)
    expect(pageSlice([], 3, 16)).toEqual({ items: [], page: 1, pageCount: 1 })
  })
})

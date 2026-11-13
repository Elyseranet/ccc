import { describe, expect, it } from 'vitest'
import { EDITION_MATCH_FILTER } from '../../src/enums/edition-tab.enum'
import { FINAL_STAGE, PARTICIPATION_STATUS } from '../../src/enums/participation.enum'
import { ROUND_KIND } from '../../src/enums/round.enum'
import type { IEditionDetail } from '../../src/interfaces/edition.interface'
import {
  buildEditionBracket,
  buildEditionMatchRows,
  buildEditionReconstitutedDraws,
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

describe('Matchs : départage à 3 côtés ou plus (F-21)', () => {
  const multi = {
    ...detail,
    matches: [
      { id: 'm3', sequence: 7, roundKind: ROUND_KIND.POOLS, poolRank: 5, purpose: 'TIEBREAK', status: 'VALIDATED', winnerParticipationId: 'b', sides: [side('a', 1), side('b', 3), side('c', 0)] },
      { id: 'm4', sequence: 6, roundKind: ROUND_KIND.POOLS, poolRank: null, purpose: 'TIEBREAK', status: 'SCHEDULED', winnerParticipationId: null, sides: [side('a', null), side('b', null), side('c', null), side('d', null)] },
      { id: 'm2', sequence: 5, roundKind: ROUND_KIND.POOLS, poolRank: 1, purpose: 'REGULAR', status: 'VALIDATED', winnerParticipationId: 'b', sides: [side('a', 4), side('b', 10)] }
    ]
  } as unknown as IEditionDetail
  const [three, four, duel] = buildEditionMatchRows(multi)

  it('un match à 3 côtés garde les trois joueurs, le vainqueur en premier, puis les autres dans l’ordre du match', () => {
    expect(three!.first?.id).toBe('c-b')
    expect(three!.others.map(person => person.id)).toEqual(['c-a', 'c-c'])
    expect([three!.firstScore, ...three!.otherScores]).toEqual([3, 1, 0])
    expect(three!.scoreText).toBe('3 – 1 – 0')
  })

  it('sans vainqueur, aucun des quatre côtés ne montre de score, mais tous sont listés', () => {
    expect(four!.others).toHaveLength(3)
    expect(four!.otherScores).toEqual([null, null, null])
    expect(four!.hasWinner).toBe(false)
    expect(four!.scoreText).toBeNull()
  })

  it('un duel garde un seul adversaire', () => {
    expect(duel!.others.map(person => person.id)).toEqual(['c-a'])
    expect(duel!.otherScores).toEqual([4])
    expect(duel!.scoreText).toBe('10 – 4')
  })
})

describe('Match d’archive sans score : lignes et tableau (B-21, F-34)', () => {
  const archived = {
    ...detail,
    bracket: [{ kind: ROUND_KIND.QUARTER, matches: [{ id: 'qa', status: 'VALIDATED', winnerParticipationId: 'a', sides: [side('a', null), side('b', null)] }] }],
    matches: [
      { id: 'ma', sequence: 5, roundKind: ROUND_KIND.QUARTER, poolRank: null, purpose: 'REGULAR', status: 'VALIDATED', winnerParticipationId: 'a', sides: [side('a', null), side('b', null)] },
      { id: 'mb', sequence: 4, roundKind: ROUND_KIND.POOLS, poolRank: 1, purpose: 'REGULAR', status: 'VALIDATED', winnerParticipationId: 'b', sides: [side('a', 4), side('b', 10)] },
      { id: 'mc', sequence: 3, roundKind: ROUND_KIND.POOLS, poolRank: 1, purpose: 'REGULAR', status: 'RESULT_UNKNOWN', winnerParticipationId: null, sides: [side('a', null), side('b', null)] }
    ]
  } as unknown as IEditionDetail

  it('la ligne porte le vainqueur en premier, sans score, marquée « sans score archivé »', () => {
    const [row] = buildEditionMatchRows(archived)
    expect(row!.first?.id).toBe('c-a')
    expect(row!.hasWinner).toBe(true)
    expect(row!.firstScore).toBeNull()
    expect(row!.winnerWithoutScore).toBe(true)
  })

  it('un match avec score, ou un résultat inconnu d’avant B-21, n’est pas marqué', () => {
    const rows = buildEditionMatchRows(archived)
    expect(rows.map(row => row.winnerWithoutScore)).toEqual([true, false, false])
  })

  it('le tableau marque le match sans score et garde son vainqueur', () => {
    const [round] = buildEditionBracket(archived)
    expect(round!.matches[0]!.winnerWithoutScore).toBe(true)
    expect(round!.matches[0]!.sides.map(entry => entry.isWinner)).toEqual([true, false])
  })

  it('sans le champ vainqueur du contrat B-21 (détail d’avant B-21), rien n’est marqué', () => {
    const before = { ...archived, matches: (archived.matches as unknown as Array<Record<string, unknown>>).map(({ winnerParticipationId: _w, ...rest }) => rest) } as unknown as IEditionDetail
    expect(() => buildEditionMatchRows(before)).not.toThrow()
    expect(buildEditionMatchRows(before).every(row => !row.winnerWithoutScore)).toBe(true)
  })
})

describe('Tirages reconstitués d’une édition sans tirage enregistré (F-35, DRAWS-ARCH)', () => {
  const standingRow = (id: string, name: string) => ({ participationId: id, competitor: { id: `c-${id}`, displayName: name } })
  const match = (id: string, a: string, b: string) => ({ id, winnerParticipationId: a, sides: [side(a, null), side(b, null)] })
  const archived = {
    code: '2024',
    status: 'CLOSED',
    draws: [],
    pools: [
      { id: 'p2', rank: 2, standing: [standingRow('d', 'Zoé Martin'), standingRow('c', 'Camille Morel')] },
      { id: 'p1', rank: 1, standing: [standingRow('b', 'Lou Bernard'), standingRow('a', 'Éloïse Adam')] }
    ],
    bracket: [
      { kind: ROUND_KIND.QUARTER, matches: [match('q1', 'a', 'b'), match('q2', 'c', 'd')] },
      { kind: ROUND_KIND.PLAYOFF, matches: [match('b1', 'e', 'f')] },
      { kind: ROUND_KIND.FINAL, matches: [match('f1', 'a', 'c')] }
    ]
  } as unknown as IEditionDetail

  it('une édition clôturée sans tirage : poules par rang, joueurs par ordre alphabétique, sans rang', () => {
    const result = buildEditionReconstitutedDraws(archived)
    expect(result!.pools.map(pool => pool.rank)).toEqual([1, 2])
    expect(result!.pools[0]!.players.map(player => player.displayName)).toEqual(['Éloïse Adam', 'Lou Bernard'])
    expect(result!.pools[1]!.players.map(player => player.displayName)).toEqual(['Camille Morel', 'Zoé Martin'])
  })

  it('les affiches suivent l’ordre de l’onglet Bracket : barrages avant les quarts, matchs dans l’ordre de l’API', () => {
    const result = buildEditionReconstitutedDraws(archived)
    expect(result!.rounds.map(round => round.kind)).toEqual([ROUND_KIND.PLAYOFF, ROUND_KIND.QUARTER, ROUND_KIND.FINAL])
    expect(result!.rounds[1]!.pairings.map(pairing => pairing.sides.map(entry => entry.id))).toEqual([['c-a', 'c-b'], ['c-c', 'c-d']])
  })

  it('sans barrages, aucun tour de barrages n’est inventé', () => {
    const withoutPlayoff = { ...archived, bracket: (archived.bracket as unknown as Array<{ kind: ROUND_KIND }>).filter(round => round.kind !== ROUND_KIND.PLAYOFF) } as unknown as IEditionDetail
    expect(buildEditionReconstitutedDraws(withoutPlayoff)!.rounds.map(round => round.kind)).toEqual([ROUND_KIND.QUARTER, ROUND_KIND.FINAL])
  })

  it('une édition sans poule garde les affiches et une composition vide', () => {
    const result = buildEditionReconstitutedDraws({ ...archived, pools: [] } as unknown as IEditionDetail)
    expect(result!.pools).toEqual([])
    expect(result!.rounds).toHaveLength(3)
  })

  it('une édition en cours, ou qui a des tirages enregistrés, n’est jamais reconstituée', () => {
    expect(buildEditionReconstitutedDraws({ ...archived, status: 'POOLS_PLAYING' } as unknown as IEditionDetail)).toBeNull()
    expect(buildEditionReconstitutedDraws({ ...archived, draws: [{ id: 'd' }] } as unknown as IEditionDetail)).toBeNull()
  })
})


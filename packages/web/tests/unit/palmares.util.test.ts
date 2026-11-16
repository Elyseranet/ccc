import { describe, expect, it } from 'vitest'
import { PALMARES_TAB } from '../../src/enums/palmares.enum'
import { EDITION_STATUS } from '../../src/enums/edition.enum'
import type { IEditionSummary } from '../../src/interfaces/edition.interface'
import type { IRankingEvolutionSeries, IRankingRow } from '../../src/interfaces/ranking.interface'
import {
  buildMostTitled,
  buildMostTitledLabel,
  buildPalmaresEvolution,
  buildPalmaresScope,
  buildPalmaresTitles,
  buildRankingRows,
  resolvePalmaresTab
} from '../../src/utils/palmares.util'

const person = (id: string, displayName: string, nickname: string | null = null) => ({ id, displayName, firstName: null, lastName: null, nickname, avatarUrl: null })
const edition = (code: string, year: number, overrides: Partial<IEditionSummary> = {}): IEditionSummary => ({
  id: `e-${code}`,
  code,
  year,
  name: null,
  heldOn: null,
  location: null,
  status: EDITION_STATUS.CLOSED,
  origin: 'LEGACY_IMPORT',
  participantCount: 20,
  unidentifiedParticipantCount: 0,
  matchCount: 10,
  scoredMatchCount: 10,
  unknownResultMatchCount: 0,
  champion: { competitor: person('c1', 'Lou Bernard'), titlesToDate: 2 },
  final: { runnerUp: person('c2', 'Inès Perrin'), runnerUpTitlesToDate: 1, score: { champion: 10, runnerUp: 7 } },
  semiFinalists: [],
  ...overrides
}) as IEditionSummary
const row = (rank: number, id: string, points: number, titles: number, participations = 5): IRankingRow => ({ rank, competitor: person(id, `Joueur ${id}`), points, participations, average: points / participations, titles })

describe('onglet du palmarès', () => {
  it('lit ?onglet= et retombe sur ACP', () => {
    expect(resolvePalmaresTab('evolution')).toBe(PALMARES_TAB.EVOLUTION)
    expect(resolvePalmaresTab(['all-time', 'acp'])).toBe(PALMARES_TAB.ALL_TIME)
    expect(resolvePalmaresTab('inconnu')).toBe(PALMARES_TAB.ACP)
    expect(resolvePalmaresTab(undefined)).toBe(PALMARES_TAB.ACP)
  })
})

describe('chronologie des titres', () => {
  const editions = [
    edition('2012a', 2012),
    edition('2012b', 2012),
    edition('2025', 2025),
    edition('2026', 2026, { status: EDITION_STATUS.POOLS_PLAYING, champion: null, final: null, participantCount: null })
  ]
  const titles = buildPalmaresTitles(editions)

  it('la plus récente d’abord, 2012 compte deux éditions (2e avant 1re)', () => {
    expect(titles.map(entry => entry.option.code)).toEqual(['2026', '2025', '2012b', '2012a'])
    expect(titles[2]?.option.ordinal?.fallback).toBe('2e')
    expect(titles[3]?.option.ordinal?.fallback).toBe('1re')
  })

  it('édition courante sans champion : « en cours », aucun champion inventé', () => {
    expect(titles[0]).toMatchObject({ isCurrent: true, champion: null, runnerUp: null, score: null })
  })

  it('les étoiles et le score sont ceux de l’API', () => {
    expect(titles[1]).toMatchObject({ isCurrent: false, champion: { titles: 2 }, runnerUp: { titles: 1 }, score: { champion: 10, runnerUp: 7 } })
  })

  it('finale d’archive sans score : pas de score', () => {
    const [archive] = buildPalmaresTitles([edition('2013', 2013, { final: { runnerUp: person('c2', 'Inès Perrin'), runnerUpTitlesToDate: 0, score: null } })])
    expect(archive?.score).toBeNull()
    expect(archive?.runnerUp?.titles).toBe(0)
  })

  it('une édition close sans champion n’est pas « en cours »', () => {
    const [closed] = buildPalmaresTitles([edition('2014', 2014, { champion: null, final: null })])
    expect(closed).toMatchObject({ isCurrent: false, champion: null })
  })
})

describe('les plus titrés (F-02-TIE)', () => {
  it('un seul détenteur du plus grand nombre de titres', () => {
    const best = buildMostTitled([row(1, 'a', 80, 2), row(2, 'b', 70, 4), row(3, 'c', 60, 3)])
    expect(best).toHaveLength(1)
    expect(best[0]).toMatchObject({ competitor: { id: 'b' }, titles: 4, participations: 5 })
  })

  it('à égalité, tous les joueurs, dans l’ordre de l’API, sans départage inventé', () => {
    const best = buildMostTitled([row(1, 'a', 80, 2), row(2, 'c', 70, 4), row(3, 'b', 60, 4), row(4, 'd', 50, 4)])
    expect(best.map(entry => entry.competitor.id)).toEqual(['c', 'b', 'd'])
    expect(new Set(best.map(entry => entry.titles))).toEqual(new Set([4]))
  })

  it('personne sans titre : aucun plus titré', () => {
    expect(buildMostTitled([row(1, 'a', 80, 0), row(2, 'b', 70, 0)])).toEqual([])
    expect(buildMostTitled([])).toEqual([])
  })

  it('porte le surnom s’il existe', () => {
    const withNickname: IRankingRow = { ...row(1, 'a', 80, 3), competitor: person('a', 'Lou Bernard', 'La Mousse') }
    expect(buildMostTitled([withNickname])[0]?.nickname).toBe('La Mousse')
  })
})

describe('titre du bloc des plus titrés (F-02-TIE)', () => {
  const holder = (id: string, titles: number) => ({ competitor: person(id, id), nickname: null, titles, participations: 5 })

  it('aucun ou un seul : « Le plus titré »', () => {
    expect(buildMostTitledLabel([]).key).toBe('palmares.most_titled')
    expect(buildMostTitledLabel([holder('a', 4)]).key).toBe('palmares.most_titled')
  })

  it('à égalité : le singulier et le pluriel ont chacun leur clé, sans syntaxe de pluriel', () => {
    expect(buildMostTitledLabel([holder('a', 1), holder('b', 1)])).toMatchObject({ key: 'palmares.most_titled_tied_one' })
    const many = buildMostTitledLabel([holder('a', 4), holder('b', 4), holder('c', 4)])
    expect(many).toMatchObject({ key: 'palmares.most_titled_tied_other', params: { count: 4 } })
    expect(many.fallback).not.toContain('|')
  })
})

describe('classements', () => {
  const acp = [row(1, 'a', 49.76, 4), row(2, 'b', 16.62, 1), row(2, 'c', 16.62, 0), row(4, 'd', 10, 0)]
  const allTime = [row(1, 'a', 84.02, 4), row(2, 'c', 20, 0)]

  it('les ex aequo partagent le rang de l’API, jamais recalculé', () => {
    expect(buildRankingRows(acp, allTime).map(entry => entry.rank)).toEqual([1, 2, 2, 4])
  })

  it('les points de l’autre classement sont rapprochés par joueur (0 s’il n’y figure pas)', () => {
    expect(buildRankingRows(acp, allTime).map(entry => [entry.id, entry.points, entry.otherPoints])).toEqual([['a', 49.76, 84.02], ['b', 16.62, 0], ['c', 16.62, 20], ['d', 10, 0]])
  })
})

describe('périmètre des classements', () => {
  const editions = [2012, 2013, 2014, 2015, 2016, 2017, 2018].map(year => edition(String(year), year))

  it('dernière édition close et fenêtre ACP des 5 dernières éditions closes', () => {
    expect(buildPalmaresScope(editions)).toEqual({ lastYear: 2018, windowFirstYear: 2014, windowLastYear: 2018 })
  })

  it('une édition en cours n’entre pas dans la fenêtre', () => {
    const scope = buildPalmaresScope([...editions, edition('2019', 2019, { status: EDITION_STATUS.POOLS_PLAYING })])
    expect(scope?.lastYear).toBe(2018)
  })

  it('aucune édition close : pas de périmètre', () => {
    expect(buildPalmaresScope([edition('2019', 2019, { status: EDITION_STATUS.POOLS_PLAYING })])).toBeNull()
    expect(buildPalmaresScope([])).toBeNull()
  })
})

describe('évolution', () => {
  const point = (code: string, year: number, points: number) => ({ editionId: `e-${code}`, editionCode: code, year, points, rank: 1 })
  const series: IRankingEvolutionSeries[] = [
    { competitor: person('a', 'A'), points: [point('2013', 2013, 5), point('2014', 2014, 8)] },
    { competitor: person('b', 'B'), points: [point('2014', 2014, 3)] },
    { competitor: person('z', 'Z'), points: [point('2013', 2013, 99)] }
  ]
  const acp = buildRankingRows([row(1, 'a', 8, 0), row(2, 'b', 3, 0), row(3, 'z', 1, 0)], [])

  it('trace les premiers du classement ACP actuel, dans l’ordre', () => {
    const evolution = buildPalmaresEvolution(acp, series, 2)
    expect(evolution.series.map(entry => entry.competitor.id)).toEqual(['a', 'b'])
  })

  it('une édition sans valeur reste vide (null), jamais un zéro inventé', () => {
    const evolution = buildPalmaresEvolution(acp, series, 2)
    expect(evolution.categories.map(category => category.code)).toEqual(['2013', '2014'])
    expect(evolution.series.map(entry => entry.values)).toEqual([[5, 8], [null, 3]])
  })

  it('sans série correspondante : aucune courbe', () => {
    expect(buildPalmaresEvolution(acp, [], 4)).toEqual({ categories: [], series: [] })
  })
})

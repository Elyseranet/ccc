import { describe, expect, it } from 'vitest'
import { COMPETITOR_SORT, SORT_ORDER } from '../../server/enums/competitor-sort.enum'
import { SEARCH_ACCENTED_CHARACTERS, SEARCH_FOLDED_CHARACTERS } from '../../server/consts/competitor.const'
import {
  buildContainsPattern,
  competitorListQuerySchema,
  escapeLikePattern,
  foldSearchText
} from '../../server/utils/competitor/competitor-query.util'
import { sortCompetitors } from '../../server/utils/competitor/competitor-sort.util'
import type { ICompetitorListItem } from '../../shared/interfaces/api/competitor.interface'

describe('competitor search helpers', () => {
  it('folds case and accents', () => {
    expect(foldSearchText('RÉMI')).toBe('remi')
  })

  it('escapes LIKE wildcards and the escape character', () => {
    expect(escapeLikePattern('100%_\\')).toBe('100\\%\\_\\\\')
    expect(buildContainsPattern('%')).toBe('%\\%%')
  })

  it('keeps the SQL translate() tables aligned', () => {
    expect([...SEARCH_ACCENTED_CHARACTERS]).toHaveLength([...SEARCH_FOLDED_CHARACTERS].length)
  })

  it('trims q before applying the 2 to 50 length bounds', () => {
    expect(competitorListQuerySchema.parse({ q: '  re  ' }).q).toBe('re')
    expect(competitorListQuerySchema.safeParse({ q: ' a ' }).success).toBe(false)
    expect(competitorListQuerySchema.safeParse({ q: 'a'.repeat(51) }).success).toBe(false)
    expect(competitorListQuerySchema.safeParse({ sort: 'phone' }).success).toBe(false)
  })
})

const item = (id: string, displayName: string, wins: number): ICompetitorListItem => ({
  id, displayName, firstName: null, lastName: null, nickname: null, avatarUrl: null,
  editionsPlayed: 0, matchesPlayed: wins, wins, losses: 0, unknownResults: 0, titles: 0, firstEditionCode: null
})

describe('sortCompetitors', () => {
  const items = [item('a', 'Bob', 2), item('b', 'Alice', 2), item('c', 'Carl', 5)]

  it('sorts descending on a statistic and breaks ties alphabetically', () => {
    expect(sortCompetitors(items, new Map(), COMPETITOR_SORT.WINS, SORT_ORDER.DESC).map((i) => i.id)).toEqual(['c', 'b', 'a'])
  })

  it('puts players without a first edition last in either direction', () => {
    const careers = new Map([['a', { competitorId: 'a', editionsPlayed: 1, titles: 0, firstEditionCode: '2020', firstEditionRank: 1 }]])
    expect(sortCompetitors(items, careers, COMPETITOR_SORT.FIRST_EDITION, SORT_ORDER.ASC)[0]!.id).toBe('a')
    expect(sortCompetitors(items, careers, COMPETITOR_SORT.FIRST_EDITION, SORT_ORDER.DESC)[0]!.id).toBe('a')
  })
})

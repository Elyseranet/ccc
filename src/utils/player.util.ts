import type { LocationQuery, LocationQueryRaw } from 'vue-router'
import {
  PLAYERS_ALL_EDITIONS,
  PLAYERS_DIACRITICS,
  PLAYERS_DEFAULT_SORT,
  PLAYERS_HEAD_TO_HEAD_QUERY_KEYS,
  PLAYERS_HEAD_TO_HEAD_ROUTE,
  PLAYERS_PAGE_SIZE,
  PLAYERS_SORT_DEFAULT_ORDER,
  PLAYERS_QUERY_KEYS,
  PLAYERS_SEARCH_MAX_LENGTH,
  PLAYERS_SEARCH_MIN_LENGTH,
  PLAYERS_WORD_SEPARATOR
} from '../consts/players.const.js'
import { COMPETITOR_SORT, SORT_ORDER } from '../enums/competitor-sort.enum.js'
import type { ICompetitorsQuery } from '../interfaces/api-client.interface.js'
import type { IPlayersSearchState } from '../interfaces/players.interface.js'

export const normalizeSearchText = (value: string): string =>
  value.normalize('NFD').replace(PLAYERS_DIACRITICS, '').toLowerCase().trim()

export const matchesSearch = (haystack: string[], query: string): boolean => {
  const needle = normalizeSearchText(query)
  if (needle === '') {
    return true
  }
  return haystack.some(entry => normalizeSearchText(entry).includes(needle))
}

const firstValue = (raw: LocationQuery[string] | undefined): string => {
  const value = Array.isArray(raw) ? raw[0] : raw
  return value ?? ''
}

export const parsePlayersState = (query: LocationQuery): IPlayersSearchState => {
  const sort = firstValue(query[PLAYERS_QUERY_KEYS.SORT])
  const parsedSort = Object.values(COMPETITOR_SORT).includes(sort as COMPETITOR_SORT) ? (sort as COMPETITOR_SORT) : PLAYERS_DEFAULT_SORT
  const order = firstValue(query[PLAYERS_QUERY_KEYS.ORDER])
  const page = Number.parseInt(firstValue(query[PLAYERS_QUERY_KEYS.PAGE]), 10)
  return {
    q: firstValue(query[PLAYERS_QUERY_KEYS.Q]).slice(0, PLAYERS_SEARCH_MAX_LENGTH),
    edition: firstValue(query[PLAYERS_QUERY_KEYS.EDITION]),
    sort: parsedSort,
    order: Object.values(SORT_ORDER).includes(order as SORT_ORDER) ? (order as SORT_ORDER) : PLAYERS_SORT_DEFAULT_ORDER[parsedSort],
    page: Number.isInteger(page) && page >= 1 ? page : 1
  }
}

export const buildPlayersLocationQuery = (state: IPlayersSearchState): LocationQueryRaw => {
  const query: LocationQueryRaw = {}
  if (state.q.trim() !== '') {
    query[PLAYERS_QUERY_KEYS.Q] = state.q
  }
  if (state.edition !== PLAYERS_ALL_EDITIONS) {
    query[PLAYERS_QUERY_KEYS.EDITION] = state.edition
  }
  if (state.sort !== PLAYERS_DEFAULT_SORT) {
    query[PLAYERS_QUERY_KEYS.SORT] = state.sort
  }
  if (state.order !== PLAYERS_SORT_DEFAULT_ORDER[state.sort]) {
    query[PLAYERS_QUERY_KEYS.ORDER] = state.order
  }
  if (state.page > 1) {
    query[PLAYERS_QUERY_KEYS.PAGE] = String(state.page)
  }
  return query
}

export const isSearchable = (q: string): boolean => q.trim().length >= PLAYERS_SEARCH_MIN_LENGTH

export const buildPlayersApiQuery = (state: IPlayersSearchState): ICompetitorsQuery => ({
  q: isSearchable(state.q) ? state.q.trim().slice(0, PLAYERS_SEARCH_MAX_LENGTH) : undefined,
  edition: state.edition === PLAYERS_ALL_EDITIONS ? undefined : state.edition,
  sort: state.sort,
  order: state.order,
  page: state.page,
  pageSize: PLAYERS_PAGE_SIZE
})

export const getInitials = (displayName: string): string =>
  displayName
    .split(PLAYERS_WORD_SEPARATOR)
    .filter(word => word !== '')
    .slice(0, 2)
    .map(word => word.charAt(0).toUpperCase())
    .join('')

export const splitEditionCode = (code: string): { year: string, suffix: string | null } => {
  const match = /^(\d{4})([a-z])?$/.exec(code)
  return { year: match?.[1] ?? code, suffix: match?.[2] ?? null }
}

export const buildHeadToHeadLink = (a: string, b?: string): string => {
  const params = new URLSearchParams({ [PLAYERS_HEAD_TO_HEAD_QUERY_KEYS.A]: a })
  if (b) {
    params.set(PLAYERS_HEAD_TO_HEAD_QUERY_KEYS.B, b)
  }
  return `${PLAYERS_HEAD_TO_HEAD_ROUTE}?${params.toString()}`
}

export const buildPageItems = (current: number, count: number, maxVisible: number): Array<number | null> => {
  if (count <= maxVisible) {
    return Array.from({ length: count }, (_, index) => index + 1)
  }
  const inner = maxVisible - 2
  let start = Math.max(2, current - Math.floor(inner / 2))
  const end = Math.min(count - 1, start + inner - 1)
  start = Math.max(2, end - inner + 1)
  const items: Array<number | null> = [1]
  if (start > 2) {
    items.push(null)
  }
  for (let page = start; page <= end; page += 1) {
    items.push(page)
  }
  if (end < count - 1) {
    items.push(null)
  }
  items.push(count)
  return items
}

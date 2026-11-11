import {
  ADMIN_MATCH_ALL_ROUNDS_VALUE,
  ADMIN_MATCH_TIEBREAK_ON_VALUE,
  ADMIN_MATCH_DEFAULT_FILTER,
  ADMIN_MATCH_FILTER_STATUSES,
  ADMIN_MATCH_FILTERS
} from '../consts/admin-match-filters.const.js'
import { ADMIN_MATCH_QUEUE_ORDER, ADMIN_MATCH_STATUS_VIEW } from '../consts/admin-match-status.const.js'
import { ROUND_LABELS } from '../consts/round-labels.const.js'
import { ROUND_KIND } from '../enums/round.enum.js'
import type { TAdminMatchRound } from '../types/admin-match-round.type.js'
import { ADMIN_MATCH_FILTER } from '../enums/admin-match-filter.enum.js'
import { MATCH_ACTION } from '../enums/match-action.enum.js'
import { MATCH_PURPOSE, MATCH_STATUS } from '../enums/match.enum.js'
import type { IAdminMatch } from '../interfaces/admin-match.interface.js'
import type { IMatchCard } from '../interfaces/admin-match-queue.interface.js'

/*********************************************************
 * File admin des matchs
 *
 * @description
 * Tout ce que la file calcule : filtre lu dans l'URL, compteurs, poules, tri et carte de chaque match. Fonctions pures, testées
 * en unitaire ; le composable ne fait que brancher les requêtes.
 ********************************************************/
const first = (raw: unknown): string | undefined => (Array.isArray(raw) ? raw[0] : raw) as string | undefined

/** `?f=` inconnu ou absent : le filtre par défaut. */
export const parseAdminMatchFilter = (raw: unknown): ADMIN_MATCH_FILTER => {
  const value = first(raw)
  return ADMIN_MATCH_FILTERS.find(entry => entry.value === value)?.value ?? ADMIN_MATCH_DEFAULT_FILTER
}

/** `?poule=` : un entier strictement positif, sinon `null` (toutes les poules). */
export const parseAdminMatchPool = (raw: unknown): number | null => {
  const value = first(raw)
  return value !== undefined && /^[1-9]\d{0,2}$/.test(value) ? Number(value) : null
}

/** `?tour=` : un tour (`ROUND_KIND`), `all`, ou `null` (absent ou inconnu : le tour en cours s'applique). */
export const parseAdminMatchRound = (raw: unknown): TAdminMatchRound | null => {
  const value = first(raw)
  if (value === ADMIN_MATCH_ALL_ROUNDS_VALUE) {
    return ADMIN_MATCH_ALL_ROUNDS_VALUE
  }
  return Object.values(ROUND_KIND).find(kind => kind === value) ?? null
}

/** `?departages=1` : seuls les matchs de départage (`purpose: TIEBREAK`). */
export const parseAdminMatchTiebreak = (raw: unknown): boolean => first(raw) === ADMIN_MATCH_TIEBREAK_ON_VALUE

/** Un départage appartient au tour « Poules » : le filtre n'a de sens que pour « Tous les tours » et « Poules ». */
export const canFilterTiebreaks = (round: TAdminMatchRound): boolean =>
  round === ADMIN_MATCH_ALL_ROUNDS_VALUE || round === ROUND_KIND.POOLS

/** Tours présents dans l'édition, dans l'ordre de `ROUND_KIND`. */
export const roundsOf = (matches: readonly IAdminMatch[]): ROUND_KIND[] =>
  Object.values(ROUND_KIND).filter(kind => matches.some(match => match.roundKind === kind))

/**
 * Tour en cours : le premier tour (ordre de `ROUND_KIND`) qui a encore un match à saisir ou à valider ; si tout est validé, le
 * dernier tour de l'édition ; `null` sans match. `IAdminMatch` ne porte pas le statut du tour, on le déduit des matchs.
 */
export const currentRoundOf = (matches: readonly IAdminMatch[]): ROUND_KIND | null => {
  const rounds = roundsOf(matches)
  const open = rounds.find(kind => matches.some(match => match.roundKind === kind && ADMIN_MATCH_FILTER_STATUSES[ADMIN_MATCH_DEFAULT_FILTER].includes(match.status)))
  return open ?? rounds[rounds.length - 1] ?? null
}

export const matchesFilter = (match: IAdminMatch, filter: ADMIN_MATCH_FILTER): boolean =>
  ADMIN_MATCH_FILTER_STATUSES[filter].includes(match.status)

/** Compteurs des quatre filtres, sur la poule choisie. */
export const countByFilter = (matches: readonly IAdminMatch[]): Record<ADMIN_MATCH_FILTER, number> => {
  const counts = {} as Record<ADMIN_MATCH_FILTER, number>
  for (const { value } of ADMIN_MATCH_FILTERS) {
    counts[value] = matches.filter(match => matchesFilter(match, value)).length
  }
  return counts
}

/** Rangs de poule présents, croissants. */
export const poolsOf = (matches: readonly IAdminMatch[]): number[] =>
  [...new Set(matches.flatMap(match => match.poolRank ?? []))].sort((a, b) => a - b)

export const sortForQueue = (matches: readonly IAdminMatch[]): IAdminMatch[] =>
  [...matches].sort((a, b) => ADMIN_MATCH_QUEUE_ORDER[a.status] - ADMIN_MATCH_QUEUE_ORDER[b.status] || a.sequence - b.sequence)

/** Score affiché d'un côté : le score validé (public) sur un match validé, sinon le score saisi. */
export const shownSideScore = (match: IAdminMatch, index: number): number | null => {
  const side = match.sides[index]
  if (!side) {
    return null
  }
  return match.status === MATCH_STATUS.VALIDATED ? side.score : side.recordedScore
}

/** Valeurs de départ des champs du formulaire : le score déjà saisi, sinon vide. */
export const initialScoreInputs = (match: IAdminMatch): string[] =>
  match.sides.map((_side, index) => String(shownSideScore(match, index) ?? ''))

export const actionOf = (match: IAdminMatch, readonly: boolean): MATCH_ACTION | null => {
  if (readonly) {
    return null
  }
  if (match.status === MATCH_STATUS.RECORDED) {
    return MATCH_ACTION.VALIDATE
  }
  return match.status === MATCH_STATUS.SCHEDULED ? MATCH_ACTION.ENTER : null
}

export const toMatchCard = (match: IAdminMatch, editionCode: string, readonly: boolean): IMatchCard => {
  const view = ADMIN_MATCH_STATUS_VIEW[match.status]
  const round = ROUND_LABELS[match.roundKind].match
  return {
    id: match.id,
    match,
    number: `${editionCode}-${match.sequence}`,
    poolRank: match.poolRank,
    isTiebreak: match.purpose === MATCH_PURPOSE.TIEBREAK,
    round: { key: round.key, fallback: round.label },
    statusLabel: view.label,
    family: view.family,
    firstName: match.sides[0]?.displayName ?? '',
    secondName: match.sides[1]?.displayName ?? '',
    firstScore: shownSideScore(match, 0),
    secondScore: shownSideScore(match, 1),
    action: actionOf(match, readonly)
  }
}

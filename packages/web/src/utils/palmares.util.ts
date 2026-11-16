import { ACP_WINDOW } from '../consts/domain-rules.const.js'
import { PALMARES_DEFAULT_TAB, PALMARES_EVOLUTION_TOP, PALMARES_TAB_VALUES } from '../consts/palmares.const.js'
import { EDITION_STATUS } from '../enums/edition.enum.js'
import type { PALMARES_TAB } from '../enums/palmares.enum.js'
import type { IEditionSummary } from '../interfaces/edition.interface.js'
import type { ITranslatableText } from '../interfaces/common-components.interface.js'
import type { IPalmaresEvolution, IPalmaresMostTitled, IPalmaresScope, IPalmaresRankingRow, IPalmaresTitle } from '../interfaces/palmares.interface.js'
import type { IRankingEvolutionSeries, IRankingRow } from '../interfaces/ranking.interface.js'
import { editionOption } from './edition-view.util.js'

/*********************************************************
 * Mise en forme du palmarès (F-02)
 *
 * @description
 * Fonctions pures : elles ne traduisent rien. Elles ne lisent que les DTO publics (éditions, classements) et ne
 * recalculent aucun rang : le rang d'un classement est celui de l'API, les ex aequo le partagent déjà.
 ********************************************************/

/** `?onglet=` inconnu ou absent : l'onglet par défaut. */
export const resolvePalmaresTab = (value: unknown, fallback: PALMARES_TAB = PALMARES_DEFAULT_TAB): PALMARES_TAB => {
  const candidate = Array.isArray(value) ? value[0] : value
  return typeof candidate === 'string' && PALMARES_TAB_VALUES.includes(candidate) ? candidate as PALMARES_TAB : fallback
}

/** Chronologie : la plus récente d'abord (2012 · 2e avant 2012 · 1re). Une édition sans champion est « en cours », sans champion inventé. */
export const buildPalmaresTitles = (editions: IEditionSummary[]): IPalmaresTitle[] => [...editions]
  .sort((a, b) => b.year - a.year || b.code.localeCompare(a.code))
  .map(edition => ({
    option: editionOption(edition),
    isCurrent: edition.champion === null && edition.status !== EDITION_STATUS.CLOSED,
    champion: edition.champion ? { competitor: { id: edition.champion.competitor.id, displayName: edition.champion.competitor.displayName }, titles: edition.champion.titlesToDate } : null,
    runnerUp: edition.final ? { competitor: { id: edition.final.runnerUp.id, displayName: edition.final.runnerUp.displayName }, titles: edition.final.runnerUpTitlesToDate } : null,
    score: edition.final?.score ?? null,
    participantCount: edition.participantCount
  }))

/**
 * Les plus titrés (F-02-TIE) : TOUS les joueurs à égalité sur le plus grand nombre de titres du classement All Time, dans l'ordre de
 * l'API (rang All Time), sans départage inventé. Personne si personne n'a de titre.
 */
export const buildMostTitled = (allTime: IRankingRow[]): IPalmaresMostTitled[] => {
  const best = allTime.reduce((max, row) => Math.max(max, row.titles), 0)
  if (best === 0) {
    return []
  }
  return allTime
    .filter(row => row.titles === best)
    .map(row => ({
      competitor: { id: row.competitor.id, displayName: row.competitor.displayName },
      nickname: row.competitor.nickname,
      titles: row.titles,
      participations: row.participations
    }))
}

/** Lignes d'un classement, avec les points de l'autre classement du même joueur (0 s'il n'y figure pas). */
export const buildRankingRows = (main: IRankingRow[], other: IRankingRow[]): IPalmaresRankingRow[] => {
  const otherPoints = new Map(other.map(row => [row.competitor.id, row.points]))
  return main.map(row => ({
    id: row.competitor.id,
    rank: row.rank,
    competitor: { id: row.competitor.id, displayName: row.competitor.displayName },
    titles: row.titles,
    points: row.points,
    otherPoints: otherPoints.get(row.competitor.id) ?? 0,
    participations: row.participations,
    average: row.average
  }))
}

/** Évolution des premiers du classement ACP actuel (RG8) : une courbe par joueur, une valeur par édition (null si absente). */
export const buildPalmaresEvolution = (acp: IPalmaresRankingRow[], series: IRankingEvolutionSeries[], top: number = PALMARES_EVOLUTION_TOP): IPalmaresEvolution => {
  const byCompetitor = new Map(series.map(entry => [entry.competitor.id, entry]))
  const chosen = acp.slice(0, top).flatMap((row) => {
    const entry = byCompetitor.get(row.id)
    return entry ? [{ row, entry }] : []
  })
  const editions = new Map<string, { year: number }>()
  for (const { entry } of chosen) {
    for (const point of entry.points) {
      editions.set(point.editionCode, { year: point.year })
    }
  }
  const categories = [...editions.entries()]
    .sort(([a, x], [b, y]) => x.year - y.year || a.localeCompare(b))
    .map(([code, { year }]) => ({ code, option: editionOption({ code, year }) }))
  return {
    categories,
    series: chosen.map(({ row, entry }) => {
      const values = new Map(entry.points.map(point => [point.editionCode, point.points]))
      return { competitor: row.competitor, values: categories.map(category => values.get(category.code) ?? null) }
    })
  }
}

/** Périmètre du classement : la dernière édition close et les années couvertes par la fenêtre ACP (RG4, les 5 dernières éditions closes). */
export const buildPalmaresScope = (editions: Array<Pick<IEditionSummary, 'code' | 'year' | 'status'>>, window: number = ACP_WINDOW): IPalmaresScope | null => {
  const closed = editions
    .filter(edition => edition.status === EDITION_STATUS.CLOSED)
    .sort((a, b) => a.year - b.year || a.code.localeCompare(b.code))
  const last = closed[closed.length - 1]
  const first = closed[Math.max(0, closed.length - window)]
  return last && first ? { lastYear: last.year, windowFirstYear: first.year, windowLastYear: last.year } : null
}

/**
 * Titre du bloc « les plus titrés » : seul, « Le plus titré » ; à égalité (F-02-TIE), « Les plus titrés · ex aequo, N titres chacun ».
 * Le singulier et le pluriel ont chacun leur clé : le projet n'a pas de syntaxe de pluriel i18n.
 */
export const buildMostTitledLabel = (mostTitled: IPalmaresMostTitled[]): ITranslatableText => {
  const titles = mostTitled[0]?.titles ?? 0
  if (mostTitled.length <= 1) {
    return { key: 'palmares.most_titled', fallback: 'Le plus titré' }
  }
  return titles === 1
    ? { key: 'palmares.most_titled_tied_one', fallback: 'Les plus titrés · ex aequo, 1 titre chacun' }
    : { key: 'palmares.most_titled_tied_other', fallback: 'Les plus titrés · ex aequo, {count} titres chacun', params: { count: titles } }
}

import { CENTS_PER_POINT, POINTS_BASE_SCALE, POINTS_REFERENCE_PARTICIPANTS } from '../consts/domain-rules.const.js'
import {
  EDITION_BRACKET_ROUND_ORDER,
  EDITION_FINAL_STAGE_LABELS,
  EDITION_HERO_STATUS,
  EDITION_PARTICIPATION_STATUS_LABELS,
  EDITION_STEPS,
  EDITION_STEPS_DONE,
  EDITION_SUFFIX_ORDINALS,
  EDITION_SUFFIX_ORDINAL_FALLBACK,
  EDITION_TAB_VALUES
} from '../consts/edition-view.const.js'
import { DRAW_KIND } from '../enums/draw.enum.js'
import { MATCH_PURPOSE } from '../enums/match.enum.js'
import { EDITION_CHIP_FAMILY, EDITION_MATCH_FILTER, EDITION_STEP_STATE } from '../enums/edition-tab.enum.js'
import type { EDITION_TAB } from '../enums/edition-tab.enum.js'
import { EDITION_STATUS } from '../enums/edition.enum.js'
import { FINAL_STAGE, PARTICIPATION_STATUS } from '../enums/participation.enum.js'
import { ROUND_KIND } from '../enums/round.enum.js'
import type { ITranslatableText } from '../interfaces/common-components.interface.js'
import type { IEditionDetail, IEditionSummary } from '../interfaces/edition.interface.js'
import type {
  IEditionBracketRound,
  IEditionDrawView,
  IEditionFact,
  IEditionHeroMeta,
  IEditionMatchFilterCounts,
  IEditionMatchRow,
  IEditionOption,
  IEditionParticipantRow,
  IEditionPodium,
  IEditionPoolTable,
  IEditionSeedRow,
  IEditionStep
} from '../interfaces/edition-view.interface.js'
import type { TEditionPerson } from '../types/edition-person.type.js'
import { computeParticipationPointsCents } from './points.util.js'

/*********************************************************
 * Mise en forme d'une édition (F-03a)
 *
 * @description
 * Fonctions pures : elles ne traduisent rien et renvoient des clés + paramètres (`ITranslatableText`) que les
 * composants traduisent. Elles ne lisent que le DTO public de l'édition (aucun score non validé, aucun commentaire).
 ********************************************************/

/** `?onglet=` inconnu ou absent : l'onglet par défaut. */
export const resolveEditionTab = (value: unknown, fallback: EDITION_TAB): EDITION_TAB => {
  const candidate = Array.isArray(value) ? value[0] : value
  return typeof candidate === 'string' && EDITION_TAB_VALUES.includes(candidate) ? candidate as EDITION_TAB : fallback
}

/** Rang de la poule d'un identifiant de poule (1 pour « Poule 1 »). */
export const poolRankById = (detail: Pick<IEditionDetail, 'pools'>): Map<string, number> => new Map(detail.pools.map(pool => [pool.id, pool.rank]))

export const initialsOf = (displayName: string): string => displayName
  .split(/\s+/)
  .filter(Boolean)
  .slice(0, 2)
  .map(part => part.charAt(0).toUpperCase())
  .join('')

const toPerson = (person: TEditionPerson): TEditionPerson => ({ id: person.id, displayName: person.displayName })

/** Podium : seulement quand l'édition a un·e champion·ne (RG6). Le score de la finale n'est lu que sur un match validé. */
export const buildEditionPodium = (detail: IEditionDetail): IEditionPodium | null => {
  if (!detail.champion) {
    return null
  }
  const champion = detail.champion.competitor
  const finalMatch = detail.matches.find(match => match.roundKind === ROUND_KIND.FINAL && match.winnerParticipationId !== null)
  const scores = finalMatch ? finalMatch.sides.map(side => side.score) : []
  const winnerSide = finalMatch?.sides.find(side => side.participationId === finalMatch.winnerParticipationId)
  const loserSide = finalMatch?.sides.find(side => side.participationId !== finalMatch.winnerParticipationId)
  const finalist = detail.participants.find(participant => participant.finalStage === FINAL_STAGE.FINALIST)
  return {
    champion: toPerson(champion),
    titlesToDate: detail.champion.titlesToDate,
    finalWinnerScore: scores.length > 0 && winnerSide ? winnerSide.score : null,
    finalLoserScore: scores.length > 0 && loserSide ? loserSide.score : null,
    finalist: finalist ? toPerson(finalist.competitor) : null,
    semifinalists: detail.participants.filter(participant => participant.finalStage === FINAL_STAGE.SEMI).map(participant => toPerson(participant.competitor))
  }
}

/** Valeur numérique d'un champ, en centièmes → « 16.20 » (RG2 : barème RG1 × N / 50). */
export const formatTitlePoints = (participantCount: number): string => (computeParticipationPointsCents(FINAL_STAGE.CHAMPION, participantCount) / CENTS_PER_POINT).toFixed(2)

/** Effectifs distincts des poules, du plus grand au plus petit (« 6, 5 »). */
export const poolSizes = (detail: Pick<IEditionDetail, 'pools'>): number[] => [...new Set(detail.pools.map(pool => pool.standing.length).filter(size => size > 0))].sort((a, b) => b - a)

/**
 * Chiffres de l'édition. Matchs : R-10 (jamais un total seul). En cours, « {programmed} programmés, dont {validated} validés » ;
 * archive, « {matches} matchs, dont {unknown} au résultat inconnu » (omis si 0).
 */
export const buildEditionFacts = (detail: IEditionDetail): IEditionFact[] => {
  const participants = detail.participantCount ?? detail.participants.length
  const poolMatches = detail.rounds.filter(round => round.kind === ROUND_KIND.POOLS).reduce((sum, round) => sum + round.matchCount, 0)
  const knockoutMatches = detail.rounds.filter(round => round.kind !== ROUND_KIND.POOLS).reduce((sum, round) => sum + round.matchCount, 0)
  const closed = detail.status === EDITION_STATUS.CLOSED
  const sizes = poolSizes(detail)
  const facts: IEditionFact[] = [
    { id: 'participants', label: { key: 'edition.fact_participants', fallback: 'Participants' }, value: String(participants), detail: null, extra: null },
    {
      id: 'pools',
      label: { key: 'edition.fact_pools', fallback: 'Poules' },
      value: String(detail.pools.length),
      detail: sizes.length > 0 ? { key: 'edition.fact_pools_sizes', fallback: '{sizes} joueurs', params: { sizes: sizes.join(', ') } } : null,
      extra: null
    },
    {
      id: 'matches',
      label: { key: 'edition.fact_matches', fallback: 'Matchs' },
      value: String(detail.matchCount),
      detail: poolMatches + knockoutMatches > 0 ? { key: 'edition.fact_matches_split', fallback: '{pools} en poule · {knockout} en phase finale', params: { pools: poolMatches, knockout: knockoutMatches } } : null,
      extra: closed
        ? (detail.unknownResultMatchCount > 0 ? { key: 'edition.summary_matches_archive', fallback: '{matches} matchs, dont {unknown} au résultat inconnu', params: { matches: detail.matchCount, unknown: detail.unknownResultMatchCount } } : null)
        : { key: 'edition.summary_matches_in_progress', fallback: '{programmed} programmés, dont {validated} validés', params: { programmed: detail.matchCount, validated: detail.scoredMatchCount } }
    }
  ]
  if (detail.participantCount !== null && detail.participantCount > 0) {
    facts.push({
      id: 'title_points',
      label: { key: 'edition.fact_title_points', fallback: 'Points du titre' },
      value: formatTitlePoints(detail.participantCount),
      detail: { key: 'edition.fact_title_points_formula', fallback: '{base} × {count} / {reference} (RG2)', params: { base: POINTS_BASE_SCALE[FINAL_STAGE.CHAMPION], count: detail.participantCount, reference: POINTS_REFERENCE_PARTICIPANTS } },
      extra: null
    })
  }
  return facts
}

/** Le Déroulé : les étapes faites, l'étape en cours (si l'édition n'est pas close), puis les étapes à venir. */
export const buildEditionSteps = (status: EDITION_STATUS): IEditionStep[] => {
  const done = EDITION_STEPS_DONE[status]
  return EDITION_STEPS.map((step, index) => ({
    id: step.id,
    index: index + 1,
    label: step.label,
    state: index < done ? EDITION_STEP_STATE.DONE : (index === done ? EDITION_STEP_STATE.ACTIVE : EDITION_STEP_STATE.PENDING)
  }))
}

/** En-tête : statut (libellé, famille de pastille) et ligne « 45 joueurs · 8 poules · 120 matchs ». */
export const buildEditionHeroMeta = (detail: Pick<IEditionDetail, 'status' | 'participantCount' | 'participants' | 'pools' | 'matchCount'>): IEditionHeroMeta => {
  const participants = detail.participantCount ?? detail.participants.length
  return {
    status: EDITION_HERO_STATUS[detail.status].label,
    family: EDITION_HERO_STATUS[detail.status].family,
    summary: { key: 'edition.hero_summary', fallback: '{players} joueurs · {pools} poules · {matches} matchs', params: { players: participants, pools: detail.pools.length, matches: detail.matchCount } }
  }
}

const participantResult = (participant: IEditionDetail['participants'][number]): ITranslatableText => participant.finalStage
  ? EDITION_FINAL_STAGE_LABELS[participant.finalStage]
  : EDITION_PARTICIPATION_STATUS_LABELS[participant.status]

const participantFamily = (participant: IEditionDetail['participants'][number]): EDITION_CHIP_FAMILY => {
  if (participant.finalStage === null) {
    return EDITION_CHIP_FAMILY.NEUTRAL
  }
  return participant.finalStage === FINAL_STAGE.POOL_ELIMINATED ? EDITION_CHIP_FAMILY.NEUTRAL : EDITION_CHIP_FAMILY.TINTED_SUCCESS
}

/** Participants par ordre alphabétique du nom affiché (comme la maquette). */
export const buildEditionParticipants = (detail: IEditionDetail): IEditionParticipantRow[] => {
  const ranks = poolRankById(detail)
  return [...detail.participants]
    .sort((a, b) => a.competitor.displayName.localeCompare(b.competitor.displayName, 'fr'))
    .map(participant => ({
      participationId: participant.participationId,
      competitor: toPerson(participant.competitor),
      avatarUrl: participant.competitor.avatarUrl,
      initials: initialsOf(participant.competitor.displayName),
      poolRank: participant.poolId ? (ranks.get(participant.poolId) ?? null) : null,
      result: participantResult(participant),
      family: participantFamily(participant)
    }))
}

/** Têtes de série (RG9) : une par poule, dans l'ordre des poules. */
export const buildEditionSeeds = (detail: IEditionDetail): IEditionSeedRow[] => {
  const ranks = poolRankById(detail)
  return detail.participants
    .filter(participant => participant.isSeed && participant.poolId !== null && ranks.has(participant.poolId))
    .map(participant => ({ participationId: participant.participationId, competitor: toPerson(participant.competitor), poolRank: ranks.get(participant.poolId as string) as number }))
    .sort((a, b) => a.poolRank - b.poolRank)
}

/** Tirages de la phase finale (RG13) : un tirage par tour, les affiches regroupées par `pairingIndex`. */
export const buildEditionRoundDraws = (detail: IEditionDetail): IEditionDrawView[] => detail.draws
  .filter(draw => draw.kind === DRAW_KIND.ROUND && draw.roundKind !== null)
  .map((draw) => {
    const byPairing = new Map<number, Array<{ position: number, person: TEditionPerson }>>()
    for (const assignment of draw.assignments) {
      if (assignment.pairingIndex === null) {
        continue
      }
      const sides = byPairing.get(assignment.pairingIndex) ?? []
      sides.push({ position: assignment.sidePosition ?? 0, person: { id: assignment.competitorId, displayName: assignment.displayName } })
      byPairing.set(assignment.pairingIndex, sides)
    }
    return {
      id: draw.id,
      roundKind: draw.roundKind as ROUND_KIND,
      status: draw.status,
      pairings: [...byPairing.entries()].sort((a, b) => a[0] - b[0]).map(([index, sides]) => ({ index, sides: sides.sort((a, b) => a.position - b.position).map(side => side.person) }))
    }
  })

/** Statut du tirage des poules (RG9, RG11) : le tirage `POOLS` de l'édition, s'il existe. */
export const findPoolsDraw = (detail: Pick<IEditionDetail, 'draws'>): IEditionDetail['draws'][number] | null => detail.draws.find(draw => draw.kind === DRAW_KIND.POOLS) ?? null

/** Option du sélecteur : l'année et, pour deux éditions d'une même année (2012a, 2012b), l'ordinal (« 1re », « 2e »). */
export const editionOption = (edition: Pick<IEditionSummary, 'code' | 'year'>): IEditionOption => {
  const suffix = edition.code.slice(String(edition.year).length)
  if (suffix === '') {
    return { code: edition.code, year: edition.year, ordinal: null }
  }
  const index = suffix.toLowerCase().charCodeAt(0) - 'a'.charCodeAt(0)
  const ordinal = EDITION_SUFFIX_ORDINALS[index] ?? { ...EDITION_SUFFIX_ORDINAL_FALLBACK, params: { n: index + 1 } }
  return { code: edition.code, year: edition.year, ordinal }
}

/** Édition vers laquelle `/editions` redirige (A5) : la première non close, sinon la plus récente. */
export const currentEditionCode = (editions: Array<Pick<IEditionSummary, 'code' | 'year' | 'status'>>): string | null => {
  if (editions.length === 0) {
    return null
  }
  const sorted = [...editions].sort((a, b) => b.year - a.year || b.code.localeCompare(a.code))
  return (sorted.find(edition => edition.status !== EDITION_STATUS.CLOSED) ?? sorted[0] as typeof sorted[number]).code
}

/** Un participant est qualifié s'il a dépassé les poules (édition close) ou si son statut le dit (édition en cours). RG18 : le nombre vient des données. */
const isQualified = (participant: IEditionDetail['participants'][number] | undefined): boolean => {
  if (!participant) {
    return false
  }
  if (participant.finalStage !== null) {
    return participant.finalStage !== FINAL_STAGE.POOL_ELIMINATED
  }
  return participant.status === PARTICIPATION_STATUS.QUALIFIED || participant.status === PARTICIPATION_STATUS.WINNER
}

/** Classements de poule (RG19) : l'ordre est celui de l'API (victoires, cap's average, confrontation), jamais recalculé. */
export const buildEditionPoolTables = (detail: IEditionDetail): IEditionPoolTable[] => {
  const participants = new Map(detail.participants.map(participant => [participant.participationId, participant]))
  return [...detail.pools]
    .sort((a, b) => a.rank - b.rank)
    .map(pool => ({
      id: pool.id,
      rank: pool.rank,
      rows: [...pool.standing]
        .sort((a, b) => a.rank - b.rank)
        .map(row => ({
          participationId: row.participationId,
          competitor: toPerson(row.competitor),
          rank: row.rank,
          played: row.played,
          wins: row.wins,
          losses: row.losses,
          pointsFor: row.pointsFor,
          pointsAgainst: row.pointsAgainst,
          capsAverage: row.capsAverage,
          qualified: isQualified(participants.get(row.participationId))
        }))
    }))
}

/** Tableau : seulement les tours que l'API publie (B-18), jamais un tour vide inventé. Un score non validé n'est jamais public. */
export const buildEditionBracket = (detail: IEditionDetail): IEditionBracketRound[] => EDITION_BRACKET_ROUND_ORDER
  .map(kind => ({ kind, matches: detail.bracket.filter(round => round.kind === kind).flatMap(round => round.matches) }))
  .filter(round => round.matches.length > 0)
  .map(round => ({
    kind: round.kind,
    matches: round.matches.map(match => ({
      id: match.id,
      sides: match.sides.map(side => ({
        participationId: side.participationId,
        competitor: { id: side.competitorId, displayName: side.displayName },
        score: side.score,
        isWinner: match.winnerParticipationId !== null && side.participationId === match.winnerParticipationId
      }))
    }))
  }))

/** Matchs, du plus récent au plus ancien. N° = `{code}-{rang}` (RG24) ; vainqueur en premier quand il y en a un. */
export const buildEditionMatchRows = (detail: IEditionDetail): IEditionMatchRow[] => [...detail.matches]
  .sort((a, b) => b.sequence - a.sequence)
  .map((match) => {
    const winner = match.sides.find(side => side.participationId === match.winnerParticipationId)
    const first = winner ?? match.sides[0]
    const second = match.sides.find(side => side !== first)
    const scored = (side: IEditionDetail['matches'][number]['sides'][number] | undefined): number | null => (match.winnerParticipationId !== null && side ? side.score : null)
    return {
      id: match.id,
      sequence: match.sequence,
      number: `${detail.code}-${match.sequence}`,
      roundKind: match.roundKind,
      poolRank: match.poolRank,
      isTiebreak: match.purpose === MATCH_PURPOSE.TIEBREAK,
      first: first ? { id: first.competitorId, displayName: first.displayName } : null,
      second: second ? { id: second.competitorId, displayName: second.displayName } : null,
      firstScore: scored(first),
      secondScore: scored(second),
      hasWinner: winner !== undefined,
      status: match.status
    }
  })

export const editionMatchFilterCounts = (rows: Array<Pick<IEditionMatchRow, 'roundKind'>>): IEditionMatchFilterCounts => ({
  all: rows.length,
  pools: rows.filter(row => row.roundKind === ROUND_KIND.POOLS).length,
  knockout: rows.filter(row => row.roundKind !== ROUND_KIND.POOLS).length
})

export const filterEditionMatchRows = <T extends Pick<IEditionMatchRow, 'roundKind'>>(rows: T[], filter: EDITION_MATCH_FILTER): T[] => {
  if (filter === EDITION_MATCH_FILTER.POOLS) {
    return rows.filter(row => row.roundKind === ROUND_KIND.POOLS)
  }
  return filter === EDITION_MATCH_FILTER.KNOCKOUT ? rows.filter(row => row.roundKind !== ROUND_KIND.POOLS) : rows
}

/** Page `page` (1 pour la première) de `pageSize` éléments, bornée aux pages existantes. */
export const pageSlice = <T>(items: T[], page: number, pageSize: number): { items: T[], page: number, pageCount: number } => {
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize))
  const current = Math.min(Math.max(1, page), pageCount)
  return { items: items.slice((current - 1) * pageSize, current * pageSize), page: current, pageCount }
}

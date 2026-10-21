import type { DataSource } from 'typeorm'
import { COMPETITOR_PUBLIC_COLUMNS as PUBLIC_COLUMNS, SEARCH_ACCENTED_CHARACTERS, SEARCH_FOLDED_CHARACTERS, STATS_MATCH_STATUSES } from '../consts/competitor.const'
import { CompetitorEntity } from '../database/entities/competitor.entity'
import { MatchSideEntity } from '../database/entities/match-side.entity'
import { MatchEntity } from '../database/entities/match.entity'
import { ParticipationEntity } from '../database/entities/participation.entity'
import { MATCH_RECORD_KEY } from '../enums/match-record-key.enum'
import type { ICompetitorCareer, ICompetitorListQuery, IMatchContext } from '../interfaces/competitor.interface'
import type { IMatchRecord } from '../interfaces/stats.interface'
import { EDITION_STATUS } from '../../shared/enums/edition.enum'
import type { FINAL_STAGE } from '../../shared/enums/participation.enum'
import { MATCH_PURPOSE } from '../../shared/enums/match.enum'
import type {
  ICompetitorDetail,
  ICompetitorListItem,
  ICompetitorParticipation,
  ICompetitorPublic,
  ICompetitorStats
} from '../../shared/interfaces/api/competitor.interface'
import type { IHeadToHead, IHeadToHeadMatch, IHeadToHeadSummary } from '../../shared/interfaces/api/head-to-head.interface'
import type { IPaginated } from '../../shared/interfaces/api/pagination.interface'
import { toMatchRecord } from '../utils/match/match-record.mapper.util'
import { competitorNotFound } from '../utils/http/api-error.util'
import { buildPaginated } from '../utils/http/pagination.util'
import { countTitles } from '../utils/ranking/ranking.util'
import { computeHeadToHead, computePlayerBalance, countedOutcomes, resolveMatchOutcome } from '../utils/stats/record.util'
import { toCompetitorPublic } from '../utils/competitor/competitor-public.mapper.util'
import { buildContainsPattern } from '../utils/competitor/competitor-query.util'
import { sortCompetitors } from '../utils/competitor/competitor-sort.util'

const folded = (column: string): string => `translate(lower(${column}), :accented, :folded)`

const emptyStats = (): ICompetitorStats => ({
  played: 0,
  wins: 0,
  losses: 0,
  unknownResults: 0,
  pointsFor: 0,
  pointsAgainst: 0,
  titles: 0
})

/**
 * Matchs REGULAR comptés ou au résultat inconnu, avec leurs côtés. Colonnes choisies une à une :
 * le commentaire du match (A13, admin uniquement) n'est jamais lu.
 */
const loadRegularMatches = async (db: DataSource, competitorId?: string): Promise<IMatchContext[]> => {
  const query = db.getRepository(MatchEntity).createQueryBuilder('m')
    .innerJoin('m.sides', 's')
    .innerJoin('s.participation', 'p')
    .innerJoin('m.edition', 'e')
    .innerJoin('m.round', 'r')
    .select(['m.id', 'm.status', 'm.purpose', 'm.sequence', 's.id', 's.participationId', 's.validatedScore', 'p.id', 'p.competitorId', 'e.id', 'e.code', 'e.chronologicalRank', 'r.id', 'r.kind'])
    .where('m.purpose = :purpose', { purpose: MATCH_PURPOSE.REGULAR })
    .andWhere('m.status IN (:...statuses)', { statuses: STATS_MATCH_STATUSES })
    .orderBy('e.chronologicalRank', 'ASC')
    .addOrderBy('m.sequence', 'ASC')
    .addOrderBy('s.position', 'ASC')

  if (competitorId) {
    const involved = db.getRepository(MatchSideEntity).createQueryBuilder('ms')
      .innerJoin('ms.participation', 'mp')
      .select('ms.matchId')
      .where('mp.competitorId = :competitorId')
      .getQuery()
    query.andWhere(`m.id IN (${involved})`, { competitorId })
  }

  const matches = await query.getMany()
  return matches.map((match) => ({ match, record: toMatchRecord(match, MATCH_RECORD_KEY.COMPETITOR) }))
}

/** A8 : seul un titre d'édition CLOSED compte, comme dans le classement (B-07). Une seule règle : `countTitles` (RG6). */
const titlesByCompetitor = (rows: Array<{ competitorId: string, finalStage: FINAL_STAGE | null, editionStatus: EDITION_STATUS }>): Map<string, number> =>
  new Map(countTitles(rows
    .filter((row) => row.editionStatus === EDITION_STATUS.CLOSED && row.finalStage !== null)
    .map((row) => ({ playerId: row.competitorId, editionId: '', finalStage: row.finalStage! })))
    .map(({ playerId, titles }) => [playerId, titles]))

const loadCareers = async (db: DataSource): Promise<Map<string, ICompetitorCareer>> => {
  const rows = await db.getRepository(ParticipationEntity).createQueryBuilder('pt')
    .innerJoin('pt.edition', 'e')
    .select('pt.competitorId', 'competitorId')
    .addSelect('pt.finalStage', 'finalStage')
    .addSelect('e.status', 'editionStatus')
    .addSelect('e.code', 'code')
    .addSelect('e.chronologicalRank', 'rank')
    .orderBy('e.chronologicalRank', 'ASC')
    .getRawMany<{ competitorId: string, finalStage: FINAL_STAGE | null, editionStatus: EDITION_STATUS, code: string, rank: number }>()

  const titles = titlesByCompetitor(rows)
  const careers = new Map<string, ICompetitorCareer>()
  for (const row of rows) {
    const career = careers.get(row.competitorId) ?? {
      competitorId: row.competitorId,
      editionsPlayed: 0,
      titles: titles.get(row.competitorId) ?? 0,
      // Lignes triées par rang chronologique : la première rencontrée est la première édition.
      firstEditionCode: row.code,
      firstEditionRank: Number(row.rank)
    }
    career.editionsPlayed += 1
    careers.set(row.competitorId, career)
  }
  return careers
}

const findCompetitors = async (db: DataSource, query: Pick<ICompetitorListQuery, 'q' | 'edition'>): Promise<CompetitorEntity[]> => {
  const builder = db.getRepository(CompetitorEntity).createQueryBuilder('c').select(PUBLIC_COLUMNS)

  if (query.q) {
    // Requête paramétrée ; le motif a déjà ses jokers LIKE échappés (cf. buildContainsPattern).
    const nameMatches = ['c.displayName', 'c.nickname', 'c.firstName', 'c.lastName']
      .map((column) => `${folded(column)} LIKE :pattern ESCAPE '\\'`)
    const aliasMatch = `EXISTS (SELECT 1 FROM competitor_aliases ca WHERE ca.competitor_id = c.id AND ${folded('ca.alias')} LIKE :pattern ESCAPE '\\')`
    builder.andWhere(`(${[...nameMatches, aliasMatch].join(' OR ')})`, {
      pattern: buildContainsPattern(query.q),
      accented: SEARCH_ACCENTED_CHARACTERS,
      folded: SEARCH_FOLDED_CHARACTERS
    })
  }
  if (query.edition) {
    builder.andWhere('EXISTS (SELECT 1 FROM participations pe WHERE pe.competitor_id = c.id AND pe.edition_id = :edition)', { edition: query.edition })
  }
  return builder.getMany()
}

/**
 * Liste paginée avec statistiques de carrière (R-5 : victoires et défaites sur les matchs avec score
 * seulement). Le filtre `edition` ne restreint que l'ensemble des compétiteurs ; les statistiques
 * restent celles de toute leur carrière. L'archive est petite (centaines de joueurs) : tri et
 * pagination se font en mémoire, ce qui permet de trier sur une statistique calculée.
 */
export const listCompetitors = async (query: ICompetitorListQuery): Promise<IPaginated<ICompetitorListItem>> => {
  const db = await useDataSource()
  const [competitors, careers, matches] = await Promise.all([
    findCompetitors(db, query),
    loadCareers(db),
    loadRegularMatches(db)
  ])

  const balances = new Map(computePlayerBalance(matches.map(({ record }) => record)).map((balance) => [balance.playerId, balance]))

  const items = competitors.map((competitor): ICompetitorListItem => {
    const career = careers.get(competitor.id)
    const balance = balances.get(competitor.id)
    return {
      ...toCompetitorPublic(competitor),
      editionsPlayed: career?.editionsPlayed ?? 0,
      matchesPlayed: balance?.played ?? 0,
      wins: balance?.wins ?? 0,
      losses: balance?.losses ?? 0,
      unknownResults: balance?.unknownResults ?? 0,
      titles: career?.titles ?? 0,
      firstEditionCode: career?.firstEditionCode ?? null
    }
  })

  const sorted = sortCompetitors(items, careers, query.sort, query.order)
  const skip = (query.page - 1) * query.pageSize
  return buildPaginated(sorted.slice(skip, skip + query.pageSize), sorted.length, query)
}

const findPublicCompetitor = async (db: DataSource, id: string): Promise<ICompetitorPublic> => {
  const competitor = await db.getRepository(CompetitorEntity).createQueryBuilder('c')
    .select(PUBLIC_COLUMNS)
    .where('c.id = :id', { id })
    .getOne()
  if (!competitor) {
    throw competitorNotFound()
  }
  return toCompetitorPublic(competitor)
}

export const getCompetitorDetail = async (id: string): Promise<ICompetitorDetail> => {
  const db = await useDataSource()
  const competitor = await findPublicCompetitor(db, id)

  const participationRows = await db.getRepository(ParticipationEntity).createQueryBuilder('pt')
    .innerJoin('pt.edition', 'e')
    .select(['pt.id', 'pt.finalStage', 'pt.points', 'pt.poolRank', 'e.id', 'e.code', 'e.year', 'e.name', 'e.status'])
    .where('pt.competitorId = :id', { id })
    .orderBy('e.chronologicalRank', 'ASC')
    .getMany()

  const participations = participationRows.map((row): ICompetitorParticipation => ({
    editionId: row.edition.id,
    editionCode: row.edition.code,
    year: row.edition.year,
    editionName: row.edition.name,
    editionStatus: row.edition.status,
    finalStage: row.finalStage,
    points: row.points,
    poolRank: row.poolRank
  }))

  const matches = await loadRegularMatches(db, id)
  const balance = computePlayerBalance(matches.map(({ record }) => record)).find((entry) => entry.playerId === id)
  const stats: ICompetitorStats = {
    ...emptyStats(),
    ...(balance && {
      played: balance.played,
      wins: balance.wins,
      losses: balance.losses,
      unknownResults: balance.unknownResults,
      pointsFor: balance.pointsFor,
      pointsAgainst: balance.pointsAgainst
    }),
    titles: titlesByCompetitor(participationRows.map((row) => ({ competitorId: id, finalStage: row.finalStage, editionStatus: row.edition.status }))).get(id) ?? 0
  }

  return { ...competitor, participations, stats }
}

const toSummary = (
  competitor: ICompetitorPublic,
  opponent: ICompetitorPublic,
  records: IMatchRecord[]
): IHeadToHeadSummary => {
  const result = computeHeadToHead(records, competitor.id, opponent.id)
  return {
    competitor,
    opponent,
    played: result.encounters,
    wins: result.winsA,
    losses: result.winsB,
    winRatio: result.encounters === 0 ? null : result.winsA / result.encounters,
    pointsFor: result.pointsA,
    pointsAgainst: result.pointsB,
    differential: result.pointsA - result.pointsB
  }
}

export const getHeadToHead = async (id: string, opponentId: string): Promise<IHeadToHead> => {
  const db = await useDataSource()
  const [competitor, opponent] = await Promise.all([findPublicCompetitor(db, id), findPublicCompetitor(db, opponentId)])
  const encounters = (await loadRegularMatches(db, id)).filter(({ record }) =>
    record.sides.some((side) => side.playerId === opponentId))

  const summary = toSummary(competitor, opponent, encounters.map(({ record }) => record))
  const matches = encounters
    .filter(({ record }) => countedOutcomes([record]).length === 1)
    .map(({ match, record }): IHeadToHeadMatch => {
      const { winner } = resolveMatchOutcome(record)
      const score = (playerId: string): number => record.sides.find((side) => side.playerId === playerId)!.score
      return {
        matchId: match.id,
        editionId: match.edition.id,
        editionCode: match.edition.code,
        roundKind: match.round.kind,
        competitorScore: score(id),
        opponentScore: score(opponentId),
        winnerCompetitorId: winner.playerId
      }
    })
  return { ...summary, matches }
}

/** Toutes les paires du joueur (`n (v/d)`), les adversaires les plus rencontrés d'abord. */
export const listHeadToHeadSummaries = async (id: string): Promise<IHeadToHeadSummary[]> => {
  const db = await useDataSource()
  const competitor = await findPublicCompetitor(db, id)
  const byOpponent = new Map<string, IMatchRecord[]>()
  for (const { record } of await loadRegularMatches(db, id)) {
    for (const side of record.sides) {
      if (side.playerId !== id) {
        byOpponent.set(side.playerId, [...(byOpponent.get(side.playerId) ?? []), record])
      }
    }
  }
  if (byOpponent.size === 0) {
    return []
  }

  const opponents = await db.getRepository(CompetitorEntity).createQueryBuilder('c')
    .select(PUBLIC_COLUMNS)
    .where('c.id IN (:...ids)', { ids: [...byOpponent.keys()] })
    .getMany()

  return opponents
    .map((opponent) => toSummary(competitor, toCompetitorPublic(opponent), byOpponent.get(opponent.id)!))
    .filter((summary) => summary.played > 0)
    .sort((a, b) => b.played - a.played || a.opponent.displayName.localeCompare(b.opponent.displayName))
}

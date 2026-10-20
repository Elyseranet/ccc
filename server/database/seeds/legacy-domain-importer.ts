import {
  In,
  type DataSource,
  type EntityManager,
  type EntityTarget,
  type ObjectLiteral,
  type QueryDeepPartialEntity,
} from 'typeorm'
import { COMPETITOR_ALIAS_SOURCE } from '../../../shared/enums/competitor.enum.js'
import { EDITION_ORIGIN, EDITION_STATUS } from '../../../shared/enums/edition.enum.js'
import { MATCH_PURPOSE, MATCH_STATUS } from '../../../shared/enums/match.enum.js'
import { ROUND_STATUS } from '../../../shared/enums/round.enum.js'
import { LEGACY_INSERT_BATCH_SIZE, LEGACY_SHEET_DATA, LEGACY_SHEET_SCORES } from '../../consts/legacy-import.const.js'
import { LEGACY_IMPORT_ERROR_CODE } from '../../enums/legacy-import.enum.js'
import type {
  IDesiredRow,
  ILegacyImportResult,
  ISyncResult,
  ILegacyDomainPlan,
  ILegacyImportReport,
  ILegacyTableCounts,
  ILegacyVerification,
} from '../../interfaces/legacy-import.interface.js'
import type { IRankingEdition, IScoredParticipation, IStagedParticipation } from '../../interfaces/ranking.interface.js'
import type { IMatchRecord } from '../../interfaces/stats.interface.js'
import type { TLegacyIdentityMapEntry } from '../../types/legacy-import.type.js'
import { LegacyImportError } from '../../utils/legacy/legacy-import-error.util.js'
import { parseLegacyWorkbook } from '../../utils/legacy/legacy-workbook-parser.util.js'
import { verifyAgainstWorkbook } from '../../utils/legacy/legacy-verification.util.js'
import { CompetitorAliasEntity } from '../entities/competitor-alias.entity.js'
import { CompetitorEntity } from '../entities/competitor.entity.js'
import { EditionEntity } from '../entities/edition.entity.js'
import { LegacyWorkbookImportEntity } from '../entities/legacy-workbook-import.entity.js'
import { LegacyWorkbookRowEntity } from '../entities/legacy-workbook-row.entity.js'
import { MatchSideEntity } from '../entities/match-side.entity.js'
import { MatchEntity } from '../entities/match.entity.js'
import { ParticipationEntity } from '../entities/participation.entity.js'
import { PoolEntity } from '../entities/pool.entity.js'
import { RoundEntity } from '../entities/round.entity.js'
import type { ILegacyWorkbookRow } from '../interfaces/legacy-workbook.interface.js'

const emptyCounts = (read: number, ignored = 0): ILegacyTableCounts => ({
  read,
  created: 0,
  updated: 0,
  unchanged: 0,
  ignored,
})

/**
 * Upsert sur clé naturelle : une ligne existante est mise à jour seulement si une valeur diffère
 * (son `id` ne change jamais), une ligne absente est insérée par lots.
 */
async function syncRows<E extends ObjectLiteral & { id: string }>(
  manager: EntityManager,
  target: EntityTarget<E>,
  existing: readonly E[],
  keyOf: (row: E) => string,
  desired: readonly IDesiredRow[],
  ignored = 0,
): Promise<ISyncResult> {
  const byKey = new Map(existing.map((row) => [keyOf(row), row]))
  const counts = emptyCounts(desired.length, ignored)
  const ids = new Map<string, string>()
  const toInsert: IDesiredRow[] = []
  for (const row of desired) {
    const current = byKey.get(row.key)
    if (!current) {
      toInsert.push(row)
      continue
    }
    ids.set(row.key, current.id)
    const changed = Object.fromEntries(
      Object.entries(row.values).filter(([field, value]) => (current as Record<string, unknown>)[field] !== value),
    )
    if (Object.keys(changed).length === 0) {
      counts.unchanged += 1
    } else {
      await manager.update(target, current.id, changed as QueryDeepPartialEntity<E>)
      counts.updated += 1
    }
  }
  for (let start = 0; start < toInsert.length; start += LEGACY_INSERT_BATCH_SIZE) {
    const chunk = toInsert.slice(start, start + LEGACY_INSERT_BATCH_SIZE)
    const result = await manager.insert(target, chunk.map((row) => row.values) as QueryDeepPartialEntity<E>[])
    chunk.forEach((row, index) => ids.set(row.key, (result.identifiers[index] as { id: string }).id))
    counts.created += chunk.length
  }
  return { ids, counts }
}

const toSourceRows = (rows: readonly LegacyWorkbookRowEntity[]): ILegacyWorkbookRow[] =>
  rows.map((row) => ({ rowNumber: row.rowNumber, values: row.cellValues }))

/** Lit l'archive la plus récente (`legacy_workbook_*`, alimentée par `db:seed:legacy`). */
export async function loadLegacySource(
  manager: EntityManager,
): Promise<{ sourceSha256: string; dataRows: ILegacyWorkbookRow[]; scoresRows: ILegacyWorkbookRow[] }> {
  const latest = await manager.find(LegacyWorkbookImportEntity, { order: { importedAt: 'DESC' }, take: 1 })
  const sourceSha256 = latest[0]?.sourceSha256
  if (!sourceSha256) {
    throw new LegacyImportError(
      LEGACY_IMPORT_ERROR_CODE.SOURCE_INVALID,
      'Archive du classeur absente : lancer npm run db:seed:legacy',
    )
  }
  const rowsOf = (sheetName: string) =>
    manager.find(LegacyWorkbookRowEntity, { where: { sourceSha256, sheetName }, order: { rowNumber: 'ASC' } })
  return {
    sourceSha256,
    dataRows: toSourceRows(await rowsOf(LEGACY_SHEET_DATA)),
    scoresRows: toSourceRows(await rowsOf(LEGACY_SHEET_SCORES)),
  }
}

async function writePlan(manager: EntityManager, plan: ILegacyDomainPlan): Promise<Record<string, ILegacyTableCounts>> {
  const counts: Record<string, ILegacyTableCounts> = {}
  const codes = plan.editions.map((edition) => edition.code)

  // Éditions : jamais une édition APP (garde-fou), seulement les champs que la source fournit.
  const existingEditions = await manager.find(EditionEntity, { where: { code: In(codes) } })
  const foreign = existingEditions.filter((edition) => edition.origin !== EDITION_ORIGIN.LEGACY_IMPORT)
  if (foreign.length > 0) {
    throw new LegacyImportError(
      LEGACY_IMPORT_ERROR_CODE.TARGET_CONFLICT,
      'Une édition de l\'application porte le code d\'une édition legacy',
      foreign.map((edition) => edition.code),
    )
  }
  const editions = await syncRows(
    manager,
    EditionEntity,
    existingEditions,
    (row) => row.code,
    plan.editions.map((edition) => ({
      key: edition.code,
      values: {
        code: edition.code,
        year: edition.year,
        chronologicalRank: edition.chronologicalRank,
        participantCount: edition.participantCount,
        comment: edition.comment,
        status: EDITION_STATUS.CLOSED,
        origin: EDITION_ORIGIN.LEGACY_IMPORT,
      },
    })),
  )
  counts.editions = editions.counts
  const editionIds = [...editions.ids.values()]
  const editionCodeById = new Map([...editions.ids].map(([code, id]) => [id, code]))

  const pools = await syncRows(
    manager,
    PoolEntity,
    await manager.find(PoolEntity, { where: { editionId: In(editionIds) } }),
    (row) => `${editionCodeById.get(row.editionId)}|${row.rank}`,
    plan.pools.map((pool) => ({
      key: `${pool.editionCode}|${pool.rank}`,
      values: { editionId: editions.ids.get(pool.editionCode), rank: pool.rank },
    })),
  )
  counts.pools = pools.counts

  const rounds = await syncRows(
    manager,
    RoundEntity,
    await manager.find(RoundEntity, { where: { editionId: In(editionIds) } }),
    (row) => `${editionCodeById.get(row.editionId)}|${row.kind}`,
    plan.rounds.map((round) => ({
      key: `${round.editionCode}|${round.kind}`,
      values: {
        editionId: editions.ids.get(round.editionCode),
        kind: round.kind,
        sequence: round.sequence,
        status: ROUND_STATUS.COMPLETED,
      },
    })),
  )
  counts.rounds = rounds.counts

  // Compétiteurs : créés une fois, jamais réécrits (un nom corrigé dans l'application survit à un rejeu).
  const existingAliases = await manager.find(CompetitorAliasEntity)
  const aliasByText = new Map(existingAliases.map((alias) => [alias.alias, alias]))
  const competitorIds = new Map<string, string>()
  const competitorCounts = emptyCounts(plan.competitors.length)
  const aliasCounts = emptyCounts(plan.competitors.reduce((total, competitor) => total + competitor.aliases.length, 0))
  const conflicts: string[] = []
  for (const competitor of plan.competitors) {
    const wanted = aliasByText.get(competitor.key)?.competitorId
    if (wanted === undefined) {
      const created = await manager.insert(CompetitorEntity, { displayName: competitor.displayName })
      competitorIds.set(competitor.key, (created.identifiers[0] as { id: string }).id)
      competitorCounts.created += 1
    } else {
      competitorIds.set(competitor.key, wanted)
      competitorCounts.unchanged += 1
    }
    for (const alias of competitor.aliases) {
      const present = aliasByText.get(alias.alias)
      if (present && present.competitorId !== competitorIds.get(competitor.key)) {
        conflicts.push(`« ${alias.alias} » est déjà l'alias d'un autre compétiteur`)
      }
    }
  }
  if (conflicts.length > 0) {
    throw new LegacyImportError(LEGACY_IMPORT_ERROR_CODE.TARGET_CONFLICT, 'Alias déjà rattachés ailleurs', conflicts)
  }
  const missingAliases = plan.competitors.flatMap((competitor) =>
    competitor.aliases
      .filter((alias) => !aliasByText.has(alias.alias))
      .map((alias) => ({
        competitorId: competitorIds.get(competitor.key)!,
        alias: alias.alias,
        source: alias.source,
      })),
  )
  for (let start = 0; start < missingAliases.length; start += LEGACY_INSERT_BATCH_SIZE) {
    await manager.insert(CompetitorAliasEntity, missingAliases.slice(start, start + LEGACY_INSERT_BATCH_SIZE))
  }
  aliasCounts.created = missingAliases.length
  aliasCounts.unchanged = aliasCounts.read - missingAliases.length
  counts.competitors = competitorCounts
  counts.competitor_aliases = aliasCounts

  const competitorIdByParticipation = (editionCode: string, key: string) =>
    `${editionCode}|${competitorIds.get(key)}`
  const participations = await syncRows(
    manager,
    ParticipationEntity,
    await manager.find(ParticipationEntity, { where: { editionId: In(editionIds) } }),
    (row) => `${editionCodeById.get(row.editionId)}|${row.competitorId}`,
    plan.participations.map((participation) => ({
      key: competitorIdByParticipation(participation.editionCode, participation.competitorKey),
      values: {
        editionId: editions.ids.get(participation.editionCode),
        competitorId: competitorIds.get(participation.competitorKey),
        poolId:
          participation.poolRank === null
            ? null
            : pools.ids.get(`${participation.editionCode}|${participation.poolRank}`),
        status: participation.status,
        finalStage: participation.finalStage,
        points: participation.points,
      },
    })),
  )
  counts.participations = participations.counts

  const matches = await syncRows(
    manager,
    MatchEntity,
    await manager.find(MatchEntity, { where: { editionId: In(editionIds) } }),
    (row) => row.legacyCode ?? row.id,
    plan.matches.map((match) => ({
      key: match.legacyCode,
      values: {
        editionId: editions.ids.get(match.editionCode),
        roundId: rounds.ids.get(`${match.editionCode}|${match.roundKind}`),
        poolId: match.poolRank === null ? null : pools.ids.get(`${match.editionCode}|${match.poolRank}`),
        sequence: match.sequence,
        legacyCode: match.legacyCode,
        purpose: MATCH_PURPOSE.REGULAR,
        targetScore: match.targetScore,
        status: match.status,
        comment: match.comment,
      },
    })),
    plan.sourceCounts.matchRowsTemplate,
  )
  counts.matches = matches.counts

  const matchIds = [...matches.ids.values()]
  const matchCodeById = new Map([...matches.ids].map(([code, id]) => [id, code]))
  const existingSides: MatchSideEntity[] = []
  for (let start = 0; start < matchIds.length; start += LEGACY_INSERT_BATCH_SIZE) {
    existingSides.push(
      ...(await manager.find(MatchSideEntity, { where: { matchId: In(matchIds.slice(start, start + LEGACY_INSERT_BATCH_SIZE)) } })),
    )
  }
  const sides = await syncRows(
    manager,
    MatchSideEntity,
    existingSides,
    (row) => `${matchCodeById.get(row.matchId)}|${row.position}`,
    plan.matches.flatMap((match) =>
      match.sides.map((side) => ({
        key: `${match.legacyCode}|${side.position}`,
        values: {
          matchId: matches.ids.get(match.legacyCode),
          position: side.position,
          participationId: participations.ids.get(competitorIdByParticipation(match.editionCode, side.competitorKey)),
          recordedScore: side.score,
          validatedScore: side.score,
        },
      })),
    ),
  )
  counts.match_sides = sides.counts
  return counts
}

/** Relit la base (donc ce qui est réellement persisté) et compare les classements recalculés au classeur. */
async function verifyPersisted(manager: EntityManager, plan: ILegacyDomainPlan): Promise<ILegacyVerification> {
  const editionRows = await manager.find(EditionEntity, {
    where: { code: In(plan.editions.map((edition) => edition.code)), origin: EDITION_ORIGIN.LEGACY_IMPORT },
  })
  const editionIds = editionRows.map((edition) => edition.id)
  const editions: IRankingEdition[] = editionRows.map((edition) => ({
    id: edition.id,
    chronologicalRank: edition.chronologicalRank,
    status: edition.status,
  }))
  const participations = await manager.find(ParticipationEntity, { where: { editionId: In(editionIds) } })
  const scored: IScoredParticipation[] = participations.flatMap((row) =>
    row.points === null ? [] : [{ playerId: row.competitorId, editionId: row.editionId, points: row.points }],
  )
  const staged: IStagedParticipation[] = participations.flatMap((row) =>
    row.finalStage === null ? [] : [{ playerId: row.competitorId, editionId: row.editionId, finalStage: row.finalStage }],
  )
  const participantCompetitor = new Map(participations.map((row) => [row.id, row.competitorId]))
  const matchRows = await manager.find(MatchEntity, {
    where: { editionId: In(editionIds) },
    relations: { sides: true },
  })
  const matches: IMatchRecord[] = matchRows.map((match) => ({
    status: match.status,
    purpose: match.purpose,
    sides: [...match.sides]
      .sort((a, b) => a.position - b.position)
      .map((side) => ({
        playerId: participantCompetitor.get(side.participationId)!,
        score: match.status === MATCH_STATUS.VALIDATED ? (side.validatedScore ?? 0) : 0,
      })),
  }))
  const dataAliases = await manager.find(CompetitorAliasEntity, { where: { source: COMPETITOR_ALIAS_SOURCE.LEGACY_DATA } })
  const nameByPlayerId = new Map(dataAliases.map((alias) => [alias.competitorId, alias.alias]))
  const playersOutsideWorkbook = plan.competitors
    .filter((competitor) => !plan.players.some((player) => player.name === competitor.key))
    .map((competitor) => competitor.displayName)
  return verifyAgainstWorkbook({
    players: plan.players,
    mergedPlayerNames: plan.mergedPlayerNames,
    nameByPlayerId,
    editions,
    scored,
    staged,
    matches,
    playersOutsideWorkbook,
  })
}

function buildReport(
  plan: ILegacyDomainPlan,
  sourceSha256: string,
  counts: Record<string, ILegacyTableCounts>,
  identityMap: readonly TLegacyIdentityMapEntry[],
  verification: ILegacyVerification | null,
  generatedAt: Date,
): ILegacyImportReport {
  const matchStatusCounts: Record<string, number> = {}
  for (const match of plan.matches) {
    matchStatusCounts[match.status] = (matchStatusCounts[match.status] ?? 0) + 1
  }
  return {
    generatedAt: generatedAt.toISOString(),
    sourceSha256,
    counts,
    matchStatusCounts,
    editions: plan.editions.map((edition) => {
      const own = plan.participations.filter((participation) => participation.editionCode === edition.code)
      return {
        code: edition.code,
        participantCount: edition.participantCount,
        participantsListed: own.filter((participation) => participation.points !== null).length,
        participantsPlayedWithoutPoints: own.filter((participation) => participation.points === null).length,
      }
    }),
    anomalies: plan.anomalies,
    aliasMerges: identityMap.flatMap((entry) => ('competitor' in entry ? [entry] : [])),
    aliasCreations: identityMap.flatMap((entry) => ('create' in entry ? [entry.alias] : [])),
    verification,
  }
}

/**
 * Reprise complète en une transaction. Le plan est construit avant d'ouvrir la transaction : une graphie non
 * résolue lève sans rien écrire. Si les classements recalculés diffèrent du classeur, la transaction est annulée.
 */
export async function importLegacyDomain(
  dataSource: DataSource,
  identityMap: readonly TLegacyIdentityMapEntry[],
  now: () => Date = () => new Date(),
): Promise<ILegacyImportResult> {
  const source = await loadLegacySource(dataSource.manager)
  const plan = parseLegacyWorkbook({
    dataRows: source.dataRows,
    scoresRows: source.scoresRows,
    identityMap,
  })

  const holder: { report: ILegacyImportReport | null } = { report: null }
  try {
    await dataSource.transaction(async (manager) => {
      const counts = await writePlan(manager, plan)
      const verification = await verifyPersisted(manager, plan)
      holder.report = buildReport(plan, source.sourceSha256, counts, identityMap, verification, now())
      if (verification.blockingMismatches > 0) {
        throw new LegacyImportError(
          LEGACY_IMPORT_ERROR_CODE.VERIFICATION_FAILED,
          `${verification.blockingMismatches} écart(s) avec le classeur : import annulé`,
        )
      }
    })
  } catch (error) {
    if (error instanceof LegacyImportError && error.code === LEGACY_IMPORT_ERROR_CODE.VERIFICATION_FAILED && holder.report) {
      return { report: holder.report, committed: false }
    }
    throw error
  }
  return { report: holder.report!, committed: true }
}

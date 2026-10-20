import { COMPETITOR_ALIAS_SOURCE } from '../../../shared/enums/competitor.enum.js'
import { MATCH_PURPOSE, MATCH_STATUS } from '../../../shared/enums/match.enum.js'
import { FINAL_STAGE, PARTICIPATION_STATUS } from '../../../shared/enums/participation.enum.js'
import { ROUND_KIND } from '../../../shared/enums/round.enum.js'
import {
  LEGACY_DATA_COLUMN,
  LEGACY_DATA_ROW,
  LEGACY_EMPTY_MARK,
  LEGACY_MATCH_ID_PATTERN,
  LEGACY_POOL_LABEL_PATTERN,
  LEGACY_ROUND_KIND_BY_LABEL,
  LEGACY_SCORES_COLUMN,
  LEGACY_WIN_LOSS_PATTERN,
  LOST_STAGE_BY_ROUND_KIND,
  ROUND_KIND_ORDER,
} from '../../consts/legacy-import.const.js'
import {
  LEGACY_ANOMALY_CODE,
  LEGACY_FINAL_STAGE_SOURCE,
  LEGACY_IMPORT_ERROR_CODE,
  type LEGACY_ROUND_LABEL,
} from '../../enums/legacy-import.enum.js'
import type { ILegacyWorkbookRow } from '../../database/interfaces/legacy-workbook.interface.js'
import type {
  ILegacyParserInput,
  IParsedLabel,
  IRawMatch,
  ILegacyAnomaly,
  ILegacyCompetitorPlan,
  ILegacyDomainPlan,
  ILegacyEditionPlan,
  ILegacyMatchPlan,
  ILegacyParticipationPlan,
  ILegacyPoolPlan,
  ILegacyRoundPlan,
  ILegacyWorkbookPlayer,
} from '../../interfaces/legacy-import.interface.js'
import type { TLegacyCell, TLegacyIdentityMapEntry } from '../../types/legacy-import.type.js'
import { targetScore, validateScore } from '../match/score-rules.util.js'
import { computeParticipationPoints, computeParticipationPointsCents } from '../scoring/points.util.js'
import { toCents } from '../ranking/ranking.util.js'
import { LegacyImportError } from './legacy-import-error.util.js'

const fail = (code: LEGACY_IMPORT_ERROR_CODE, message: string, details: string[] = []): never => {
  throw new LegacyImportError(code, message, details)
}

const asText = (cell: TLegacyCell): string | null => (typeof cell === 'string' ? cell : null)
const asNumber = (cell: TLegacyCell): number | null => (typeof cell === 'number' ? cell : null)
const isName = (cell: TLegacyCell): cell is string =>
  typeof cell === 'string' && cell.trim() !== '' && cell !== LEGACY_EMPTY_MARK

/** Valide le fichier de correspondance : graphies uniques, cibles présentes dans `Data`, aucune graphie déjà exacte dans `Data`. */
function indexIdentityMap(
  entries: readonly TLegacyIdentityMapEntry[],
  dataNames: ReadonlySet<string>,
): Map<string, TLegacyIdentityMapEntry> {
  const problems: string[] = []
  const byAlias = new Map<string, TLegacyIdentityMapEntry>()
  for (const entry of entries) {
    if (typeof entry?.alias !== 'string' || entry.alias === '') {
      problems.push('entrée sans graphie')
      continue
    }
    if (byAlias.has(entry.alias)) {
      problems.push(`graphie en double : « ${entry.alias} »`)
    }
    if (dataNames.has(entry.alias)) {
      problems.push(`« ${entry.alias} » est déjà un nom exact de Data, la correspondance est inutile`)
    }
    const isMerge = 'competitor' in entry
    const isCreate = 'create' in entry && entry.create === true
    if (isMerge === isCreate) {
      problems.push(`« ${entry.alias} » : fournir soit « competitor », soit « create: true »`)
    } else if (isMerge && !dataNames.has(entry.competitor)) {
      problems.push(`« ${entry.alias} » : compétiteur « ${entry.competitor} » absent de Data (graphie exacte)`)
    }
    byAlias.set(entry.alias, entry)
  }
  if (problems.length > 0) {
    fail(LEGACY_IMPORT_ERROR_CODE.IDENTITY_MAP_INVALID, 'Fichier de correspondance invalide', problems)
  }
  return byAlias
}

function parseEditions(dataRows: ReadonlyMap<number, readonly TLegacyCell[]>): ILegacyEditionPlan[] {
  const codes = dataRows.get(LEGACY_DATA_ROW.EDITION_CODES)
  const counts = dataRows.get(LEGACY_DATA_ROW.PARTICIPANT_COUNTS)
  if (!codes || !counts) {
    fail(LEGACY_IMPORT_ERROR_CODE.SOURCE_INVALID, 'Lignes d\'en-tête de Data introuvables')
  }
  const editions: ILegacyEditionPlan[] = []
  for (let column = LEGACY_DATA_COLUMN.FIRST_EDITION; column < codes!.length; column += 1) {
    const rawCode = codes![column]
    if (rawCode === null || rawCode === undefined || rawCode === '') {
      break
    }
    const code = String(rawCode)
    const participantCount = asNumber(counts![column])
    if (!/^\d{4}[ab]?$/.test(code) || participantCount === null || !Number.isInteger(participantCount) || participantCount <= 0) {
      fail(LEGACY_IMPORT_ERROR_CODE.SOURCE_INVALID, `Édition illisible en colonne ${column + 1} de Data`, [
        `code=${code}`,
        `N=${String(counts![column])}`,
      ])
    }
    editions.push({
      code,
      year: Number.parseInt(code, 10),
      chronologicalRank: editions.length + 1,
      participantCount: participantCount!,
      comment: null,
    })
  }
  if (editions.length === 0) {
    fail(LEGACY_IMPORT_ERROR_CODE.SOURCE_INVALID, 'Aucune édition dans Data')
  }
  return editions
}

function parsePlayers(
  dataRows: ReadonlyMap<number, readonly TLegacyCell[]>,
  editions: readonly ILegacyEditionPlan[],
): { players: ILegacyWorkbookPlayer[]; points: Map<string, Array<number | null>> } {
  const players: ILegacyWorkbookPlayer[] = []
  const points = new Map<string, Array<number | null>>()
  const rowNumbers = [...dataRows.keys()].filter((row) => row >= LEGACY_DATA_ROW.FIRST_PLAYER).sort((a, b) => a - b)
  for (const rowNumber of rowNumbers) {
    const values = dataRows.get(rowNumber)!
    const name = asText(values[LEGACY_DATA_COLUMN.NAME])
    if (name === null || name.trim() === '') {
      continue
    }
    if (points.has(name)) {
      fail(LEGACY_IMPORT_ERROR_CODE.SOURCE_INVALID, `Nom en double dans Data : « ${name} »`)
    }
    const winLoss = LEGACY_WIN_LOSS_PATTERN.exec(String(values[LEGACY_DATA_COLUMN.WIN_LOSS] ?? ''))
    const editionPoints = editions.map((_, index) => asNumber(values[LEGACY_DATA_COLUMN.FIRST_EDITION + index]))
    points.set(name, editionPoints)
    players.push({
      name,
      rowNumber,
      acp: Number(values[LEGACY_DATA_COLUMN.ACP]),
      allTime: Number(values[LEGACY_DATA_COLUMN.ALL_TIME]),
      acpRank: Number(values[LEGACY_DATA_COLUMN.ACP_RANK]),
      allTimeRank: Number(values[LEGACY_DATA_COLUMN.ALL_TIME_RANK]),
      participations: Number(values[LEGACY_DATA_COLUMN.PARTICIPATIONS]),
      titles: String(values[LEGACY_DATA_COLUMN.TITLES] ?? '').length,
      wins: winLoss ? Number(winLoss[1]) : Number.NaN,
      losses: winLoss ? Number(winLoss[2]) : Number.NaN,
    })
  }
  return { players, points }
}

function parseScores(
  scoresRows: readonly ILegacyWorkbookRow[],
  editionCodes: ReadonlySet<string>,
): {
  matches: IRawMatch[]
  headerComments: Map<string, string>
  headers: number
  read: number
  templates: number
} {
  const matches: IRawMatch[] = []
  const headerComments = new Map<string, string>()
  let headers = 0
  let read = 0
  let templates = 0
  for (const row of scoresRows) {
    const idMatch = LEGACY_MATCH_ID_PATTERN.exec(String(row.values[LEGACY_SCORES_COLUMN.ID] ?? ''))
    if (!idMatch) {
      continue
    }
    const [legacyCode, editionCode, rankText] = idMatch as unknown as [string, string, string]
    if (!editionCodes.has(editionCode)) {
      fail(LEGACY_IMPORT_ERROR_CODE.SOURCE_INVALID, `Édition inconnue de Data dans scores : ${legacyCode}`)
    }
    const sequence = Number(rankText)
    const comment = asText(row.values[LEGACY_SCORES_COLUMN.COMMENT])
    if (sequence === 0) {
      headers += 1
      if (comment !== null && comment.trim() !== '') {
        headerComments.set(editionCode, comment)
      }
      continue
    }
    read += 1
    const adv1 = row.values[LEGACY_SCORES_COLUMN.ADV1]
    const adv2 = row.values[LEGACY_SCORES_COLUMN.ADV2]
    const score1 = asNumber(row.values[LEGACY_SCORES_COLUMN.SCORE1])
    const score2 = asNumber(row.values[LEGACY_SCORES_COLUMN.SCORE2])
    const named1 = isName(adv1)
    const named2 = isName(adv2)
    if (!named1 && !named2) {
      if (score1 !== null || score2 !== null) {
        fail(LEGACY_IMPORT_ERROR_CODE.SOURCE_INVALID, `Score sans adversaire nommé : ${legacyCode}`)
      }
      templates += 1
      continue
    }
    if (!named1 || !named2) {
      fail(LEGACY_IMPORT_ERROR_CODE.SOURCE_INVALID, `Un seul adversaire nommé : ${legacyCode}`)
    }
    if ((score1 === null) !== (score2 === null)) {
      fail(LEGACY_IMPORT_ERROR_CODE.SOURCE_INVALID, `Un seul score renseigné : ${legacyCode}`)
    }
    matches.push({
      legacyCode,
      editionCode,
      sequence,
      label: asText(row.values[LEGACY_SCORES_COLUMN.ROUND]) ?? '',
      adv1: adv1 as string,
      adv2: adv2 as string,
      score1,
      score2,
      comment: comment !== null && comment.trim() !== '' ? comment : null,
    })
  }
  return { matches, headerComments, headers, read, templates }
}

function parseRoundLabel(label: string, legacyCode: string): IParsedLabel {
  const pool = LEGACY_POOL_LABEL_PATTERN.exec(label)
  if (pool) {
    return { kind: ROUND_KIND.POOLS, poolRank: Number(pool[1]) }
  }
  const kind = LEGACY_ROUND_KIND_BY_LABEL[label as LEGACY_ROUND_LABEL]
  if (kind === undefined) {
    return fail(LEGACY_IMPORT_ERROR_CODE.SOURCE_INVALID, `Libellé de tour inconnu : « ${label} » (${legacyCode})`)
  }
  return { kind, poolRank: null }
}

/** Stade d'un joueur dont les points sortent du barème : celui du tour où il a été battu (ou CHAMPION s'il a gagné la finale). */
function stageFromMatches(playerMatches: readonly ILegacyMatchPlan[], key: string): FINAL_STAGE | null {
  const knockout = playerMatches
    .filter((match) => match.status === MATCH_STATUS.VALIDATED && match.roundKind !== ROUND_KIND.POOLS)
    .sort((a, b) => ROUND_KIND_ORDER.indexOf(b.roundKind) - ROUND_KIND_ORDER.indexOf(a.roundKind))
  const deepest = knockout[0]
  if (!deepest) {
    return null
  }
  const mine = deepest.sides.find((side) => side.competitorKey === key)!
  const theirs = deepest.sides.find((side) => side.competitorKey !== key)!
  const won = (mine.score ?? 0) > (theirs.score ?? 0)
  if (won) {
    return deepest.roundKind === ROUND_KIND.FINAL ? FINAL_STAGE.CHAMPION : null
  }
  return LOST_STAGE_BY_ROUND_KIND[deepest.roundKind] ?? null
}

function stageFromScale(points: number, participantCount: number): FINAL_STAGE | null {
  const cents = toCents(points)
  return (
    Object.values(FINAL_STAGE).find(
      (stage) => computeParticipationPointsCents(stage, participantCount) === cents,
    ) ?? null
  )
}

/**
 * Transforme les onglets `Data` et `scores` en un plan d'écriture, sans toucher à la base.
 * Toute graphie de `scores` absente de `Data` doit figurer dans le fichier de correspondance, sinon l'appel lève
 * avant qu'aucune écriture ne soit tentée (graphie exacte, casse comprise).
 */
export function parseLegacyWorkbook(input: ILegacyParserInput): ILegacyDomainPlan {
  const dataRows = new Map(input.dataRows.map((row) => [row.rowNumber, row.values as readonly TLegacyCell[]]))
  const editions = parseEditions(dataRows)
  const editionByCode = new Map(editions.map((edition) => [edition.code, edition]))
  const { players, points } = parsePlayers(dataRows, editions)
  const dataNames = new Set(players.map((player) => player.name))
  const identity = indexIdentityMap(input.identityMap, dataNames)
  const scores = parseScores(input.scoresRows, new Set(editionByCode.keys()))

  // Résolution des identités : graphie exacte de Data, sinon fichier de correspondance, sinon refus.
  const resolveKey = (name: string): string | null => {
    if (dataNames.has(name)) {
      return name
    }
    const entry = identity.get(name)
    if (!entry) {
      return null
    }
    return 'competitor' in entry ? entry.competitor : entry.alias
  }
  const unresolved = new Set<string>()
  for (const raw of scores.matches) {
    for (const name of [raw.adv1, raw.adv2]) {
      if (resolveKey(name) === null) {
        unresolved.add(name)
      }
    }
  }
  if (unresolved.size > 0) {
    fail(
      LEGACY_IMPORT_ERROR_CODE.UNRESOLVED_ALIAS,
      'Graphies de scores sans correspondance exacte (casse comprise)',
      [...unresolved].sort().map((name) => `« ${name} »`),
    )
  }

  // Compétiteurs : 145 de Data, plus les créations décidées (A5).
  const competitors: ILegacyCompetitorPlan[] = players.map((player) => ({
    key: player.name,
    displayName: player.name.trim(),
    aliases: [{ alias: player.name, source: COMPETITOR_ALIAS_SOURCE.LEGACY_DATA }],
  }))
  const competitorByKey = new Map(competitors.map((competitor) => [competitor.key, competitor]))
  for (const entry of identity.values()) {
    if ('create' in entry) {
      const created: ILegacyCompetitorPlan = {
        key: entry.alias,
        displayName: entry.alias.trim(),
        aliases: [{ alias: entry.alias, source: COMPETITOR_ALIAS_SOURCE.LEGACY_SCORES }],
      }
      competitors.push(created)
      competitorByKey.set(created.key, created)
    } else {
      competitorByKey.get(entry.competitor)!.aliases.push({
        alias: entry.alias,
        source: COMPETITOR_ALIAS_SOURCE.LEGACY_SCORES,
      })
    }
  }
  const mergedPlayerNames = [...identity.values()]
    .filter((entry): entry is Extract<TLegacyIdentityMapEntry, { competitor: string }> => 'competitor' in entry)
    .filter((entry) => entry.alias.toLowerCase() !== entry.competitor.toLowerCase())
    .map((entry) => entry.competitor)
    .filter((name, index, all) => all.indexOf(name) === index)

  // Matchs : seules les lignes nommées (A16).
  const matches: ILegacyMatchPlan[] = scores.matches.map((raw) => {
    const { kind, poolRank } = parseRoundLabel(raw.label, raw.legacyCode)
    const key1 = resolveKey(raw.adv1)!
    const key2 = resolveKey(raw.adv2)!
    if (key1 === key2) {
      fail(LEGACY_IMPORT_ERROR_CODE.SOURCE_INVALID, `Un joueur contre lui-même après correspondance : ${raw.legacyCode}`, [
        `« ${raw.adv1} » / « ${raw.adv2} »`,
      ])
    }
    const scored = raw.score1 !== null && raw.score2 !== null
    if (scored) {
      const check = validateScore(kind, MATCH_PURPOSE.REGULAR, [raw.score1!, raw.score2!])
      if (!check.valid) {
        fail(LEGACY_IMPORT_ERROR_CODE.SOURCE_INVALID, `Score incohérent : ${raw.legacyCode}`, [check.reason ?? ''])
      }
    }
    return {
      legacyCode: raw.legacyCode,
      editionCode: raw.editionCode,
      sequence: raw.sequence,
      roundKind: kind,
      poolRank,
      targetScore: targetScore(kind, MATCH_PURPOSE.REGULAR, 2),
      status: scored ? MATCH_STATUS.VALIDATED : MATCH_STATUS.RESULT_UNKNOWN,
      comment: raw.comment,
      sides: [
        { position: 1, competitorKey: key1, score: raw.score1 },
        { position: 2, competitorKey: key2, score: raw.score2 },
      ],
    }
  })

  // Poules et tours d'après les libellés rencontrés.
  const pools: ILegacyPoolPlan[] = []
  const rounds: ILegacyRoundPlan[] = []
  for (const edition of editions) {
    const own = matches.filter((match) => match.editionCode === edition.code)
    const ranks = [...new Set(own.flatMap((match) => (match.poolRank === null ? [] : [match.poolRank])))].sort((a, b) => a - b)
    pools.push(...ranks.map((rank) => ({ editionCode: edition.code, rank })))
    ROUND_KIND_ORDER.filter((kind) => own.some((match) => match.roundKind === kind)).forEach((kind, index) => {
      rounds.push({ editionCode: edition.code, kind, sequence: index + 1 })
    })
    edition.comment = scores.headerComments.get(edition.code) ?? null
  }

  // Participations : une par cellule Data, plus les joueurs qui jouent sans cellule (issue inconnue).
  const matchesByParticipation = new Map<string, ILegacyMatchPlan[]>()
  const poolByParticipation = new Map<string, number>()
  const appearanceOrder: string[] = []
  for (const match of matches) {
    for (const side of match.sides) {
      const id = `${match.editionCode}|${side.competitorKey}`
      if (!matchesByParticipation.has(id)) {
        matchesByParticipation.set(id, [])
        appearanceOrder.push(id)
      }
      matchesByParticipation.get(id)!.push(match)
      if (match.poolRank !== null) {
        const known = poolByParticipation.get(id)
        if (known !== undefined && known !== match.poolRank) {
          fail(LEGACY_IMPORT_ERROR_CODE.SOURCE_INVALID, `Deux poules pour un même joueur : ${side.competitorKey}`, [
            `${match.editionCode} : Poule${known} et Poule${match.poolRank}`,
          ])
        }
        poolByParticipation.set(id, match.poolRank)
      }
    }
  }

  const anomalies: ILegacyAnomaly[] = []
  const participations: ILegacyParticipationPlan[] = []
  const withCell = new Set<string>()
  editions.forEach((edition, editionIndex) => {
    let listed = 0
    for (const player of players) {
      const cell = points.get(player.name)![editionIndex] ?? null
      if (cell === null) {
        continue
      }
      listed += 1
      const id = `${edition.code}|${player.name}`
      withCell.add(id)
      let finalStage = stageFromScale(cell, edition.participantCount)
      let source: LEGACY_FINAL_STAGE_SOURCE | null = finalStage === null ? null : LEGACY_FINAL_STAGE_SOURCE.SCALE
      if (finalStage === null) {
        finalStage = stageFromMatches(matchesByParticipation.get(id) ?? [], player.name)
        source = finalStage === null ? null : LEGACY_FINAL_STAGE_SOURCE.MATCHES
        anomalies.push({
          code: LEGACY_ANOMALY_CODE.POINTS_OFF_SCALE,
          editionCode: edition.code,
          competitor: player.name,
          detail:
            finalStage === null
              ? `Points ${cell} hors barème, stade non déductible des matchs : valeur source conservée, stade inconnu`
              : `Points ${cell} hors barème : valeur source conservée, stade ${finalStage} déduit du dernier tour joué dans scores`,
          values: {
            points: cell,
            participantCount: edition.participantCount,
            stage: finalStage,
            rg2Points: finalStage === null ? null : computeParticipationPoints(finalStage, edition.participantCount),
          },
        })
      }
      participations.push({
        editionCode: edition.code,
        competitorKey: player.name,
        points: cell,
        finalStage,
        finalStageSource: source,
        status: finalStage === FINAL_STAGE.CHAMPION ? PARTICIPATION_STATUS.WINNER : PARTICIPATION_STATUS.ELIMINATED,
        poolRank: poolByParticipation.get(id) ?? null,
      })
    }
    if (listed > edition.participantCount) {
      fail(LEGACY_IMPORT_ERROR_CODE.SOURCE_INVALID, `Plus de cellules que d'effectif déclaré en ${edition.code}`, [
        `N=${edition.participantCount}`,
        `cellules=${listed}`,
      ])
    }
    if (listed < edition.participantCount) {
      anomalies.push({
        code: LEGACY_ANOMALY_CODE.UNIDENTIFIED_PARTICIPANTS,
        editionCode: edition.code,
        competitor: null,
        detail: `${edition.participantCount - listed} participants non identifiés (N déclaré ${edition.participantCount}, ${listed} listés)`,
        values: {
          declared: edition.participantCount,
          listed,
          unidentified: edition.participantCount - listed,
        },
      })
    }
  })
  for (const id of appearanceOrder) {
    if (withCell.has(id)) {
      continue
    }
    const [editionCode, competitorKey] = id.split('|') as [string, string]
    const own = matchesByParticipation.get(id)!
    participations.push({
      editionCode,
      competitorKey,
      points: null,
      finalStage: null,
      finalStageSource: null,
      // Édition CLOSED, champion connu : le joueur est éliminé, seul le tour est inconnu.
      status: PARTICIPATION_STATUS.ELIMINATED,
      poolRank: poolByParticipation.get(id) ?? null,
    })
    anomalies.push({
      code: LEGACY_ANOMALY_CODE.PLAYED_WITHOUT_POINTS,
      editionCode,
      competitor: competitorKey,
      detail: `Joue ${own.length} match(s) sans cellule Data pour cette édition : issue inconnue, hors classements`,
      values: { matches: own.length },
    })
  }
  const editionRank = new Map(editions.map((edition) => [edition.code, edition.chronologicalRank]))
  participations.sort((a, b) => editionRank.get(a.editionCode)! - editionRank.get(b.editionCode)!)

  return {
    editions,
    competitors,
    pools,
    rounds,
    participations,
    matches,
    anomalies,
    players,
    mergedPlayerNames,
    sourceCounts: {
      dataPlayers: players.length,
      editionHeaders: scores.headers,
      matchRowsRead: scores.read,
      matchRowsNamed: matches.length,
      matchRowsTemplate: scores.templates,
    },
  }
}

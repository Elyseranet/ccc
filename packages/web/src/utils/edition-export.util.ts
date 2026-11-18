import writeExcelFile from 'write-excel-file/node'
import type { Cell, Row, Sheet, SheetData } from 'write-excel-file/node'
import {
  EDITION_EXPORT_CHAMPION_ROW,
  EDITION_EXPORT_COLUMN_WIDTH,
  EDITION_EXPORT_DATE_FORMAT,
  EDITION_EXPORT_DATE_TIME_FORMAT,
  EDITION_EXPORT_DRAW_HEADERS,
  EDITION_EXPORT_DRAW_KIND_LABELS,
  EDITION_EXPORT_DRAW_STATUS_LABELS,
  EDITION_EXPORT_EDITION_HEADERS,
  EDITION_EXPORT_FIELDS,
  EDITION_EXPORT_FINAL_PHASE_HEADERS,
  EDITION_EXPORT_MATCH_HEADERS,
  EDITION_EXPORT_NO,
  EDITION_EXPORT_ORIGIN_LABELS,
  EDITION_EXPORT_PARTICIPANT_HEADERS,
  EDITION_EXPORT_POOL_HEADERS,
  EDITION_EXPORT_SHEET_NAMES,
  EDITION_EXPORT_SIDE_SEPARATOR,
  EDITION_EXPORT_YES
} from '../consts/edition-export.const.js'
import { EDITION_FINAL_STAGE_LABELS, EDITION_HERO_STATUS, EDITION_PARTICIPATION_STATUS_LABELS } from '../consts/edition-view.const.js'
import { ADMIN_MATCH_STATUS_VIEW } from '../consts/admin-match-status.const.js'
import { ROUND_LABELS } from '../consts/round-labels.const.js'
import { DRAW_KIND } from '../enums/draw.enum.js'
import { EDITION_EXPORT_SHEET } from '../enums/edition-export.enum.js'
import { MATCH_PURPOSE } from '../enums/match.enum.js'
import { ROUND_KIND } from '../enums/round.enum.js'
import type { ICompetitorPublic } from '../interfaces/competitor.interface.js'
import type { IEditionExportInput } from '../interfaces/edition-export.interface.js'
import type { IMatch } from '../interfaces/match.interface.js'

const { NARROW, DEFAULT, WIDE, DESCRIPTION } = EDITION_EXPORT_COLUMN_WIDTH

const header = (labels: readonly string[]): Row => labels.map((value): Cell => ({ value, fontWeight: 'bold' }))
const yesNo = (value: boolean): string => (value ? EDITION_EXPORT_YES : EDITION_EXPORT_NO)
const dateCell = (value: Date | null, format = EDITION_EXPORT_DATE_FORMAT): Cell => (value ? { value, type: Date, format } : null)
/** `YYYY-MM-DD` lu en UTC : une date sans heure ne doit jamais glisser d'un jour selon le fuseau du serveur. */
const dayOf = (iso: string | null): Date | null => (iso ? new Date(`${iso.slice(0, 10)}T00:00:00Z`) : null)
const sheet = (name: EDITION_EXPORT_SHEET, labels: readonly string[], rows: Row[], widths: number[], stickyColumnsCount = 0): Sheet<Buffer> => ({
  sheet: EDITION_EXPORT_SHEET_NAMES[name],
  data: [header(labels), ...rows] as SheetData,
  columns: widths.map((width) => ({ width })),
  stickyRowsCount: 1,
  stickyColumnsCount
})

/** Nom de famille, sinon le nom affiché pour une personne sans nom ni prénom (archives). */
const lastNameOf = (competitor: ICompetitorPublic): string | null =>
  competitor.lastName ?? (competitor.firstName ? null : competitor.displayName)

/**
 * Classeur .xlsx d'une édition (B-30) : un onglet par partie, en-têtes en français, valeurs typées (nombres, dates),
 * première ligne et première colonne figées. N'écrit que des données publiques de l'édition : jamais d'email ni de compte.
 * Un texte commençant par `=` reste du texte (la bibliothèque ne le traite en formule que sur `type: 'Formula'`).
 */
export const buildEditionWorkbook = async ({ edition, qualification, draws }: IEditionExportInput): Promise<Buffer> => {
  const poolRankById = new Map(edition.pools.map((pool) => [pool.id, pool.rank]))
  const participantByParticipation = new Map(edition.participants.map((participant) => [participant.participationId, participant]))
  const winnerOf = (match: IMatch): string | null =>
    match.sides.find((side) => side.participationId === match.winnerParticipationId)?.displayName ?? null

  const editionRows: Row[] = [
    [EDITION_EXPORT_FIELDS.YEAR, edition.year],
    [EDITION_EXPORT_FIELDS.CODE, edition.code],
    [EDITION_EXPORT_FIELDS.NAME, edition.name],
    [EDITION_EXPORT_FIELDS.HELD_ON, dateCell(dayOf(edition.heldOn))],
    [EDITION_EXPORT_FIELDS.LOCATION, edition.location],
    [EDITION_EXPORT_FIELDS.DESCRIPTION, edition.description],
    [EDITION_EXPORT_FIELDS.STATUS, EDITION_HERO_STATUS[edition.status].label.fallback],
    [EDITION_EXPORT_FIELDS.ORIGIN, EDITION_EXPORT_ORIGIN_LABELS[edition.origin]],
    [EDITION_EXPORT_FIELDS.PARTICIPANT_COUNT, edition.participantCount],
    [EDITION_EXPORT_FIELDS.REGISTERED, edition.participants.length],
    [EDITION_EXPORT_FIELDS.TOP_PER_POOL, qualification?.topPerPool ?? null],
    [EDITION_EXPORT_FIELDS.BEST_NEXT_COUNT, qualification?.bestNextCount ?? null],
    [EDITION_EXPORT_FIELDS.WITH_PLAYOFF, qualification ? yesNo(qualification.withPlayoff) : null],
    [EDITION_EXPORT_FIELDS.CLOSED_AT, dateCell(edition.closedAt ? new Date(edition.closedAt) : null, EDITION_EXPORT_DATE_TIME_FORMAT)],
    [EDITION_EXPORT_FIELDS.CHAMPION, edition.champion?.competitor.displayName ?? null],
    [EDITION_EXPORT_FIELDS.RUNNER_UP, edition.final?.runnerUp.displayName ?? null]
  ]

  const participantRows: Row[] = edition.participants.map((participant) => [
    lastNameOf(participant.competitor),
    participant.competitor.firstName,
    participant.competitor.nickname,
    participant.poolId ? poolRankById.get(participant.poolId) ?? null : null,
    yesNo(participant.isSeed),
    participant.finalStage
      ? EDITION_FINAL_STAGE_LABELS[participant.finalStage].fallback
      : EDITION_PARTICIPATION_STATUS_LABELS[participant.status].fallback,
    participant.points
  ])

  const poolRows: Row[] = edition.pools.flatMap((pool) => pool.standing.map((row): Row => [
    pool.rank, row.rank, row.competitor.displayName, row.played, row.wins, row.losses, row.pointsFor, row.pointsAgainst, row.capsAverage
  ]))

  const matchRows: Row[] = edition.matches.map((match) => {
    const [sideA, sideB, ...others] = match.sides
    return [
      ROUND_LABELS[match.roundKind].label,
      match.poolRank,
      match.sequence,
      sideA?.displayName ?? null,
      sideA?.score ?? null,
      sideB?.displayName ?? null,
      sideB?.score ?? null,
      winnerOf(match),
      ADMIN_MATCH_STATUS_VIEW[match.status].label.fallback,
      yesNo(match.purpose === MATCH_PURPOSE.TIEBREAK),
      others.length > 0 ? others.map((side) => `${side.displayName} (${side.score ?? '-'})`).join(EDITION_EXPORT_SIDE_SEPARATOR) : null
    ]
  })

  const drawRows: Row[] = draws.flatMap((draw) => [...draw.assignments]
    .sort((left, right) => left.drawnOrder - right.drawnOrder)
    .map((assignment): Row => [
      EDITION_EXPORT_DRAW_KIND_LABELS[draw.kind],
      draw.kind === DRAW_KIND.ROUND && draw.roundKind ? ROUND_LABELS[draw.roundKind].label : null,
      EDITION_EXPORT_DRAW_STATUS_LABELS[draw.status],
      assignment.drawnOrder,
      assignment.poolNumber,
      assignment.pairingIndex,
      assignment.sidePosition,
      assignment.displayName,
      yesNo(participantByParticipation.get(assignment.participationId)?.isSeed ?? false)
    ]))

  const finalPhaseRows: Row[] = edition.bracket
    .filter((round) => round.kind !== ROUND_KIND.POOLS)
    .flatMap((round) => round.matches.map((match): Row => {
      const [sideA, sideB] = match.sides
      return [ROUND_LABELS[round.kind].label, match.sequence, sideA?.displayName ?? null, sideA?.score ?? null, sideB?.displayName ?? null, sideB?.score ?? null, winnerOf(match)]
    }))
  if (edition.champion) {
    finalPhaseRows.push([EDITION_EXPORT_CHAMPION_ROW, null, edition.champion.competitor.displayName])
  }

  return writeExcelFile([
    sheet(EDITION_EXPORT_SHEET.EDITION, EDITION_EXPORT_EDITION_HEADERS, editionRows, [WIDE, DESCRIPTION], 1),
    sheet(EDITION_EXPORT_SHEET.PARTICIPANTS, EDITION_EXPORT_PARTICIPANT_HEADERS, participantRows, [DEFAULT, DEFAULT, DEFAULT, NARROW, DEFAULT, WIDE, NARROW], 1),
    sheet(EDITION_EXPORT_SHEET.POOLS, EDITION_EXPORT_POOL_HEADERS, poolRows, [NARROW, NARROW, WIDE, NARROW, NARROW, NARROW, DEFAULT, DEFAULT, DEFAULT], 3),
    sheet(EDITION_EXPORT_SHEET.MATCHES, EDITION_EXPORT_MATCH_HEADERS, matchRows, [DEFAULT, NARROW, NARROW, WIDE, NARROW, WIDE, NARROW, WIDE, WIDE, NARROW, WIDE], 3),
    sheet(EDITION_EXPORT_SHEET.DRAWS, EDITION_EXPORT_DRAW_HEADERS, drawRows, [NARROW, DEFAULT, DEFAULT, NARROW, NARROW, NARROW, NARROW, WIDE, DEFAULT], 0),
    sheet(EDITION_EXPORT_SHEET.FINAL_PHASE, EDITION_EXPORT_FINAL_PHASE_HEADERS, finalPhaseRows, [WIDE, NARROW, WIDE, NARROW, WIDE, NARROW, WIDE], 1)
  ]).toBuffer()
}

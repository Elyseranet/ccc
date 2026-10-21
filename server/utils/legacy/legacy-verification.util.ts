import { MATCH_PURPOSE, MATCH_STATUS } from '../../../shared/enums/match.enum.js'
import { LEGACY_POINTS_TOLERANCE_CENTS, NOTE_FLOAT_TIE, NOTE_MERGED_ALIAS } from '../../consts/legacy-import.const.js'
import { LEGACY_VERIFICATION_METRIC } from '../../enums/legacy-import.enum.js'
import type {
  ILegacyVerificationInput,
  ILegacyVerification,
  ILegacyVerificationMetric,
  ILegacyVerificationMismatch,
  ILegacyWorkbookPlayer,
} from '../../interfaces/legacy-import.interface.js'
import type {
  IRankingEdition,
  IScoredParticipation,
  IStagedParticipation,
} from '../../interfaces/ranking.interface.js'
import type { IMatchRecord } from '../../interfaces/stats.interface.js'
import { computeAcp, computeAllTime, computeAverage, countTitles, toCents } from '../ranking/ranking.util.js'
import { computeWinLoss } from '../stats/record.util.js'


/**
 * Compare les classements recalculés par les fonctions de domaine (B-03) à ceux du classeur.
 * Tout écart est listé. Seul le V/D d'un compétiteur fusionné par A5 est un écart attendu : la colonne F est un
 * COUNTIF sur le nom, qui ne rapproche pas la graphie fusionnée.
 */
export function verifyAgainstWorkbook(input: ILegacyVerificationInput): ILegacyVerification {
  const centsByName = (rows: ReadonlyArray<{ playerId: string; total: number; rank: number }>) =>
    new Map(rows.map((row) => [input.nameByPlayerId.get(row.playerId) ?? row.playerId, row]))
  const allTime = centsByName(computeAllTime(input.scored))
  const acp = centsByName(computeAcp(input.scored, input.editions))
  const average = new Map(
    computeAverage(input.scored).map((row) => [input.nameByPlayerId.get(row.playerId) ?? row.playerId, row]),
  )
  const titles = new Map(
    countTitles(input.staged).map((row) => [input.nameByPlayerId.get(row.playerId) ?? row.playerId, row.titles]),
  )
  const winLoss = new Map(
    computeWinLoss(input.matches).map((row) => [input.nameByPlayerId.get(row.playerId) ?? row.playerId, row]),
  )
  // Le classeur compte aussi les 175 matchs au résultat inconnu : Adv1 y vaut une victoire, Adv2 une défaite.
  const unknownWins = new Map<string, number>()
  const unknownLosses = new Map<string, number>()
  for (const match of input.matches) {
    if (match.status === MATCH_STATUS.RESULT_UNKNOWN && match.purpose === MATCH_PURPOSE.REGULAR) {
      const [first, second] = match.sides
      const bump = (map: Map<string, number>, playerId: string | undefined) => {
        const name = playerId === undefined ? undefined : (input.nameByPlayerId.get(playerId) ?? playerId)
        if (name !== undefined) {
          map.set(name, (map.get(name) ?? 0) + 1)
        }
      }
      bump(unknownWins, first?.playerId)
      bump(unknownLosses, second?.playerId)
    }
  }

  const merged = new Set(input.mergedPlayerNames)
  const metric = (
    kind: LEGACY_VERIFICATION_METRIC,
    pairs: (player: ILegacyWorkbookPlayer) => Array<[workbook: number, computed: number, tolerance: number, label: string]>,
    explain: (player: ILegacyWorkbookPlayer) => string | null = () => null,
  ): ILegacyVerificationMetric => {
    const mismatches: ILegacyVerificationMismatch[] = []
    let compared = 0
    for (const player of input.players) {
      for (const [workbook, computed, tolerance, label] of pairs(player)) {
        compared += 1
        if (!(Math.abs(workbook - computed) <= tolerance)) {
          const note =
            kind === LEGACY_VERIFICATION_METRIC.WIN_LOSS
              ? merged.has(player.name)
                ? NOTE_MERGED_ALIAS
                : null
              : explain(player)
          mismatches.push({ metric: kind, player: label, workbook, computed, expected: note !== null, note })
        }
      }
    }
    return { metric: kind, compared, mismatches }
  }
  /**
   * RANK du classeur compare des flottants : 8,76 saisi et 8,760000000000002 sommé ne sont pas à égalité pour Excel.
   * Les fonctions de domaine comptent en centièmes entiers et partagent le rang. Un écart de rang n'est donc
   * attendu que si le joueur est à égalité exacte en centièmes avec un autre que le classeur a classé différemment.
   */
  const tieBrokenByFloat = (totals: Map<string, { total: number }>, rankOf: (p: ILegacyWorkbookPlayer) => number) => {
    const ranksByCents = new Map<number, Set<number>>()
    for (const player of input.players) {
      const cents = points(totals.get(player.name)?.total)
      ranksByCents.set(cents, (ranksByCents.get(cents) ?? new Set<number>()).add(rankOf(player)))
    }
    return (player: ILegacyWorkbookPlayer): string | null =>
      (ranksByCents.get(points(totals.get(player.name)?.total))?.size ?? 0) > 1 ? NOTE_FLOAT_TIE : null
  }
  const centsTolerance = LEGACY_POINTS_TOLERANCE_CENTS
  const points = (value: number | undefined) => toCents(value ?? 0)

  const metrics: ILegacyVerificationMetric[] = [
    metric(LEGACY_VERIFICATION_METRIC.ALL_TIME, (p) => [
      [toCents(p.allTime), points(allTime.get(p.name)?.total), centsTolerance, p.name],
    ]),
    metric(LEGACY_VERIFICATION_METRIC.ACP, (p) => [
      [toCents(p.acp), points(acp.get(p.name)?.total), centsTolerance, p.name],
    ]),
    metric(
      LEGACY_VERIFICATION_METRIC.ALL_TIME_RANK,
      (p) => [[p.allTimeRank, allTime.get(p.name)?.rank ?? 0, 0, p.name]],
      tieBrokenByFloat(allTime, (p) => p.allTimeRank),
    ),
    metric(
      LEGACY_VERIFICATION_METRIC.ACP_RANK,
      (p) => [[p.acpRank, acp.get(p.name)?.rank ?? 0, 0, p.name]],
      tieBrokenByFloat(acp, (p) => p.acpRank),
    ),
    metric(LEGACY_VERIFICATION_METRIC.PARTICIPATIONS, (p) => [
      [p.participations, average.get(p.name)?.participations ?? 0, 0, p.name],
    ]),
    metric(LEGACY_VERIFICATION_METRIC.TITLES, (p) => [[p.titles, titles.get(p.name) ?? 0, 0, p.name]]),
    metric(LEGACY_VERIFICATION_METRIC.WIN_LOSS, (p) => [
      [p.wins, (winLoss.get(p.name)?.wins ?? 0) + (unknownWins.get(p.name) ?? 0), 0, `${p.name} (V)`],
      [p.losses, (winLoss.get(p.name)?.losses ?? 0) + (unknownLosses.get(p.name) ?? 0), 0, `${p.name} (D)`],
    ]),
  ]
  const blockingMismatches = metrics
    .flatMap((entry) => entry.mismatches)
    .filter((mismatch) => !mismatch.expected).length
  return { metrics, blockingMismatches, playersOutsideWorkbook: [...input.playersOutsideWorkbook] }
}

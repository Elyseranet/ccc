import { computed } from 'vue'
import type { MaybeRefOrGetter } from 'vue'
import { EDITION_STATUS } from '~/enums/edition.enum'
import { FINAL_STAGE } from '~/enums/participation.enum'
import { useCompetitor } from '~/composables/useCompetitor'
import { useCompetitorOpponents } from '~/composables/useCompetitorOpponents'
import { usePlayerFormat } from '~/composables/usePlayerFormat'
import { useT } from '~/composables/useT'
import { PLAYER_FINAL_STAGE_LABELS, PLAYER_HTTP_NOT_FOUND, PLAYER_OPPONENTS_LIMIT, PLAYER_ONGOING_LEVEL, PLAYER_POINTS_DECIMALS } from '~/consts/players.const'
import { PLAYER_JOURNEY_KIND } from '~/enums/player-journey-kind.enum'
import type { IPlayerJourneyRow, IPlayerOpponent, IPlayerParticipation } from '~/interfaces/players.interface'
import { unwrapAsyncError } from '~/utils/async-error.util'

/*********************************************************
 * usePlayerProfile
 *
 * @description
 * Fiche d'un joueur : identité publique (jamais d'email ni de téléphone), statistiques (R-5 : matchs avec score
 * seulement, `unknownResults` à part, aucun ratio : FA-12), parcours par édition et adversaires les plus fréquents.
 * Le parcours arrive en ordre chronologique ; le graphique le garde, le tableau l'inverse comme la maquette.
 ********************************************************/
export const usePlayerProfile = (id: MaybeRefOrGetter<string>) => {
  const { t } = useT()
  const { editionLabel } = usePlayerFormat()
  const detail = useCompetitor(id)
  const opponentsData = useCompetitorOpponents(id)

  const journeyRow = (participation: IPlayerParticipation): IPlayerJourneyRow => {
    const stage = participation.finalStage ? PLAYER_FINAL_STAGE_LABELS[participation.finalStage] : null
    const isOngoing = stage === null && participation.editionStatus !== EDITION_STATUS.CLOSED
    const isChampion = participation.finalStage === FINAL_STAGE.CHAMPION
    const rank = participation.poolRank
    let kind = PLAYER_JOURNEY_KIND.REACHED
    if (isChampion) {
      kind = PLAYER_JOURNEY_KIND.CHAMPION
    } else if (isOngoing) {
      kind = PLAYER_JOURNEY_KIND.ONGOING
    }
    let resultLabel = t('player.stage.unknown', '—')
    let chartLabel = resultLabel
    if (isOngoing) {
      resultLabel = t('player.stage.ongoing', 'En cours')
      chartLabel = resultLabel
    } else if (stage) {
      resultLabel = t(stage.label.key, stage.label.fallback)
      chartLabel = t(stage.chart.key, stage.chart.fallback)
    }
    let poolLabel = t('player.journey.no_pool', '—')
    if (rank !== null) {
      const rankLabel = rank === 1
        ? t('player.journey.rank_first', '1er')
        : t('player.journey.rank_other', '{rank}e', { rank })
      poolLabel = participation.poolNumber
        ? t('player.journey.pool_and_rank', 'Poule {pool} · {rank}', { pool: participation.poolNumber, rank: rankLabel })
        : rankLabel
    }
    let bilan = t('player.journey.no_bilan', '—')
    if (participation.wins !== undefined && participation.losses !== undefined) {
      bilan = t('player.journey.bilan', '{wins} V – {losses} D', { wins: participation.wins, losses: participation.losses })
      if (participation.unknownResults) {
        bilan = `${bilan} ${t('player.journey.bilan_unknown', '(+{count} au résultat inconnu)', { count: participation.unknownResults })}`
      }
    }
    return {
      editionId: participation.editionId,
      editionCode: participation.editionCode,
      editionLabel: editionLabel(participation.editionCode),
      poolLabel,
      bilan,
      resultLabel,
      chartLabel,
      kind,
      points: participation.points === null ? t('player.journey.no_points', '—') : participation.points.toFixed(PLAYER_POINTS_DECIMALS),
      level: stage && !isOngoing ? stage.level : PLAYER_ONGOING_LEVEL
    }
  }

  const competitor = computed(() => detail.data.value)
  const chronologicalRows = computed(() => ((detail.data.value?.participations ?? []) as IPlayerParticipation[]).map(journeyRow))
  const tableRows = computed(() => [...chronologicalRows.value].reverse())
  const bestRow = computed(() => chronologicalRows.value
    .filter(row => row.kind !== PLAYER_JOURNEY_KIND.ONGOING)
    .reduce<IPlayerJourneyRow | null>((best, row) => (best === null || row.level >= best.level ? row : best), null))
  const bestLabel = computed(() => bestRow.value ? `${bestRow.value.resultLabel} ${bestRow.value.editionLabel}` : null)
  const firstEditionLabel = computed(() => {
    const first = detail.data.value?.participations[0]
    return first ? editionLabel(first.editionCode) : null
  })
  const opponents = computed(() => ((opponentsData.data.value ?? []) as IPlayerOpponent[]).slice(0, PLAYER_OPPONENTS_LIMIT))
  const error = computed(() => unwrapAsyncError(detail.error.value))
  const isNotFound = computed(() => error.value?.error.statusCode === PLAYER_HTTP_NOT_FOUND)

  const refresh = async () => {
    await Promise.all([detail.refresh(), opponentsData.refresh()])
  }

  const ready = async () => {
    await detail
  }

  return {
    ready,
    competitor,
    stats: computed(() => detail.data.value?.stats ?? null),
    journeyRows: chronologicalRows,
    tableRows,
    bestLabel,
    firstEditionLabel,
    participationCount: computed(() => detail.data.value?.participations.length ?? 0),
    opponents,
    pending: computed(() => detail.pending.value),
    error,
    opponentsPending: computed(() => opponentsData.pending.value),
    opponentsError: computed(() => unwrapAsyncError(opponentsData.error.value)),
    isNotFound,
    refresh
  }
}

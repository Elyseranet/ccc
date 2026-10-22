<template>
  <div class="head-to-head-summary">
    <section
      class="head-to-head-summary__section"
      aria-labelledby="head-to-head-duel-title"
      data-cy="head-to-head-duel"
    >
      <origam-title
        id="head-to-head-duel-title"
        tag="h2"
        class="sr-only"
        :text="duelTitle"
      />
      <origam-card
        class="head-to-head-summary__duel"
        rounded="xl"
        border
        elevation="md"
        padding="8"
      >
        <template #default>
          <p class="head-to-head-summary__side">
            <span
              class="head-to-head-summary__wins font-display"
              data-cy="head-to-head-wins-a"
            >{{ winsA }}</span>
            <span>{{ winsLabelA }}</span>
          </p>
          <div class="head-to-head-summary__mid">
            <template v-if="hasRatio">
              <p
                class="head-to-head-summary__score font-display neon--sm"
                data-cy="head-to-head-score"
              >
                <span>{{ winsA }}</span>
                <i>{{ separator }}</i>
                <span>{{ winsB }}</span>
              </p>
              <origam-progress
                type="linear"
                :model-value="ratioPercent"
                :label="barLabel"
                color="primary"
                :bg-color="trackColor"
                :thickness="barThickness"
                rounded="full"
                class="head-to-head-summary__bar"
                data-cy="head-to-head-bar"
              />
              <p
                class="head-to-head-summary__meetings"
                data-cy="head-to-head-meetings"
              >
                {{ meetingsText }}
              </p>
            </template>
            <p
              v-else
              class="head-to-head-summary__meetings"
              data-cy="head-to-head-never-met"
            >
              {{ neverMetText }}
            </p>
          </div>
          <p class="head-to-head-summary__side head-to-head-summary__side--b">
            <span
              class="head-to-head-summary__wins head-to-head-summary__wins--b font-display"
              data-cy="head-to-head-wins-b"
            >{{ winsB }}</span>
            <span>{{ winsLabelB }}</span>
          </p>
        </template>
      </origam-card>
    </section>

    <section
      class="head-to-head-summary__section"
      aria-labelledby="head-to-head-bilans-title"
      data-cy="head-to-head-bilans"
    >
      <div class="head-to-head-summary__head">
        <origam-title
          id="head-to-head-bilans-title"
          tag="h2"
          font-size="4xl"
          line-height="none"
          class="font-display neon--sm"
          :text="bilansTitle"
        />
        <p class="head-to-head-summary__hint">
          {{ bilansHint }}
        </p>
      </div>
      <div class="head-to-head-summary__players">
        <origam-card
          v-for="player in players"
          :key="player.side"
          class="head-to-head-summary__player"
          :class="`head-to-head-summary__player--${player.side}`"
          rounded="xl"
          border
          elevation="md"
          padding="6"
          :aria-labelledby="`head-to-head-player-${player.side}-name`"
          :data-cy="`head-to-head-player-card-${player.side}`"
        >
          <template #default>
            <origam-avatar
              class="head-to-head-summary__avatar font-display"
              rounded="full"
              :image="player.avatar"
              :text="player.initials"
              aria-hidden="true"
            />
            <origam-title
              :id="`head-to-head-player-${player.side}-name`"
              tag="h3"
              font-size="xl"
              font-weight="bold"
              line-height="tight"
              class="head-to-head-summary__name"
            >
              <template #default>
                <player-link
                  :competitor="player.competitor"
                  :titles="player.titles"
                />
              </template>
            </origam-title>
            <origam-data-list
              mode="kv"
              :items="player.items"
              :border="false"
              density="compact"
              rounded="lg"
              class="head-to-head-summary__stats"
              :data-cy="`head-to-head-stats-${player.side}`"
            />
          </template>
        </origam-card>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { OrigamAvatar, OrigamCard, OrigamDataList, OrigamProgress, OrigamTitle } from 'origam/components'
import type { ICompetitorDetail, ICompetitorPublic } from '~/interfaces/competitor.interface'
import PlayerLink from '~/components/common/PlayerLink.vue'
import { useT } from '~/composables/useT'
import { ROUND_LABELS } from '~/consts/round-labels.const'
import { HEAD_TO_HEAD_BAR_THICKNESS, HEAD_TO_HEAD_BAR_TRACK_COLOR, HEAD_TO_HEAD_EMPTY_GLYPH, HEAD_TO_HEAD_SCORE_SEPARATOR } from '~/consts/head-to-head.const'
import { HEAD_TO_HEAD_SIDE } from '~/enums/head-to-head.enum'
import type { IHeadToHeadBilanItem, IHeadToHeadSummaryProps } from '~/interfaces/head-to-head-page.interface'
import { careerRatio, firstNameOf, initialsOf, lastMeeting, percentOf, signed } from '~/utils/head-to-head.util'

/*********************************************************
 * Global
 *
 * @description
 * Score des rencontres de la paire (RG36) puis bilans globaux de chaque joueur (RG37, seul endroit public du ratio).
 * La proportion s'affiche en barre ET en texte « 2 – 2 », jamais par la couleur seule. Les départages sont exclus
 * côté API ; les résultats inconnus ne sont ni victoires ni défaites (R-5).
 ********************************************************/
const { t } = useT()
const props = withDefaults(defineProps<IHeadToHeadSummaryProps>(), {
  detailA: null,
  detailB: null
})
const emits = defineEmits<{}>()
defineSlots<{}>()
const separator = HEAD_TO_HEAD_SCORE_SEPARATOR
const trackColor = HEAD_TO_HEAD_BAR_TRACK_COLOR
const barThickness = HEAD_TO_HEAD_BAR_THICKNESS

/*********************************************************
 * Rencontres de la paire
 *
 * @description
 * `winRatio` vaut null quand aucune rencontre de la paire n'a de score : la barre et le score laissent alors la place
 * à un état vide, jamais à « 0 % ».
 ********************************************************/
const winsA = computed(() => props.comparison.wins)
const winsB = computed(() => props.comparison.losses)
const hasRatio = computed(() => props.comparison.winRatio !== null)
const ratioPercent = computed(() => percentOf(props.comparison.winRatio ?? 0))
const nameA = computed(() => firstNameOf(props.comparison.competitor))
const nameB = computed(() => firstNameOf(props.comparison.opponent))
const duelTitle = computed(() => t('head_to_head.duel.title', 'Bilan des rencontres'))
const winsLabel = (count: number, name: string): string => count === 1
  ? t('head_to_head.duel.wins_one', 'victoire de {name}', { name })
  : t('head_to_head.duel.wins_other', 'victoires de {name}', { name })
const winsLabelA = computed(() => winsLabel(winsA.value, nameA.value))
const winsLabelB = computed(() => winsLabel(winsB.value, nameB.value))
const barLabel = computed(() => t('head_to_head.duel.bar_label', '{first} victoires contre {second}', { first: winsA.value, second: winsB.value }))
const neverMetText = computed(() => t('head_to_head.duel.never_met', 'Ces deux joueurs ne se sont jamais affrontés avec un score connu.'))
const meetingsText = computed(() => {
  const last = lastMeeting(props.comparison.matches)
  const count = props.comparison.played
  if (!last) {
    return t('head_to_head.duel.meetings_unknown_last', '{count} rencontres', { count })
  }
  const round = ROUND_LABELS[last.roundKind].match
  const values = { count, edition: last.editionCode, round: t(round.key, round.label).toLocaleLowerCase('fr') }
  return count === 1
    ? t('head_to_head.duel.meetings_one', '1 rencontre · dernière : {edition}, {round}', values)
    : t('head_to_head.duel.meetings_other', '{count} rencontres · dernière : {edition}, {round}', values)
})

/*********************************************************
 * Bilans globaux
 *
 * @description
 * Chiffres de carrière de chaque joueur, depuis sa fiche. Le ratio (victoires / matchs avec score) est calculé ici :
 * sans match avec score, il affiche un tiret et un libellé « indisponible », pas « 0 % ».
 ********************************************************/
const bilansTitle = computed(() => t('head_to_head.bilans.title', 'Bilans'))
const bilansHint = computed(() => t('head_to_head.bilans.hint', 'Sur toutes les éditions (RG37)'))
const ratioText = (detail: ICompetitorDetail | null): string => {
  const ratio = detail ? careerRatio(detail.stats.wins, detail.stats.played) : null
  return ratio === null ? t('head_to_head.bilans.ratio_unavailable', 'Indisponible') : t('head_to_head.bilans.ratio_value', '{percent} %', { percent: percentOf(ratio) })
}
const bilanItems = (detail: ICompetitorDetail | null): IHeadToHeadBilanItem[] => {
  const stats = detail?.stats
  const dash = HEAD_TO_HEAD_EMPTY_GLYPH
  const number = (value: number | undefined): string => value === undefined ? dash : String(value)
  return [
    { key: t('head_to_head.bilans.matches', 'Matchs'), value: number(stats?.played) },
    { key: t('head_to_head.bilans.ratio', 'Ratio'), value: ratioText(detail) },
    { key: t('head_to_head.bilans.wins', 'Victoires'), value: number(stats?.wins) },
    { key: t('head_to_head.bilans.losses', 'Défaites'), value: number(stats?.losses) },
    { key: t('head_to_head.bilans.points_for', 'Points marqués'), value: number(stats?.pointsFor) },
    { key: t('head_to_head.bilans.points_against', 'Encaissés'), value: number(stats?.pointsAgainst) },
    { key: t('head_to_head.bilans.differential', 'Différentiel'), value: stats ? signed(stats.pointsFor - stats.pointsAgainst) : dash }
  ]
}
const playerOf = (side: HEAD_TO_HEAD_SIDE, competitor: ICompetitorPublic, detail: ICompetitorDetail | null) => ({
  side,
  competitor,
  titles: detail?.stats.titles ?? 0,
  avatar: competitor.avatarUrl ?? undefined,
  initials: initialsOf(competitor),
  items: bilanItems(detail)
})
const players = computed(() => [
  playerOf(HEAD_TO_HEAD_SIDE.A, props.comparison.competitor, props.detailA),
  playerOf(HEAD_TO_HEAD_SIDE.B, props.comparison.opponent, props.detailB)
])

/*********************************************************
 * Expose
 *
 * @description
 * Rien à piloter depuis l'extérieur.
 ********************************************************/
defineExpose({})
</script>

<style scoped lang="scss">
.head-to-head-summary {
  &__section {
    padding-top: var(--head-to-head-summary---section-gap, var(--origam-space---8));
  }

  &__duel {
    background:
      radial-gradient(30rem 20rem at 0% 50%, color-mix(in srgb, var(--origam-color__bar---amber) 20%, transparent), transparent 70%),
      radial-gradient(30rem 20rem at 100% 50%, color-mix(in srgb, var(--origam-color__bar---neon) 22%, transparent), transparent 70%),
      var(--origam-color__surface---raised);
  }

  &__duel :deep(.origam-card__content) {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr) minmax(0, 1fr);
    align-items: center;
    gap: var(--origam-space---6);
  }

  &__side {
    display: grid;
    gap: var(--origam-space---1);
    margin: 0;
    font-weight: var(--origam-font__weight---bold);
    color: var(--origam-color__text---secondary);

    &--b {
      text-align: right;
    }
  }

  &__wins {
    font-size: var(--origam-font__size---4xl);
    line-height: 1;
    color: var(--origam-color__bar---amber);

    &--b {
      color: var(--origam-color__action--secondary---fgSubtle);
    }
  }

  &__mid {
    display: grid;
    gap: var(--origam-space---3);
    text-align: center;
  }

  &__score {
    margin: 0;
    font-size: var(--origam-font__size---5xl);
    line-height: var(--origam-font__lineHeight---none);

    i {
      padding-inline: var(--origam-space---2);
      font-style: normal;
      color: var(--origam-color__text---tertiary);
      text-shadow: none;
    }
  }

  &__bar {
    --origam-progress-linear__background---opacity: 1;
  }

  &__meetings {
    margin: 0;
    font-variant-numeric: tabular-nums;
    color: var(--origam-color__text---secondary);
  }

  &__head {
    display: flex;
    flex-wrap: wrap;
    align-items: end;
    justify-content: space-between;
    gap: var(--origam-space---4);
    margin-bottom: var(--origam-space---8);
  }

  &__hint {
    margin: 0;
    color: var(--origam-color__text---secondary);
  }

  &__players {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--origam-space---4);
  }

  &__player :deep(.origam-card__content) {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    align-items: center;
    gap: var(--origam-space---4);
  }

  &__avatar {
    width: var(--origam-space---16);
    height: var(--origam-space---16);
    font-size: var(--origam-font__size---xl);
    color: var(--origam-color__surface---default);
    background: var(--origam-color__bar---amber);
  }

  &__player--b &__avatar {
    background: var(--origam-color__action--secondary---bg);
  }

  &__stats {
    --origam-data-list---padding: 0;
    --origam-data-list__kv---display: grid;
    --origam-data-list__kv---row-padding-block: var(--origam-space---3);
    --origam-data-list__kv---key-font-size: var(--origam-font__size---xs);
    --origam-data-list__kv---key-font-weight: var(--origam-font__weight---bold);
    --origam-data-list__kv---key-color: var(--origam-color__text---tertiary);
    --origam-data-list__kv---value-font-size: var(--origam-font__size---xl);

    grid-column: 1 / -1;
    margin: 0;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--origam-space---2);
  }

  &__stats :deep(.origam-data-list__kv-row) {
    grid-template-columns: 1fr;
    gap: 2px;
    border-bottom: 0;
    padding-inline: var(--origam-space---4);
    border-radius: var(--origam-radius---lg);
    background: var(--origam-color__surface---sunken);

    &:last-child {
      grid-column: span 3;
    }
  }

  &__stats :deep(.origam-data-list__kv-key) {
    letter-spacing: var(--origam-font__letterSpacing---wide);
    text-transform: uppercase;
  }

  &__stats :deep(.origam-data-list__kv-value) {
    font-weight: var(--origam-font__weight---bold);
    font-variant-numeric: tabular-nums;
  }

  @media (max-width: 760px) {
    &__duel {
      padding: var(--origam-space---5);
    }

    &__duel :deep(.origam-card__content) {
      grid-template-columns: 1fr 1fr;
    }

    &__player {
      padding: var(--origam-space---5);
    }

    &__mid {
      grid-column: 1 / -1;
    margin: 0;
      grid-row: 1;
    }

    &__players {
      grid-template-columns: 1fr;
    }

    &__stats {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    &__stats :deep(.origam-data-list__kv-row:last-child) {
      grid-column: span 2;
    }
  }
}
</style>

<style>
:root {
  --head-to-head-summary---section-gap: var(--origam-space---8);
}
</style>

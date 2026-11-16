<template>
  <origam-card
    tag="article"
    class="home-current"
    aria-labelledby="home-current-title"
    data-cy="home-current"
  >
    <template #default>
      <div class="home-current__body">
        <div class="home-current__head">
          <origam-title
            id="home-current-title"
            tag="h3"
            font-size="xl"
            font-weight="bold"
            line-height="tight"
            letter-spacing="normal"
            :text="title"
          />
          <origam-chip
            v-if="hasCurrent"
            color="secondary"
            bg-color="secondary"
            size="small"
            pill
            data-cy="home-current-status"
            :text="statusText"
          />
        </div>
        <p
          v-if="!hasCurrent"
          class="home-current__empty"
          data-cy="home-current-none"
        >
          {{ noneText }}
        </p>
        <template v-if="hasProgress">
          <origam-progress
            :model-value="percent"
            color="primary"
            :bg-color="trackColor"
            :thickness="thickness"
            rounded="full"
            class="home-current__progress"
            :label="progressLabel"
            data-cy="home-current-progress"
          />
          <p
            class="home-current__meta num"
            data-cy="home-current-meta"
          >
            {{ metaText }}
          </p>
        </template>
        <ol
          v-if="hasScores"
          class="home-current__results"
          :aria-labelledby="titleId"
          data-cy="home-current-scores"
        >
          <li
            v-for="score in scores"
            :key="score.id"
            class="home-current__result"
            data-cy="home-current-score"
          >
            <span class="home-current__player home-current__player--win">
              <player-link :competitor="score.winner" inline wrap />
            </span>
            <span class="home-current__score num font-display">
              <span class="sr-only">{{ score.scoreText }}</span>
              <span aria-hidden="true">{{ score.winnerScore }}<span class="home-current__sep">{{ separator }}</span>{{ score.loserScore }}</span>
            </span>
            <span class="home-current__player">
              <player-link :competitor="score.loser" inline wrap />
            </span>
            <origam-chip
              v-if="score.poolText"
              size="small"
              pill
              class="home-current__pool"
              :text="score.poolText"
            />
          </li>
        </ol>
        <p
          v-else-if="hasCurrent"
          class="home-current__empty"
          data-cy="home-current-no-scores"
        >
          {{ noScoresText }}
        </p>
        <origam-btn
          v-if="hasCurrent"
          :to="matchesTo"
          variant="text"
          color="primary"
          padding-inline="3"
          class="home-current__more"
          data-cy="home-current-more"
        >
          <template #default>
            {{ moreText }} <span
                class="home-current__arrow"
                aria-hidden="true"
              >{{ arrow }}</span>
          </template>
        </origam-btn>
      </div>
    </template>
  </origam-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { OrigamBtn, OrigamCard, OrigamChip, OrigamProgress, OrigamTitle } from 'origam/components'
import PlayerLink from '~/components/common/PlayerLink.vue'
import { useT } from '~/composables/useT'
import { EDITION_STATUS_LABELS } from '~/consts/edition-status.const'
import { HOME_ARROW_GLYPH, HOME_PROGRESS_THICKNESS, HOME_PROGRESS_TRACK_COLOR, HOME_SCORE_SEPARATOR_GLYPH } from '~/consts/home.const'
import { ROUTES } from '~/consts/routes.const'
import type { IHomeCurrentEditionProps } from '~/interfaces/home.interface'
import { capitalizeFirst } from '~/utils/home.util'

/*********************************************************
 * Global
 *
 * @description
 * Tuile « édition en cours » : avancement des poules et derniers scores VALIDÉS (E-f), sans effet live.
 * L'avancement vient de `IRound.validatedMatchCount / matchCount` du tour de poules (C3). Aucun nombre n'est écrit ici.
 ********************************************************/
const { t } = useT()
const props = withDefaults(defineProps<IHomeCurrentEditionProps>(), {})
const emits = defineEmits<{}>()
defineSlots<{}>()
const arrow = HOME_ARROW_GLYPH
const separator = HOME_SCORE_SEPARATOR_GLYPH
const thickness = HOME_PROGRESS_THICKNESS
const trackColor = HOME_PROGRESS_TRACK_COLOR
const titleId = 'home-current-title'
const hasCurrent = computed(() => props.current !== null)
const title = computed(() => t('home.current.title', 'Derniers scores validés'))
const noneText = computed(() => t('home.current.none', 'Aucune édition en cours pour le moment.'))

/*********************************************************
 * Avancement
 *
 * @description
 * Sans tour de poules (inscriptions, tirage), il n'y a pas de barre. Le résumé « poules · joueurs » n'apparaît que si ces nombres sont connus.
 ********************************************************/
const progress = computed(() => props.current?.progress ?? null)
const hasProgress = computed(() => progress.value !== null)
const percent = computed(() => progress.value?.percent ?? 0)
const statusText = computed(() => {
  const label = props.current ? EDITION_STATUS_LABELS[props.current.status] : null
  return label ? capitalizeFirst(t(label.key, label.label)) : ''
})
const progressLabel = computed(() => t('home.current.progress_label', '{validated} matchs de poule validés sur {total}', {
  validated: progress.value?.validated ?? 0,
  total: progress.value?.total ?? 0
}))
const metaText = computed(() => {
  const value = progress.value
  if (!value) {
    return ''
  }
  const params = { validated: value.validated, total: value.total, pools: value.poolCount, players: value.participantCount ?? 0 }
  return value.poolCount > 0 && value.participantCount !== null
    ? t('home.current.meta', '{validated} / {total} matchs de poule validés · {pools} poules · {players} joueurs', params)
    : t('home.current.meta_progress', '{validated} / {total} matchs de poule validés', params)
})

/*********************************************************
 * Scores
 *
 * @description
 * La puce de poule n'existe que pour un match de poule. Elle est masquée sur mobile par le CSS. Le score est lu « 5 à 2 » (texte `sr-only`) : les deux chiffres visibles, collés au séparateur masqué, étaient lus « 52 » (T-A11Y-01, M4).
 ********************************************************/
const scores = computed(() => (props.current?.latestScores ?? []).map(score => ({
  ...score,
  poolText: score.poolRank === null ? '' : t('home.current.pool', 'Poule {rank}', { rank: score.poolRank }),
  scoreText: t('home.current.score_accessible', '{winner} à {loser}', { winner: score.winnerScore, loser: score.loserScore })
})))
const hasScores = computed(() => scores.value.length > 0)
const noScoresText = computed(() => t('home.current.no_scores', 'Aucun score validé pour le moment.'))
const moreText = computed(() => t('home.current.all_matches', 'Tous les matchs'))
const matchesTo = computed(() => props.current ? `${ROUTES.EDITIONS}/${encodeURIComponent(props.current.code)}` : ROUTES.EDITIONS)

/*********************************************************
 * Expose
 *
 * @description
 * Rien à piloter depuis l'extérieur.
 ********************************************************/
defineExpose({})
</script>

<style scoped lang="scss">
.home-current {
  display: grid;
  padding: var(--home-current---padding, var(--origam-space---6));

  &__arrow {
    margin-inline-start: var(--origam-space---2);
  }

  &__body {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  &__head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--origam-space---3);
  }

  &__progress {
    --origam-progress-linear__background---opacity: 1;
    margin-top: var(--origam-space---5);
  }

  &__meta {
    margin: var(--origam-space---2) 0 0;
    font-size: var(--origam-font__size---sm);
    color: var(--origam-color__text---tertiary);
  }

  &__empty {
    margin: var(--origam-space---5) 0 0;
    color: var(--origam-color__text---secondary);
  }

  &__results {
    display: grid;
    gap: var(--origam-space---2);
    margin-block: var(--origam-space---5);
    padding: 0;
    list-style: none;
  }

  &__result {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr) auto;
    align-items: center;
    gap: var(--origam-space---3);
    padding: var(--origam-space---3) var(--origam-space---4);
    border-radius: var(--origam-radius---lg);
    background: var(--origam-color__surface---sunken);
  }

  &__player {
    color: var(--origam-color__text---secondary);

    &--win {
      color: var(--origam-color__text---primary);
      font-weight: var(--origam-font__weight---bold);
    }
  }

  &__score {
    font-size: var(--origam-font__size---2xl);
    line-height: 1;
    color: var(--origam-color__bar---amber);
  }

  &__sep {
    padding-inline: var(--origam-space---1);
    color: var(--origam-color__text---tertiary);
  }

  &__more {
    margin-top: auto;
    align-self: flex-start;
  }
}

@media (max-width: 760px) {
  .home-current__result {
    grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  }

  .home-current__pool {
    display: none;
  }

  .home-current {
    padding: var(--home-current---padding-mobile, var(--origam-space---5));
  }
}
</style>

<style>
:root {
  --home-current---padding: var(--origam-space---6);
  --home-current---padding-mobile: var(--origam-space---5);
}
</style>

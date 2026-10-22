<template>
  <section
    class="player-opponents"
    aria-labelledby="player-opponents-title"
    data-cy="player-opponents"
  >
    <div class="player-opponents__head">
      <origam-title
        id="player-opponents-title"
        tag="h2"
        class="player-opponents__title font-display neon--sm"
        :text="title"
      />
      <p class="player-opponents__lead">{{ lead }}</p>
    </div>
    <origam-list
      class="player-opponents__list"
      density="comfortable"
      :aria-label="title"
      data-cy="player-opponents-list"
    >
      <template #default>
        <origam-list-item
          v-for="summary in opponents"
          :key="summary.opponent.id"
          class="player-opponents__item"
          rounded="lg"
          :padding-block="rowPaddingBlock"
          :padding-inline="rowPaddingInline"
          data-cy="player-opponent"
        >
          <template #default>
            <div class="player-opponents__row">
              <player-avatar
                :display-name="summary.opponent.displayName"
                :avatar-url="summary.opponent.avatarUrl"
              />
              <player-link
                inline
                class="player-opponents__name"
                :competitor="summary.opponent"
              />
              <span class="player-opponents__count">{{ countText(summary) }}</span>
              <span
                class="player-opponents__record"
                data-cy="player-opponent-record"
              >
                <template v-if="hasRatio(summary)">
                  <b>{{ winsText(summary) }}</b>{{ lossesText(summary) }}
                </template>
                <template v-else>
                  {{ withoutRatioText(summary) }}
                </template>
              </span>
              <span
                v-if="hasRatio(summary)"
                class="player-opponents__bar"
                aria-hidden="true"
                :style="barStyle(summary)"
              />
              <origam-btn
                class="player-opponents__link"
                variant="text"
                color="primary"
                size="small"
                :to="linkOf(summary)"
                data-cy="player-opponent-link"
              >
                <template #default>
                  {{ compareLabel }}
                  <span class="sr-only">{{ compareWith(summary) }}</span>
                </template>
              </origam-btn>
            </div>
          </template>
        </origam-list-item>
      </template>
    </origam-list>
    <origam-btn
      v-if="hasMore"
      class="player-opponents__see-all"
      variant="text"
      :to="seeAllLink"
      :text="seeAllLabel"
      data-cy="player-opponents-see-all"
    />
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { OrigamBtn, OrigamList, OrigamListItem, OrigamTitle } from 'origam/components'
import PlayerLink from '~/components/common/PlayerLink.vue'
import PlayerAvatar from '~/components/players/PlayerAvatar.vue'
import { useT } from '~/composables/useT'
import { PERCENT } from '~/consts/players.const'
import type { IPlayerOpponent, IPlayerOpponentsProps } from '~/interfaces/players.interface'
import { buildHeadToHeadLink } from '~/utils/player.util'

/*********************************************************
 * Global
 *
 * @description
 * Adversaires les plus souvent affrontés (RG36). Bilan vu du côté du joueur de la fiche.
 * `winRatio` vaut `null` quand aucun match de la paire n'a de score : état vide, jamais 0 %.
 * Le ratio n'est pas affiché en chiffres ici (FA-12) : seul le face-à-face le montre ; la barre n'est qu'un repère visuel.
 ********************************************************/
const { t } = useT()
const props = withDefaults(defineProps<IPlayerOpponentsProps>(), {
  hasMore: false
})
const emits = defineEmits<{}>()
defineSlots<{}>()

/*********************************************************
 * Textes
 *
 * @description
 * Singulier et pluriel ont chacun leur clé.
 ********************************************************/
const title = computed(() => t('player.opponents.title', 'Adversaires'))
const lead = computed(() => t('player.opponents.lead', 'Les plus souvent affrontés (RG36)'))
const compareLabel = computed(() => t('player.opponents.compare', 'Face-à-face'))
const noScoreText = computed(() => t('player.opponents.no_score', 'Aucun score connu'))
const totalOf = (summary: IPlayerOpponent): number => summary.played + (summary.unknownResults ?? 0)
const countText = (summary: IPlayerOpponent): string => totalOf(summary) === 1
  ? t('player.opponents.matches_one', '1 match')
  : t('player.opponents.matches_other', '{count} matchs', { count: totalOf(summary) })
const withoutRatioText = (summary: IPlayerOpponent): string => {
  const unknown = summary.unknownResults ?? 0
  if (unknown === 0) {
    return noScoreText.value
  }
  return unknown === 1
    ? t('player.opponents.unknown_one', '1 match au résultat inconnu')
    : t('player.opponents.unknown_other', '{count} matchs au résultat inconnu', { count: unknown })
}
const winsText = (summary: IPlayerOpponent): string => t('player.opponents.wins', '{count} V', { count: summary.wins })
const lossesText = (summary: IPlayerOpponent): string => t('player.opponents.losses', ' – {count} D', { count: summary.losses })
const compareWith = (summary: IPlayerOpponent): string => t('player.opponents.compare_with', 'avec {name}', { name: summary.opponent.displayName })

/*********************************************************
 * Lignes
 *
 * @description
 * La barre est proportionnelle au taux de victoires, sans le chiffrer.
 ********************************************************/
const rowPaddingBlock = 'var(--origam-space---3)'
const rowPaddingInline = 'var(--origam-space---4)'
const seeAllLabel = computed(() => t('player.opponents.see_all', 'Voir tous les face-à-face'))
const seeAllLink = computed(() => buildHeadToHeadLink(props.playerId))
const hasRatio = (summary: IPlayerOpponent): boolean => summary.winRatio !== null
const barStyle = (summary: IPlayerOpponent) => ({ '--player-opponents__bar---width': Math.round((summary.winRatio ?? 0) * PERCENT) })
const linkOf = (summary: IPlayerOpponent): string => buildHeadToHeadLink(props.playerId, summary.opponent.id)

/*********************************************************
 * Expose
 *
 * @description
 * Rien à piloter depuis l'extérieur.
 ********************************************************/
defineExpose({})
</script>

<style scoped lang="scss">
.player-opponents {
  padding-top: var(--origam-space---8);

  &__head {
    display: flex;
    flex-wrap: wrap;
    align-items: end;
    justify-content: space-between;
    gap: var(--origam-space---4);
    margin-bottom: var(--origam-space---8);
  }

  &__title {
    font-size: var(--origam-font__size---4xl);
    line-height: var(--origam-font__lineHeight---none);
  }

  &__lead {
    margin: 0;
    color: var(--origam-color__text---secondary);
  }

  &__list {
    display: grid;
    gap: var(--origam-space---2);
    padding: 0;
    background: none;
  }

  &__item {
    position: relative;
    overflow: hidden;
    border: 1px solid var(--origam-color__border---subtle);
    background: var(--origam-color__surface---raised);
  }

  &__name {
    justify-self: start;
  }

  &__link {
    --origam-btn---height: var(--origam-space---11);
    --origam-btn---padding-sm: var(--origam-space---4);
    --origam-btn---font-size: var(--origam-font__size---sm);
  }

  &__see-all {
    margin-top: var(--origam-space---3);
  }

  &__row {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto auto auto;
    align-items: center;
    gap: var(--origam-space---4);
    width: 100%;
  }

  &__count {
    font-size: var(--origam-font__size---sm);
    color: var(--origam-color__text---tertiary);
    font-variant-numeric: tabular-nums;
  }

  &__record {
    color: var(--origam-color__text---secondary);
    font-variant-numeric: tabular-nums;

    b {
      color: var(--origam-color__text---primary);
    }
  }

  &__bar {
    position: absolute;
    left: 0;
    bottom: 0;
    height: 3px;
    width: calc(var(--player-opponents__bar---width, 0) * 1%);
    background: var(--origam-color__action--primary---bg);
  }

  @media (max-width: 760px) {
    &__row {
      grid-template-columns: auto minmax(0, 1fr) auto;
    }

    &__count {
      display: none;
    }

    &__link {
      --origam-btn---padding-sm: 0;
      grid-column: 2 / -1;
      justify-self: start;
    }
  }
}
</style>

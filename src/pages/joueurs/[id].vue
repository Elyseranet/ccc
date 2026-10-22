<template>
  <div
    class="player-page page-wrap"
    data-cy="player-page"
  >
    <origam-breadcrumb
      class="player-page__crumbs"
      :divider="breadcrumbDivider"
      :items="breadcrumbItems"
      :aria-label="breadcrumbLabel"
      data-cy="player-breadcrumb"
    />
    <async-state
      :pending="pending"
      :error="displayedError"
      :empty="isNotFound"
      :empty-title="notFoundTitle"
      :empty-description="notFoundDescription"
      @retry="refresh"
    >
      <template v-if="competitor">
        <player-header
          :competitor="competitor"
          :titles="competitor.stats.titles"
          :first-edition-label="firstEditionLabel"
          :participation-count="participationCount"
          :compare-to="compareTo"
        />
        <player-stats
          :played="competitor.stats.played"
          :wins="competitor.stats.wins"
          :losses="competitor.stats.losses"
          :unknown-results="competitor.stats.unknownResults"
        />
        <player-journey
          v-if="hasJourney"
          :rows="journeyRows"
          :table-rows="tableRows"
          :best-label="bestLabel"
        />
        <async-state
          :pending="opponentsPending"
          :error="opponentsError"
          :empty="hasNoOpponents"
          :empty-title="noOpponentsTitle"
          @retry="refresh"
        >
          <player-opponents
            :player-id="competitor.id"
            :opponents="opponents"
            :has-more="hasMoreOpponents"
          />
        </async-state>
      </template>
    </async-state>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { OrigamBreadcrumb } from 'origam/components'
import AsyncState from '~/components/common/AsyncState.vue'
import PlayerHeader from '~/components/players/PlayerHeader.vue'
import PlayerJourney from '~/components/players/PlayerJourney.vue'
import PlayerOpponents from '~/components/players/PlayerOpponents.vue'
import PlayerStats from '~/components/players/PlayerStats.vue'
import { usePlayerProfile } from '~/composables/usePlayerProfile'
import { useT } from '~/composables/useT'
import { PLAYERS_BREADCRUMB_DIVIDER } from '~/consts/players.const'
import { ROUTES } from '~/consts/routes.const'
import type { ITranslatableText } from '~/interfaces/common-components.interface'
import { buildHeadToHeadLink } from '~/utils/player.util'

/*********************************************************
 * Page
 *
 * @description
 * Fiche d'un joueur (`/joueurs/[id]`). Un identifiant inconnu répond 404 (statut HTTP posé côté serveur)
 * et affiche un état « introuvable » dans la coque ; la page reste fine, la logique est dans `usePlayerProfile`.
 ********************************************************/
definePageMeta({ layout: 'default' })
const { t } = useT()
const route = useRoute()
const props = withDefaults(defineProps<{}>(), {})
const emits = defineEmits<{}>()
defineSlots<{}>()
const playerId = computed(() => String(route.params.id))

/*********************************************************
 * Données
 *
 * @description
 * Les adversaires ont leur propre état de chargement, d'erreur et de vide.
 ********************************************************/
const { ready, competitor, journeyRows, tableRows, bestLabel, firstEditionLabel, participationCount, opponents, hasMoreOpponents, pending, error, opponentsPending, opponentsError, isNotFound, refresh } = usePlayerProfile(playerId)
const displayedError = computed(() => isNotFound.value ? null : error.value)
const hasJourney = computed(() => journeyRows.value.length > 0)
const hasNoOpponents = computed(() => !opponentsPending.value && opponentsError.value === null && opponents.value.length === 0)
const compareTo = computed(() => buildHeadToHeadLink(playerId.value))

if (import.meta.server) {
  const event = useRequestEvent()
  onServerPrefetch(async () => {
    await ready()
    if (isNotFound.value && event) {
      setResponseStatus(event, 404)
    }
  })
}

/*********************************************************
 * Textes
 *
 * @description
 * Titre du document : le nom du joueur, ou « Fiche joueur » tant qu'il n'est pas connu.
 ********************************************************/
useHead({ title: computed(() => competitor.value?.displayName ?? t('pages.player.title', 'Fiche joueur')) })
const breadcrumbLabel = computed(() => t('components.page_hero.breadcrumb_label', 'Fil d’Ariane'))
const breadcrumbDivider = PLAYERS_BREADCRUMB_DIVIDER
const breadcrumbItems = computed(() => [
  { title: t('player.breadcrumb.home', 'Accueil'), to: ROUTES.HOME, padding: 0 },
  { title: t('player.breadcrumb.players', 'Joueurs'), to: ROUTES.PLAYERS, padding: 0 },
  { title: competitor.value?.displayName ?? t('pages.player.title', 'Fiche joueur'), disabled: true, padding: 0 }
])
const notFoundTitle: ITranslatableText = { key: 'player.not_found.title', fallback: 'Joueur introuvable' }
const notFoundDescription: ITranslatableText = { key: 'player.not_found.description', fallback: 'Cette fiche n’existe pas. Retrouvez le joueur dans l’annuaire.' }
const noOpponentsTitle: ITranslatableText = { key: 'player.opponents.empty', fallback: 'Aucun adversaire rencontré avec un score connu' }

/*********************************************************
 * Expose
 *
 * @description
 * Une page n'expose rien à un parent.
 ********************************************************/
defineExpose({})
</script>

<style scoped lang="scss">
.player-page {
  padding-bottom: var(--origam-space---10);

  &__crumbs {
    --origam-breadcrumb---gap: 0;
    --origam-breadcrumb-item---color: var(--origam-color__text---secondary);
    --origam-breadcrumb-divider---color: var(--origam-color__text---tertiary);
    padding-top: var(--origam-space---8);
    font-size: var(--origam-font__size---sm);
    line-height: var(--origam-font__lineHeight---normal);

    :deep(.origam-breadcrumb__items) {
      line-height: inherit;
    }

    :deep(.origam-breadcrumb-item--link) {
      text-decoration: underline;
    }

    :deep(.origam-breadcrumb-item--disabled) {
      opacity: 1;
      color: var(--origam-color__text---tertiary);
    }
  }
}
</style>

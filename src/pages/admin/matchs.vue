<template>
  <section
    class="admin-matches"
    aria-labelledby="admin-matches-title"
    data-cy="admin-matches"
  >
    <header class="admin-matches__head">
      <p
        v-if="eyebrow"
        class="admin-matches__eyebrow"
      >
        {{ eyebrow }}
      </p>
      <origam-title
        id="admin-matches-title"
        tag="h1"
        class="admin-matches__title font-display neon--sm"
        data-cy="page-title"
        :text="title"
      />
    </header>
    <origam-alert
      v-if="isReadonly"
      status="info"
      density="compact"
      rounded="lg"
      class="admin-matches__readonly"
      :text="readonlyText"
      data-cy="admin-matches-readonly"
    />
    <async-state
      :pending="pending"
      :error="pageError"
      :empty="isEmpty"
      :empty-title="emptyTitle"
      :empty-description="emptyDescription"
      @retry="handleRetry"
    >
      <template #default>
        <match-queue-filters
          :filters="filterViews"
          :filter="filter"
          :rounds="rounds"
          :round="round"
          :has-pool-filter="hasPoolFilter"
          :pools="pools"
          :pool="pool"
          @update:filter="handleFilter"
          @update:round="handleRound"
          @update:pool="handlePool"
        />
        <match-queue
          v-if="hasCards"
          :cards="cards"
          @enter="handleEnter"
          @validate="handleValidate"
        />
        <origam-empty-state
          v-else
          preset="no-results"
          :title="viewEmptyTitle"
          :description="viewEmptyDescription"
          data-cy="admin-matches-view-empty"
        />
      </template>
    </async-state>
    <score-entry-dialog
      :match="entryMatch"
      :edition-code="editionCode"
      :open="entryOpen"
      @update:open="handleEntryOpen"
      @written="handleWritten"
      @stale="handleStale"
    />
    <score-validation-confirm
      :match="confirmMatch"
      :edition-code="editionCode"
      :open="confirmOpen"
      @update:open="handleConfirmOpen"
      @written="handleWritten"
      @stale="handleStale"
    />
    <origam-snackbar
      v-model="snackbarOpen"
      status="success"
      :text="snackbarText"
      :timeout="snackbarTimeout"
      data-cy="admin-matches-snackbar"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { OrigamAlert, OrigamEmptyState, OrigamSnackbar, OrigamTitle } from 'origam/components'
import MatchQueue from '~/components/admin/matches/MatchQueue.vue'
import MatchQueueFilters from '~/components/admin/matches/MatchQueueFilters.vue'
import ScoreEntryDialog from '~/components/admin/matches/ScoreEntryDialog.vue'
import ScoreValidationConfirm from '~/components/admin/matches/ScoreValidationConfirm.vue'
import AsyncState from '~/components/common/AsyncState.vue'
import { useMatchQueue } from '~/composables/useMatchQueue'
import { useSeo } from '~/composables/useSeo'
import { useT } from '~/composables/useT'
import { SCORE_SNACKBAR_TIMEOUT_MS } from '~/consts/score-entry.const'
import { EDITION_STATUS } from '~/enums/edition.enum'
import { SCORE_ENTRY_SUCCESS } from '~/enums/score-entry.enum'
import type { ADMIN_MATCH_FILTER } from '~/enums/admin-match-filter.enum'
import type { IAdminMatch } from '~/interfaces/admin-match.interface'
import type { TAdminMatchRound } from '~/types/admin-match-round.type'
import type { ITranslatableText } from '~/interfaces/common-components.interface'

/*********************************************************
 * Page
 *
 * @description
 * « Poules et matchs » (FA-05) : la file de traitement des scores de l'édition active. Usage cible : téléphone, debout, en
 * soirée, connexion incertaine (A7). La page ne fait qu'assembler : la file et ses filtres viennent de `useMatchQueue`, la saisie
 * de `useScoreEntry` (via le dialogue), et l'état dégradé (chargement, erreur, vide) d'`AsyncState`.
 ********************************************************/
definePageMeta({ layout: 'admin', middleware: 'admin' })
const { t } = useT()
const props = withDefaults(defineProps<{}>(), {})
const emits = defineEmits<{}>()
defineSlots<{}>()
const title = computed(() => t('pages.admin_matches.title', 'Poules et matchs'))
useHead({ title })
useSeo({ noindex: true })
const queue = await useMatchQueue()
const { filter, round, rounds, hasPoolFilter, pool, pools, filterViews, cards, isEmpty, isReadonly, edition, pageError, pending } = queue
const hasCards = computed(() => cards.value.length > 0)
const editionCode = computed(() => edition.value?.code ?? '')
const eyebrow = computed(() => edition.value ? t('admin.matches.eyebrow', 'Édition {year}', { year: edition.value.year }) : '')
const readonlyText = computed(() => t('admin.matches.readonly', 'Cette édition est archivée : les scores se consultent, ils ne se modifient plus.'))

/*********************************************************
 * États vides
 *
 * @description
 * Deux vides distincts : l'édition n'a aucun match (poules non tirées, ou archive sans match) ; ou la vue filtrée n'en a pas.
 ********************************************************/
const poolsNotDrawn = computed(() => edition.value !== null && [EDITION_STATUS.CREATED, EDITION_STATUS.REGISTRATION].includes(edition.value.status))
const emptyTitle = computed<ITranslatableText>(() => poolsNotDrawn.value
  ? { key: 'admin.matches.empty_not_drawn_title', fallback: 'Les poules ne sont pas encore tirées' }
  : { key: 'admin.matches.empty_title', fallback: 'Aucun match' })
const emptyDescription = computed<ITranslatableText>(() => poolsNotDrawn.value
  ? { key: 'admin.matches.empty_not_drawn_text', fallback: 'Les matchs apparaissent ici une fois le tirage des poules validé.' }
  : { key: 'admin.matches.empty_text', fallback: 'Cette édition n’a pas de match.' })
const viewEmptyTitle = computed(() => t('admin.matches.view_empty_title', 'Rien à afficher dans cette vue'))
const viewEmptyDescription = computed(() => t('admin.matches.view_empty_text', 'Aucun match ne correspond à ce filtre. Changez de filtre ou de poule.'))

/*********************************************************
 * Filtres
 *
 * @description
 * Le filtre, le tour et la poule sont portés par l'URL (`?f=`, `?tour=`, `?poule=`).
 ********************************************************/
const handleFilter = (value: ADMIN_MATCH_FILTER) => {
  filter.value = value
}
const handleRound = (value: TAdminMatchRound) => {
  round.value = value
}
const handlePool = (value: number | null) => {
  pool.value = value
}
const handleRetry = () => {
  queue.reload()
}

/*********************************************************
 * Saisie et validation
 *
 * @description
 * Le match ouvert est relu dans la file à chaque changement : après une écriture, il porte la nouvelle version renvoyée par
 * le serveur. « Saisir » ouvre le formulaire, « Valider » (d'une carte) ouvre la confirmation.
 ********************************************************/
const entryId = ref<string | null>(null)
const entryOpen = ref(false)
const confirmId = ref<string | null>(null)
const confirmOpen = ref(false)
const entryMatch = computed(() => entryId.value ? queue.findMatch(entryId.value) : null)
const confirmMatch = computed(() => confirmId.value ? queue.findMatch(confirmId.value) : null)
const handleEnter = (id: string) => {
  entryId.value = id
  entryOpen.value = true
}
const handleValidate = (id: string) => {
  confirmId.value = id
  confirmOpen.value = true
}
const handleEntryOpen = (value: boolean) => {
  entryOpen.value = value
}
const handleConfirmOpen = (value: boolean) => {
  confirmOpen.value = value
}
const handleStale = () => {
  queue.reload()
}

/*********************************************************
 * Confirmation
 *
 * @description
 * Le message dit ce qui vient de se passer : score enregistré (sans effet public) ou validé (classement recalculé).
 ********************************************************/
const snackbarOpen = ref(false)
const snackbarOutcome = ref<SCORE_ENTRY_SUCCESS>(SCORE_ENTRY_SUCCESS.SAVED)
const snackbarTimeout = SCORE_SNACKBAR_TIMEOUT_MS
const snackbarText = computed(() => snackbarOutcome.value === SCORE_ENTRY_SUCCESS.VALIDATED
  ? t('admin.matches.snackbar_validated', 'Score validé, classement recalculé')
  : t('admin.matches.snackbar_saved', 'Score enregistré'))
const handleWritten = (match: IAdminMatch, outcome: SCORE_ENTRY_SUCCESS) => {
  queue.replaceMatch(match)
  snackbarOutcome.value = outcome
  snackbarOpen.value = true
}

/*********************************************************
 * Expose
 *
 * @description
 * Une page n'expose rien à un parent.
 ********************************************************/
defineExpose({})
</script>

<style scoped lang="scss">
.admin-matches {
  &__head {
    margin-bottom: var(--admin-matches__head---margin-bottom, var(--origam-space---6));
  }

  &__eyebrow {
    margin: 0;
    color: var(--origam-color__text---tertiary);
    font-size: var(--origam-font__size---xs);
    font-weight: var(--origam-font__weight---bold);
    letter-spacing: var(--origam-font__letterSpacing---wide);
    text-transform: uppercase;
  }

  &__title {
    margin-top: var(--origam-space---2);
    font-size: var(--origam-font__size---4xl);
    line-height: 1;
  }

  &__readonly {
    margin-bottom: var(--admin-matches__readonly---margin-bottom, var(--origam-space---5));
  }
}
</style>

<style>
:root {
  --admin-matches__head---margin-bottom: var(--origam-space---6);
  --admin-matches__readonly---margin-bottom: var(--origam-space---5);
}
</style>

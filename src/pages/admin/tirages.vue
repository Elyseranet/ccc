<template>
  <div
    class="admin-draws"
    data-cy="admin-draws"
  >
    <header class="admin-draws__head">
      <div class="admin-draws__heading">
        <p class="admin-draws__eyebrow">
          {{ eyebrow }}
        </p>
        <origam-title
          tag="h1"
          class="admin-draws__title font-display neon--sm"
          data-cy="page-title"
          :text="title"
        />
      </div>
      <p class="admin-draws__lead">
        {{ lead }}
      </p>
    </header>
    <origam-alert
      v-if="loadError"
      status="error"
      :text="loadErrorText"
      data-cy="draw-load-error"
    >
      <template #close>
        <origam-btn
          variant="outlined"
          size="small"
          :text="retryLabel"
          data-cy="draw-load-retry"
          @click="handleReload"
        />
      </template>
    </origam-alert>
    <origam-alert
      v-else-if="!edition"
      status="info"
      rounded="lg"
      :text="noEditionText"
      data-cy="draw-no-edition"
    />
    <template v-else>
      <origam-alert
        v-if="isValidated"
        status="info"
        rounded="lg"
        :text="validatedText"
        data-cy="draw-read-only"
      />
      <origam-alert
        v-else-if="isClosed"
        status="info"
        rounded="lg"
        :text="closedText"
        data-cy="draw-closed"
      />
      <origam-alert
        v-else-if="total < 2"
        status="warning"
        rounded="lg"
        :text="fewText"
        data-cy="draw-too-few"
      />
      <origam-alert
        v-if="feedback && feedback.status === POOL_DRAW_FEEDBACK_STATUS.ERROR"
        status="error"
        rounded="lg"
        :text="feedbackText"
        data-cy="draw-error"
      >
        <template
          v-if="needsRestart"
          #close
        >
          <origam-btn
            variant="outlined"
            size="small"
            :text="restartLabel"
            data-cy="draw-restart"
            @click="handleRestart"
          />
        </template>
      </origam-alert>
      <draw-steps :steps="steps" />
      <draw-parameters
        v-if="step === POOL_DRAW_STEP.PARAMETERS && !isReadOnly && total >= 2"
        :pool-count="poolCount"
        :total="total"
        :issue="parametersIssue"
        :busy="busy"
        :read-only="isReadOnly"
        @update:pool-count="handlePoolCount"
        @next="handleLoadSeeds"
      />
      <draw-seeds
        v-else-if="step === POOL_DRAW_STEP.SEEDS"
        :seeds="seedRows"
        :selected-ids="seedIds"
        :tie-groups="tieGroups"
        :choices="tieChoices"
        :pool-count="poolCount"
        :issue="seedsIssue"
        :can-confirm="canConfirmSeeds"
        :busy="busy"
        @toggle="handleToggleTie"
        @back="handleRestart"
        @confirm="handleConfirmSeeds"
      />
      <draw-assignment
        v-else-if="step === POOL_DRAW_STEP.ENTRY"
        :pools="pools"
        :players="players"
        :unplaced="unplaced"
        :seed-rows="seedRows"
        :progress="progress"
        :pool-count="poolCount"
        :save-state="saveState"
        :read-only="isReadOnly"
        :complete="isComplete"
        @assign="handleAssign"
        @change="handleChange"
        @retry="handleRetry"
        @next="handleGoToRecap"
      />
      <template v-else-if="step === POOL_DRAW_STEP.RECAP || step === POOL_DRAW_STEP.VALIDATION">
        <draw-recap
          :pools="pools"
          :players="players"
          :total="total"
          :match-count="matchCount"
          :read-only="isReadOnly || step === POOL_DRAW_STEP.VALIDATION"
          :can-validate="canValidate"
          @back="handleBackToEntry"
          @next="handleGoToValidation"
        />
        <draw-validation
          v-if="step === POOL_DRAW_STEP.VALIDATION"
          :total="total"
          :pool-count="poolCount"
          :match-count="matchCount"
          :can-validate="canValidate"
          :busy="busy"
          :validated="isValidated"
          @confirm="handleValidate"
        />
        <origam-btn
          v-if="step === POOL_DRAW_STEP.VALIDATION && !isReadOnly"
          variant="text"
          :text="backLabel"
          class="admin-draws__back"
          data-cy="draw-validation-back"
          @click="handleBackToEntry"
        />
      </template>
    </template>
    <origam-snackbar
      :model-value="savedOpen"
      :text="savedText"
      status="success"
      location="bottom"
      :timeout="POOL_DRAW_SNACKBAR_TIMEOUT_MS"
      data-cy="draw-saved"
      @update:model-value="handleSavedOpen"
    />
    <origam-snackbar
      :model-value="successOpen"
      :text="feedbackText"
      status="success"
      location="bottom"
      :timeout="POOL_DRAW_SNACKBAR_TIMEOUT_MS * 2"
      data-cy="draw-feedback"
      @update:model-value="handleFeedbackOpen"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { OrigamAlert, OrigamBtn, OrigamSnackbar, OrigamTitle } from 'origam/components'
import DrawAssignment from '~/components/admin/draws/DrawAssignment.vue'
import DrawParameters from '~/components/admin/draws/DrawParameters.vue'
import DrawRecap from '~/components/admin/draws/DrawRecap.vue'
import DrawSeeds from '~/components/admin/draws/DrawSeeds.vue'
import DrawSteps from '~/components/admin/draws/DrawSteps.vue'
import DrawValidation from '~/components/admin/draws/DrawValidation.vue'
import { useAdminEdition } from '~/composables/useAdminEdition'
import { usePoolDraw } from '~/composables/usePoolDraw'
import { useSeo } from '~/composables/useSeo'
import { useT } from '~/composables/useT'
import { EDITION_STATUS_LABELS } from '~/consts/edition-status.const'
import { POOL_DRAW_SNACKBAR_TIMEOUT_MS } from '~/consts/pool-draw.const'
import { POOL_DRAW_FEEDBACK_STATUS, POOL_DRAW_SAVE_STATE, POOL_DRAW_STEP } from '~/enums/pool-draw.enum'
import { poolMatchCount, toSeedRows } from '~/utils/pool-draw.util'

/*********************************************************
 * Page
 *
 * @description
 * Tirage des poules de l'édition active (F-11) : le tirage est physique, l'application l'enregistre au fur et à mesure (A1) dans un
 * brouillon du serveur, puis le fige à la validation. La page assemble les cinq étapes ; toute la logique (appels, état, erreurs) est dans
 * `usePoolDraw` et `pool-draw.util`. L'édition active est celle du sélecteur de la coque.
 ********************************************************/
definePageMeta({ layout: 'admin', middleware: 'admin' })
const { t } = useT()
const props = withDefaults(defineProps<{}>(), {})
const emits = defineEmits<{}>()
defineSlots<{}>()
const documentTitle = computed(() => t('pages.admin_draws.title', 'Tirages'))
const title = computed(() => t('admin.draws.title', 'Tirage des poules'))
useHead({ title: documentTitle })
useSeo({ noindex: true })

await useAdminEdition()
const {
  edition, step, steps, players, total, poolCount, proposal, tieGroups, tieChoices, seedIds, parametersIssue, seedsIssue, canConfirmSeeds,
  pools, unplaced, progress, isComplete, canValidate, saveState, lastSaved, feedback, busy, needsRestart, isValidated, isClosed, isReadOnly, loadError,
  loadSeeds, toggleTieChoice, confirmSeeds, assign, change, retrySave, goToRecap, goToValidation, backToEntry, validate, restart, reload, dismissFeedback
} = await usePoolDraw()

/*********************************************************
 * Libellés
 ********************************************************/
const eyebrow = computed(() => (edition.value
  ? t('admin.draws.eyebrow', 'Édition {year} · tirage physique', { year: edition.value.year })
  : t('admin.draws.eyebrow_none', 'Aucune édition')))
const lead = computed(() => t('admin.draws.lead', 'Le tirage se fait à la main, par une main innocente ; l’application l’enregistre au fur et à mesure.'))
const loadErrorText = computed(() => t('admin.draws.load_error', 'Le tirage n’a pas pu être chargé.'))
const retryLabel = computed(() => t('components.async_state.retry', 'Réessayer'))
const noEditionText = computed(() => t('admin.draws.no_edition', 'Aucune édition active : choisissez une édition dans le sélecteur.'))
const validatedText = computed(() => t('admin.draws.read_only_validated', 'Le tirage de cette édition est validé : il ne peut plus changer.'))
const closedText = computed(() => t('admin.draws.read_only_closed', 'Les inscriptions de cette édition sont closes : le tirage ne peut plus être fait.'))
const fewText = computed(() => t('admin.draws.too_few', 'Il faut au moins deux inscrits pour tirer des poules : ajoutez des participants.'))
const restartLabel = computed(() => t('admin.draws.restart', 'Recommencer le tirage'))
const backLabel = computed(() => t('admin.draws.validation_back', 'Revenir à la saisie'))
const seedRows = computed(() => (proposal.value ? toSeedRows(proposal.value) : []))
const matchCount = computed(() => poolMatchCount(pools.value))

/*********************************************************
 * Retours
 *
 * @description
 * Un retour d'enregistrement à la fois : « Brouillon enregistré » après chaque affectation (poule, place et avancement), et le retour
 * d'une action réussie (validation). Une erreur reste affichée dans une alerte, avec l'action de recommencer quand il le faut.
 ********************************************************/
const savedOpen = ref(false)
watch(lastSaved, (value) => {
  savedOpen.value = value !== null
})
const savedText = computed(() => {
  const saved = lastSaved.value
  if (!saved) {
    return ''
  }
  return saved.poolNumber > 0
    ? t('admin.draws.draft_saved_detail', 'Brouillon enregistré · Poule {pool}, place {place} · {placed}/{total}', { pool: saved.poolNumber, place: saved.place, placed: saved.placed, total: saved.total })
    : t('admin.draws.draft_saved_retry', 'Brouillon enregistré · {placed}/{total}', { placed: saved.placed, total: saved.total })
})
const feedbackText = computed(() => (feedback.value ? t(feedback.value.message.key, feedback.value.message.fallback, feedback.value.message.params) : ''))
const successOpen = computed(() => feedback.value !== null && feedback.value.status === POOL_DRAW_FEEDBACK_STATUS.SUCCESS)
const handleSavedOpen = (open: boolean) => {
  savedOpen.value = open
}
const handleFeedbackOpen = (open: boolean) => {
  if (!open) {
    dismissFeedback()
  }
}
watch(saveState, (state) => {
  if (state === POOL_DRAW_SAVE_STATE.FAILED) {
    savedOpen.value = false
  }
})

/*********************************************************
 * Actions
 *
 * @description
 * La page ne fait que relayer les événements des étapes au composable.
 ********************************************************/
const handlePoolCount = (value: number) => {
  poolCount.value = value
}
const handleLoadSeeds = () => {
  loadSeeds()
}
const handleToggleTie = (groupIndex: number, participationId: string) => {
  toggleTieChoice(groupIndex, participationId)
}
const handleConfirmSeeds = () => {
  confirmSeeds()
}
const handleAssign = (poolNumber: number, participationId: string) => {
  assign(poolNumber, participationId)
}
const handleChange = (poolNumber: number, place: number, participationId: string) => {
  change(poolNumber, place, participationId)
}
const handleRetry = () => {
  retrySave()
}
const handleGoToRecap = () => {
  goToRecap()
}
const handleGoToValidation = () => {
  goToValidation()
}
const handleBackToEntry = () => {
  backToEntry()
}
const handleValidate = () => {
  validate()
}
const handleRestart = () => {
  restart()
}
const handleReload = () => {
  reload()
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
.admin-draws {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--admin-draws---gap, var(--origam-space---5));

  &__head {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    justify-content: space-between;
    gap: var(--origam-space---4);
  }

  &__heading {
    display: grid;
    gap: var(--origam-space---2);
  }

  &__eyebrow {
    margin: 0;
    font-size: var(--origam-font__size---xs);
    font-weight: var(--origam-font__weight---bold);
    letter-spacing: var(--origam-font__letterSpacing---wider);
    text-transform: uppercase;
    color: var(--origam-color__text---tertiary);
  }

  &__title {
    font-size: var(--origam-font__size---4xl);
    line-height: 1;
  }

  &__lead {
    max-width: 36rem;
    margin: 0;
    color: var(--origam-color__text---secondary);
  }

  &__back {
    justify-self: start;
  }
}
</style>

<style>
:root {
  --admin-draws---gap: var(--origam-space---5);
}
</style>

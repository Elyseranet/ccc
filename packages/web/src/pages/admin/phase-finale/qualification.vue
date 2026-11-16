<template>
  <section
    class="admin-qualification"
    aria-labelledby="admin-qualification-title"
    data-cy="admin-qualification"
  >
    <phase-steps :current="currentStep" />
    <header class="admin-qualification__head">
      <div class="admin-qualification__heading">
        <p
          v-if="eyebrow"
          class="admin-qualification__eyebrow"
        >
          {{ eyebrow }}
        </p>
        <origam-title
          id="admin-qualification-title"
          tag="h1"
          class="admin-qualification__title font-display neon--sm"
          data-cy="page-title"
          :text="title"
        />
      </div>
      <p class="admin-qualification__lead">
        {{ lead }}
      </p>
    </header>
    <origam-alert
      v-if="isClosed"
      status="info"
      density="compact"
      rounded="lg"
      :title="closedTitle"
      :text="closedText"
      font-size="md"
      font-weight="bold"
      letter-spacing="normal"
      line-height="normal"
      data-cy="qualification-closed"
    />
    <origam-alert
      v-else-if="isFinalized"
      status="info"
      rounded="lg"
      :title="finalizedTitle"
      :text="finalizedText"
      font-size="md"
      font-weight="bold"
      letter-spacing="normal"
      line-height="normal"
      role="status"
      data-cy="qualification-finalized"
    />
    <origam-alert
      v-if="failureView"
      status="error"
      rounded="lg"
      :density="failureView.density"
      :title="failureView.title"
      font-size="md"
      font-weight="bold"
      letter-spacing="normal"
      line-height="normal"
      role="alert"
      data-cy="qualification-failure"
    >
      <template #text>
        {{ failureView.body }}
        <origam-btn
          v-if="failureView.reloadable"
          variant="outlined"
          font-size="sm"
          padding-inline="calc(var(--origam-space---4) - var(--origam-border__width---2))"
          :text="reloadLabel"
          data-cy="qualification-reload"
          @click="handleReload"
        />
      </template>
    </origam-alert>
    <async-state
      :pending="pending"
      :error="pageError"
      :empty="isEmpty"
      :empty-title="emptyTitle"
      :empty-description="emptyDescription"
      @retry="handleReload"
    >
      <template #default>
        <draw-steps
          :steps="stepViews"
          :label="stepsLabel"
        />
        <div class="admin-qualification__grid">
          <qualification-prerequisites
            v-if="prerequisites"
            :prerequisites="prerequisites"
            :readonly="isReadonly"
          />
          <qualification-ranking :tables="rankTables" />
        </div>
        <qualification-ties
          v-if="showTies"
          :ties="ties"
          :busy-tie="busyTie"
          :deleting-tie="deletingTie"
          :settled="isSettled"
          :pending-count="pendingCount"
          @create="handleCreate"
          @delete="handleDelete"
        />
        <qualification-parameters
          :inputs="inputs"
          :check="check"
          :bounds="bounds"
          :readonly="isReadonly"
          :preview="preview"
          @update:top-per-pool="handleTop"
          @update:best-next-count="handleBest"
          @update:with-playoff="handlePlayoff"
        />
        <qualification-finalize
          :rows="qualifiedRows"
          :blocker="finalizeBlocker"
          :pending-count="pendingCount"
          :tie-count="tieCount"
          :busy="finalizing"
          :finalized="isReadonly"
          :qualified-count="qualifiedCount"
          :parameters="status?.parameters ?? null"
          :round-kind="finalizeRoundKind"
          @finalize="handleFinalize"
        >
          <template #finalized-action>
            <qualification-reopen
              :blocker="reopenBlocker"
              :round-kind="firstRoundKind"
              :draft="reopenDraft"
              :open="reopenDialogOpen"
              :preparing="preparingReopen"
              :busy="reopening"
              :qualified-count="qualifiedCount"
              @open="handleOpenReopen"
              @cancel="handleCancelReopen"
              @confirm="handleConfirmReopen"
            />
          </template>
        </qualification-finalize>
      </template>
    </async-state>
    <origam-snackbar
      v-model="snackbarOpen"
      status="success"
      :text="snackbarText"
      :timeout="snackbarTimeout"
      data-cy="qualification-snackbar"
    />
    <origam-snackbar
      v-model="deletedSnackbarOpen"
      status="success"
      :text="deletedSnackbarText"
      :timeout="snackbarTimeout"
      data-cy="qualification-deleted-snackbar"
    />
    <origam-snackbar
      v-model="reopenedSnackbarOpen"
      status="success"
      :text="reopenedSnackbarText"
      :timeout="snackbarTimeout"
      data-cy="qualification-reopened-snackbar"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { OrigamAlert, OrigamBtn, OrigamSnackbar, OrigamTitle } from 'origam/components'
import DrawSteps from '~/components/admin/draws/DrawSteps.vue'
import QualificationFinalize from '~/components/admin/qualification/QualificationFinalize.vue'
import QualificationParameters from '~/components/admin/qualification/QualificationParameters.vue'
import PhaseSteps from '~/components/admin/phase/PhaseSteps.vue'
import QualificationPrerequisites from '~/components/admin/qualification/QualificationPrerequisites.vue'
import QualificationReopen from '~/components/admin/qualification/QualificationReopen.vue'
import QualificationRanking from '~/components/admin/qualification/QualificationRanking.vue'
import QualificationTies from '~/components/admin/qualification/QualificationTies.vue'
import AsyncState from '~/components/common/AsyncState.vue'
import { useQualification } from '~/composables/useQualification'
import { useSeo } from '~/composables/useSeo'
import { useT } from '~/composables/useT'
import { ADMIN_DASHBOARD_STEP_COUNT, ADMIN_DASHBOARD_STEPS } from '~/consts/admin-dashboard.const'
import { QUALIFICATION_FAILURE_TEXT, QUALIFICATION_SNACKBAR_TIMEOUT_MS, QUALIFICATION_STALE_FAILURES, QUALIFICATION_STEP_LABELS } from '~/consts/qualification-view.const'
import { ADMIN_DASHBOARD_STEP } from '~/enums/admin-dashboard.enum'
import { PHASE_STEP } from '~/enums/qualification.enum'
import type { ITranslatableText } from '~/interfaces/common-components.interface'
import type { IQualificationTieView } from '~/interfaces/qualification-view.interface'
import { firstRoundText } from '~/utils/qualification-text.util'
import { firstRoundKind as deduceFirstRound, previewCount } from '~/utils/qualification-view.util'

/*********************************************************
 * Page
 *
 * @description
 * Première page de la « Phase finale » (F-24) : arrêter la liste des qualifiés à l'issue des poules, après avoir réglé les égalités (B-13). La page assemble :
 * l'état, la simulation et les deux écritures viennent de `useQualification`, les quatre blocs sont des composants, l'état dégradé (chargement, erreur, vide)
 * est celui d'`AsyncState`. L'arrêt de la liste se défait par « Rouvrir les qualifications » (F-51, B-25) tant que le tirage du premier tour n'est pas validé ; le dialogue d'arrêt le dit.
 ********************************************************/
definePageMeta({ layout: 'admin', middleware: 'admin' })
const { t } = useT()
const props = withDefaults(defineProps<{}>(), {})
const emits = defineEmits<{}>()
defineSlots<{}>()
const currentStep = PHASE_STEP.QUALIFICATION
const title = computed(() => t('pages.admin_qualification.title', 'Qualification'))
useHead({ title })
useSeo({ noindex: true })
const qualification = await useQualification()
const {
  status, edition, inputs, check, bounds, parameters, isClosed, isFinalized, isReadonly, prerequisites, rankTables, ties, qualifiedRows, steps,
  pendingCount, finalizeBlocker, previewReady, pageError, pending, failure, busyTie, deletingTie, finalizing, justFinalized, justDeleted, reopenDialogOpen, reopenDraft, preparingReopen, reopening, justReopened, reopenBlocker, firstRoundKind
} = qualification
const isEmpty = computed(() => status.value === null || status.value.pools.length === 0)
const tieCount = computed(() => ties.value.length)
const qualifiedCount = computed(() => qualifiedRows.value.length)
const finalizeRoundKind = computed(() => deduceFirstRound(inputs.value.withPlayoff, qualifiedCount.value))
const showTies = computed(() => !isReadonly.value)
const isSettled = computed(() => !isReadonly.value && tieCount.value === 0 && pendingCount.value === 0)
const preview = computed(() => previewReady.value && parameters.value ? previewCount(parameters.value, bounds.value.poolCount) : null)

/*********************************************************
 * Textes
 *
 * @description
 * Clés de traduction ; le gabarit ne fait que les afficher.
 ********************************************************/
const workflowStep = ADMIN_DASHBOARD_STEPS.findIndex(entry => entry.step === ADMIN_DASHBOARD_STEP.QUALIFIED_VALIDATION) + 1
const eyebrow = computed(() => edition.value
  ? t('admin.qualification.eyebrow', 'Édition {year} · étape {step} sur {total}', { year: edition.value.year, step: workflowStep, total: ADMIN_DASHBOARD_STEP_COUNT })
  : t('admin.qualification.eyebrow_none', 'Aucune édition'))
const lead = computed(() => t('admin.qualification.lead', 'Arrêter la liste des qualifiés à l’issue des poules, après avoir réglé les égalités.'))
const stepsLabel = computed(() => t('admin.qualification.steps_label', 'Étapes de la qualification'))
const stepViews = computed(() => steps.value.map(entry => ({ label: QUALIFICATION_STEP_LABELS[entry.step], state: entry.state })))
const closedTitle = computed(() => t('admin.qualification.closed_title', 'Édition clôturée'))
const closedText = computed(() => t('admin.qualification.closed_text', 'Ses résultats et ses points sont figés : elle ne se modifie plus.'))
const finalizedTitle = computed(() => t('admin.qualification.finalized_title', 'Liste arrêtée'))
const finalizedText = computed(() => {
  const saved = status.value?.parameters
  if (!saved) {
    return t('admin.qualification.finalized_text_unknown', 'La liste des qualifiés est arrêtée. Prochaine étape : le tirage du tour.')
  }
  const params = { top: saved.topPerPool, best: saved.bestNextCount }
  return saved.withPlayoff
    ? t('admin.qualification.finalized_text_playoff', '{top} premiers par poule, {best} meilleurs (n+1)es, avec barrages. Prochaine étape : le tirage du tour.', params)
    : t('admin.qualification.finalized_text', '{top} premiers par poule, {best} meilleurs (n+1)es, sans barrages. Prochaine étape : le tirage du tour.', params)
})
const emptyTitle: ITranslatableText = { key: 'admin.qualification.empty_title', fallback: 'Aucune poule à qualifier' }
const emptyDescription = computed<ITranslatableText>(() => edition.value
  ? { key: 'admin.qualification.empty_text', fallback: 'Les poules de cette édition ne sont pas encore tirées.' }
  : { key: 'admin.qualification.empty_text_none', fallback: 'Choisissez une édition dans le sélecteur de la barre haute.' })
const reloadLabel = computed(() => t('admin.qualification.reload', 'Recharger'))
const snackbarTimeout = QUALIFICATION_SNACKBAR_TIMEOUT_MS
const snackbarText = computed(() => t('admin.qualification.snackbar_finalized', 'Liste des qualifiés arrêtée'))
const deletedSnackbarText = computed(() => t('admin.qualification.snackbar_tiebreak_deleted', 'Départage supprimé : l’égalité est à départager'))
const reopenedSnackbarText = computed(() => t('admin.qualification.snackbar_reopened', 'Qualifications rouvertes : ajustez les paramètres puis arrêtez la liste'))
const failureView = computed(() => {
  if (failure.value === null) {
    return null
  }
  const text = QUALIFICATION_FAILURE_TEXT[failure.value]
  return {
    title: text.title ? t(text.title.key, text.title.fallback) : undefined,
    density: text.title ? 'default' as const : 'compact' as const,
    body: t(text.body.key, text.body.fallback, { round: firstRoundText(t, firstRoundKind.value) }),
    reloadable: QUALIFICATION_STALE_FAILURES.includes(failure.value)
  }
})

/*********************************************************
 * Actions
 *
 * @description
 * Les champs vivent dans le composable : chaque saisie relance la simulation après une pause. « Arrêter la liste » confirme d'abord (dialogue), puis écrit ; « Rouvrir les qualifications » (F-51) aussi, et ramène la page à la saisie des paramètres.
 ********************************************************/
const snackbarOpen = ref(false)
watch(justFinalized, (value) => {
  if (value) {
    snackbarOpen.value = true
  }
})
const deletedSnackbarOpen = ref(false)
watch(justDeleted, (value) => {
  if (value) {
    deletedSnackbarOpen.value = true
  }
})
const reopenedSnackbarOpen = ref(false)
watch(justReopened, (value) => {
  if (value) {
    reopenedSnackbarOpen.value = true
  }
})
const handleOpenReopen = () => {
  qualification.openReopen()
}
const handleCancelReopen = () => {
  qualification.cancelReopen()
}
const handleConfirmReopen = () => {
  qualification.reopen()
}
const handleDelete = (tie: IQualificationTieView) => {
  qualification.deleteTiebreak(tie)
}
const handleReload = () => {
  qualification.reload()
}
const handleTop = (value: string) => {
  inputs.value = { ...inputs.value, topPerPool: value }
}
const handleBest = (value: string) => {
  inputs.value = { ...inputs.value, bestNextCount: value }
}
const handlePlayoff = (value: boolean) => {
  inputs.value = { ...inputs.value, withPlayoff: value }
}
const handleCreate = (tie: IQualificationTieView) => {
  qualification.createTiebreak(tie)
}
const handleFinalize = () => {
  qualification.finalize()
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
.admin-qualification {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--admin-qualification---gap, var(--origam-space---5));

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
    margin: 0;
    color: var(--origam-color__text---secondary);
  }

  &__grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 2fr);
    align-items: start;
    gap: var(--origam-space---5);

    @media (max-width: 1000px) {
      grid-template-columns: minmax(0, 1fr);
    }
  }
}
</style>

<style>
:root {
  --admin-qualification---gap: var(--origam-space---5);
}
</style>

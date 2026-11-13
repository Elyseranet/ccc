<template>
  <section
    class="admin-round-draw"
    aria-labelledby="admin-round-draw-title"
    data-cy="admin-round-draw"
  >
    <phase-steps :current="currentStep" />
    <header class="admin-round-draw__head">
      <div class="admin-round-draw__heading">
        <p
          v-if="eyebrow"
          class="admin-round-draw__eyebrow"
        >
          {{ eyebrow }}
        </p>
        <origam-title
          id="admin-round-draw-title"
          tag="h1"
          class="admin-round-draw__title font-display neon--sm"
          data-cy="page-title"
          :text="title"
        />
      </div>
      <p class="admin-round-draw__lead">
        {{ lead }} <nuxt-link :to="matchesRoute">
          {{ leadLink }}
        </nuxt-link>{{ leadEnd }}
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
      data-cy="round-draw-closed"
    />
    <origam-alert
      v-if="feedbackView"
      :status="feedbackView.status"
      rounded="lg"
      :text="feedbackView.text"
      font-size="md"
      font-weight="bold"
      letter-spacing="normal"
      line-height="normal"
      :role="feedbackView.role"
      :data-cy="feedbackView.dataCy"
    >
      <template #close>
        <origam-btn
          v-if="feedbackView.reloadable"
          variant="outlined"
          size="small"
          :text="reloadLabel"
          data-cy="round-draw-reload"
          @click="handleReload"
        />
        <origam-btn
          v-else-if="feedbackView.retryable"
          variant="outlined"
          size="small"
          :text="retryLabel"
          data-cy="round-draw-retry"
          @click="handleRetry"
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
          v-if="stepViews.length > 0"
          :steps="stepViews"
          :label="stepsLabel"
        />
        <round-draw-state
          v-if="showState && view"
          :view="view"
          :round-kind="stateRoundKind"
          :player-count="players.length"
          :remaining-matches="remainingMatches"
          :match-count="matchCount"
          :validated-on="validatedOn"
        />
        <round-draw-choice
          v-else-if="view === choiceView"
          :round-kind="roundKind"
          :allowed-round-kinds="allowedRoundKinds"
          :player-count="players.length"
          :busy="busy"
          @start="handleStart"
        />
        <template v-else-if="view === entryView && roundKind">
          <div class="admin-round-draw__grid">
            <round-draw-entry
              :round-kind="roundKind"
              :pairings="pairings"
              :players="drawable"
              :progress="progress"
              :read-only="isReadOnly"
              :changeable="isChosen"
              :save-state="saveState"
              @place="handlePlace"
              @change="handleChange"
              @change-round="handleChangeRound"
            />
            <round-draw-side
              :round-kind="roundKind"
              :player-count="players.length"
              :leader-count="leaderCount"
              :has-playoff="hasPlayoff"
              :unplaced="unplaced"
              :playoff-waiting="roundKind === playoffKind"
            />
          </div>
          <round-draw-recap
            :round-kind="roundKind"
            :rows="recap"
            :blocker="blocker"
            :remaining="progress.total - progress.pairings"
            :busy="busy"
            @validate="handleValidate"
          />
          <round-draw-change-dialog
            :open="changeOpen"
            :allowed-round-kinds="changeKinds"
            :current-kind="roundKind"
            :saved-pairings="progress.pairings"
            :busy="busy"
            @cancel="handleChangeCancel"
            @confirm="handleChangeConfirm"
          />
        </template>
      </template>
    </async-state>
    <origam-snackbar
      v-model="snackbarOpen"
      status="success"
      :text="snackbarText"
      :timeout="snackbarTimeout"
      data-cy="round-draw-snackbar"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { OrigamAlert, OrigamBtn, OrigamSnackbar, OrigamTitle } from 'origam/components'
import DrawSteps from '~/components/admin/draws/DrawSteps.vue'
import PhaseSteps from '~/components/admin/phase/PhaseSteps.vue'
import RoundDrawChangeDialog from '~/components/admin/round-draw/RoundDrawChangeDialog.vue'
import RoundDrawChoice from '~/components/admin/round-draw/RoundDrawChoice.vue'
import RoundDrawEntry from '~/components/admin/round-draw/RoundDrawEntry.vue'
import RoundDrawRecap from '~/components/admin/round-draw/RoundDrawRecap.vue'
import RoundDrawSide from '~/components/admin/round-draw/RoundDrawSide.vue'
import RoundDrawState from '~/components/admin/round-draw/RoundDrawState.vue'
import AsyncState from '~/components/common/AsyncState.vue'
import { useRoundDraw } from '~/composables/useRoundDraw'
import { useSeo } from '~/composables/useSeo'
import { useT } from '~/composables/useT'
import { ADMIN_DASHBOARD_STEP_COUNT, ADMIN_DASHBOARD_STEPS } from '~/consts/admin-dashboard.const'
import { POOL_DRAW_SNACKBAR_TIMEOUT_MS } from '~/consts/pool-draw.const'
import { ROUND_LABELS } from '~/consts/round-labels.const'
import { ROUTES } from '~/consts/routes.const'
import { ADMIN_DASHBOARD_STEP } from '~/enums/admin-dashboard.enum'
import { FEEDBACK_STATUS } from '~/enums/feedback.enum'
import { POOL_DRAW_SAVE_STATE } from '~/enums/pool-draw.enum'
import { PHASE_STEP } from '~/enums/qualification.enum'
import { ROUND_DRAW_MENTION, ROUND_DRAW_VIEW } from '~/enums/round-draw.enum'
import { ROUND_KIND } from '~/enums/round.enum'
import type { ITranslatableText } from '~/interfaces/common-components.interface'
import { formatDrawMoment } from '~/utils/round-draw.util'

/*********************************************************
 * Page
 *
 * @description
 * Deuxième page de la « Phase finale » (F-25) : enregistrer le tirage physique de chaque tour (barrages d'abord s'il y en a, PLAYOFF-DRAW, puis les huitièmes jusqu'à la finale ; RG13, RG14),
 * affiche par affiche. La page assemble : l'aperçu, le brouillon, la saisie et la validation viennent de `useRoundDraw`, les blocs sont des composants, l'état dégradé (chargement, erreur,
 * vide) est celui d'`AsyncState`. Un tour n'existe qu'à la validation de son tirage (B-18) : le stepper n'annonce que ce que le serveur sait. Les scores se saisissent dans « Poules et matchs ».
 ********************************************************/
definePageMeta({ layout: 'admin', middleware: 'admin' })
const { t } = useT()
const props = withDefaults(defineProps<{}>(), {})
const emits = defineEmits<{}>()
defineSlots<{}>()
const currentStep = PHASE_STEP.ROUND_DRAW
const choiceView = ROUND_DRAW_VIEW.CHOICE
const entryView = ROUND_DRAW_VIEW.ENTRY
const playoffKind = ROUND_KIND.PLAYOFF
const matchesRoute = ROUTES.ADMIN_MATCHES
const title = computed(() => t('pages.admin_round_draw.title', 'Tirage du tour'))
useHead({ title })
useSeo({ noindex: true })
const draw = await useRoundDraw()
const {
  edition, view, preview, rounds, roundKind, players, drawable, steps, pairings, unplaced, progress, blocker, recap, saveState, feedback, busy, stale, isClosed, isReadOnly,
  pageError, pending, drawnRound, validatedDraw
} = draw
const isEmpty = computed(() => preview.value === null)
const allowedRoundKinds = computed(() => preview.value?.allowedRoundKinds ?? [])
const showState = computed(() => view.value !== null && view.value !== ROUND_DRAW_VIEW.ENTRY && view.value !== ROUND_DRAW_VIEW.CHOICE)
const leaderCount = computed(() => players.value.filter(player => player.isLeader).length)
const hasPlayoff = computed(() => rounds.value.some(round => round.kind === ROUND_KIND.PLAYOFF))
/** Le tour s'est choisi (vivier hors 2, 4, 8, 16) : « Changer de tour » est proposé tant que le tirage n'est pas validé. */
const isChosen = computed(() => preview.value !== null && preview.value.roundKind === null && allowedRoundKinds.value.length > 1)
const changeKinds = computed(() => allowedRoundKinds.value)
const stateRoundKind = computed<ROUND_KIND | null>(() => drawnRound.value?.kind ?? null)
const remainingMatches = computed(() => drawnRound.value ? drawnRound.value.matchCount - drawnRound.value.validatedMatchCount : 0)
const matchCount = computed(() => drawnRound.value?.matchCount ?? 0)
const validatedOn = computed(() => (validatedDraw.value?.validatedAt ? formatDrawMoment(validatedDraw.value.validatedAt) : null))

/*********************************************************
 * Textes
 *
 * @description
 * Clés de traduction ; le gabarit ne fait que les afficher.
 ********************************************************/
const workflowStep = ADMIN_DASHBOARD_STEPS.findIndex(entry => entry.step === ADMIN_DASHBOARD_STEP.BRACKET_DRAW) + 1
const eyebrow = computed(() => edition.value
  ? t('admin.round_draw.eyebrow_page', 'Édition {year} · étape {step} sur {total}', { year: edition.value.year, step: workflowStep, total: ADMIN_DASHBOARD_STEP_COUNT })
  : t('admin.round_draw.eyebrow_none', 'Aucune édition'))
const lead = computed(() => t('admin.round_draw.lead', 'Enregistrer le tirage physique de chaque tour de la phase finale. Les scores se saisissent dans'))
const leadLink = computed(() => t('admin.round_draw.lead_link', 'Poules et matchs'))
const leadEnd = computed(() => t('admin.round_draw.lead_end', ', filtre par tour.'))
const stepsLabel = computed(() => t('admin.round_draw.steps_label', 'Tours de la phase finale'))
const stepLabelOf = (kind: ROUND_KIND, mention: ROUND_DRAW_MENTION): ITranslatableText => {
  const round = t(ROUND_LABELS[kind].key, ROUND_LABELS[kind].label)
  if (mention === ROUND_DRAW_MENTION.TO_DRAW) {
    return { key: 'admin.round_draw.step_to_draw', fallback: '{round} · à tirer', params: { round } }
  }
  return mention === ROUND_DRAW_MENTION.IN_PROGRESS
    ? { key: 'admin.round_draw.step_in_progress', fallback: '{round} · en cours', params: { round } }
    : { key: ROUND_LABELS[kind].key, fallback: ROUND_LABELS[kind].label }
}
const stepViews = computed(() => steps.value.map(entry => ({ label: stepLabelOf(entry.kind, entry.mention), state: entry.state })))
const closedTitle = computed(() => t('admin.round_draw.closed_title', 'Édition clôturée'))
const closedText = computed(() => t('admin.round_draw.closed_text', 'Ses résultats et ses points sont figés : elle ne se modifie plus.'))
const emptyTitle: ITranslatableText = { key: 'admin.round_draw.empty_title', fallback: 'Aucun tour à tirer' }
const emptyDescription = computed<ITranslatableText>(() => edition.value
  ? { key: 'admin.round_draw.empty_text', fallback: 'Cette édition n’a pas de phase finale à tirer pour le moment.' }
  : { key: 'admin.round_draw.empty_text_none', fallback: 'Choisissez une édition dans le sélecteur de la barre haute.' })
const reloadLabel = computed(() => t('admin.round_draw.reload', 'Recharger'))
const retryLabel = computed(() => t('admin.round_draw.retry', 'Renvoyer'))
const snackbarTimeout = POOL_DRAW_SNACKBAR_TIMEOUT_MS
const snackbarText = computed(() => t('admin.round_draw.snackbar_saved', 'Brouillon enregistré'))
const feedbackView = computed(() => {
  if (!feedback.value) {
    return null
  }
  const failed = feedback.value.status === FEEDBACK_STATUS.ERROR
  return {
    status: feedback.value.status,
    text: t(feedback.value.message.key, feedback.value.message.fallback, feedback.value.message.params),
    role: failed ? 'alert' : 'status',
    dataCy: failed ? 'round-draw-failure' : 'round-draw-feedback',
    reloadable: failed && stale.value,
    retryable: failed && !stale.value && saveState.value === POOL_DRAW_SAVE_STATE.FAILED
  }
})

/*********************************************************
 * Actions
 *
 * @description
 * Le brouillon est enregistré à chaque joueur placé ; le message « Brouillon enregistré » suit (sans bloquer la saisie). « Changer de tour » ouvre une confirmation.
 ********************************************************/
const snackbarOpen = ref(false)
watch(saveState, (value) => {
  if (value === POOL_DRAW_SAVE_STATE.SAVED) {
    snackbarOpen.value = true
  }
})
const changeOpen = ref(false)
const handleReload = () => {
  draw.reload()
}
const handleRetry = () => {
  draw.retrySave()
}
const handleStart = (kind: ROUND_KIND) => {
  draw.startRound(kind)
}
const handlePlace = (pairingIndex: number, participationId: string) => {
  draw.place(pairingIndex, participationId)
}
const handleChange = (pairingIndex: number) => {
  draw.change(pairingIndex)
}
const handleValidate = () => {
  draw.validate()
}
const handleChangeRound = () => {
  changeOpen.value = true
}
const handleChangeCancel = () => {
  changeOpen.value = false
}
const handleChangeConfirm = async (kind: ROUND_KIND) => {
  if (await draw.changeRound(kind)) {
    changeOpen.value = false
  }
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
.admin-round-draw {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--admin-round-draw---gap, var(--origam-space---5));

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
    grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
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
  --admin-round-draw---gap: var(--origam-space---5);
}
</style>

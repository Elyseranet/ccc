<template>
  <section
    class="admin-closing"
    aria-labelledby="admin-closing-title"
    data-cy="admin-closing"
  >
    <phase-steps :current="currentStep" />
    <header class="admin-closing__head">
      <div class="admin-closing__heading">
        <p
          v-if="eyebrow"
          class="admin-closing__eyebrow"
        >
          {{ eyebrow }}
        </p>
        <origam-title
          id="admin-closing-title"
          tag="h1"
          class="admin-closing__title font-display neon--sm"
          data-cy="page-title"
          :text="title"
        />
      </div>
      <p class="admin-closing__lead">
        {{ lead }}
      </p>
    </header>
    <closing-state
      v-if="notice !== null && edition"
      :kind="notice"
      :year="edition.year"
      :closed-at="edition.closedAt"
    />
    <origam-alert
      v-if="failureView"
      status="error"
      rounded="lg"
      :title="failureView.title"
      font-size="md"
      font-weight="bold"
      letter-spacing="normal"
      line-height="normal"
      role="alert"
      data-cy="closing-failure"
    >
      <template #text>
        {{ failureView.body }}
        <origam-btn
          v-if="failureView.verifiable"
          variant="outlined"
          font-size="sm"
          class="small-action-btn"
          color="var(--origam-color__text---primary)"
          :text="verifyLabel"
          data-cy="closing-verify"
          @click="handleVerify"
        />
      </template>
    </origam-alert>
    <async-state
      :pending="pending"
      :error="pageError"
      :empty="isEmpty"
      :empty-title="emptyTitle"
      :empty-description="emptyDescription"
      @retry="handleVerify"
    >
      <template #default>
        <template v-if="view && edition">
          <div class="admin-closing__grid">
            <closing-prerequisites
              :prerequisites="view.prerequisites"
              :champion="view.champion"
              :finalist="view.finalist"
              :participant-count="view.participantCount"
            />
            <closing-effects
              :rows="view.rows"
              :participant-count="view.participantCount"
            />
          </div>
          <closing-confirm
            v-if="!isClosed"
            :code="edition.code"
            :year="edition.year"
            :busy="closing"
            :disabled="isBlocked"
            :reason="reason"
            @confirm="handleConfirm"
          />
        </template>
      </template>
    </async-state>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { OrigamAlert, OrigamBtn, OrigamTitle } from 'origam/components'
import ClosingConfirm from '~/components/admin/closing/ClosingConfirm.vue'
import ClosingEffects from '~/components/admin/closing/ClosingEffects.vue'
import ClosingPrerequisites from '~/components/admin/closing/ClosingPrerequisites.vue'
import ClosingState from '~/components/admin/closing/ClosingState.vue'
import PhaseSteps from '~/components/admin/phase/PhaseSteps.vue'
import AsyncState from '~/components/common/AsyncState.vue'
import { useEditionClosing } from '~/composables/useEditionClosing'
import { useSeo } from '~/composables/useSeo'
import { useT } from '~/composables/useT'
import { ADMIN_DASHBOARD_STEP_COUNT, ADMIN_DASHBOARD_STEPS } from '~/consts/admin-dashboard.const'
import { CLOSING_FAILURE_TEXT, CLOSING_VERIFIABLE_FAILURES } from '~/consts/edition-closing-view.const'
import { ADMIN_DASHBOARD_STEP } from '~/enums/admin-dashboard.enum'
import { CLOSING_NOTICE, CLOSING_STATE } from '~/enums/edition-closing-view.enum'
import { PHASE_STEP } from '~/enums/qualification.enum'
import type { ITranslatableText } from '~/interfaces/common-components.interface'

/*********************************************************
 * Page
 *
 * @description
 * Troisième page de la « Phase finale » (F-26) : clôturer l'édition une fois la finale validée (B-14). L'état et l'écriture viennent de `useEditionClosing`,
 * les trois blocs sont des composants, l'état dégradé (chargement, erreur, vide) est celui d'`AsyncState`. L'aperçu des points vient de la fonction même qui les fige
 * côté serveur (CLOSE-PREVIEW). Aucun retour arrière : la clôture est définitive et la confirmation le dit, et demande le code de l'édition (décision du 2026-11-05).
 * Sur une édition déjà clôturée la page est en lecture seule : l'alerte « Édition clôturée » et pas de bouton.
 * La date de clôture vient de `closedAt` (B-22) ; nulle pour les archives du dump : l'alerte dit alors seulement « Points figés. ».
 ********************************************************/
definePageMeta({ layout: 'admin', middleware: 'admin' })
const { t } = useT()
const props = withDefaults(defineProps<{}>(), {})
const emits = defineEmits<{}>()
defineSlots<{}>()
const currentStep = PHASE_STEP.CLOSING
const title = computed(() => t('pages.admin_closing.title', 'Clôture'))
useHead({ title })
useSeo({ noindex: true })
const closingState = await useEditionClosing()
const { edition, view, pageError, pending, failure, closing, justClosed } = closingState
const isEmpty = computed(() => edition.value === null)
const isClosed = computed(() => view.value?.state === CLOSING_STATE.CLOSED)
const isBlocked = computed(() => view.value?.state !== CLOSING_STATE.READY)
const notice = computed(() => {
  if (justClosed.value) {
    return CLOSING_NOTICE.SUCCESS
  }
  switch (view.value?.state) {
    case CLOSING_STATE.CLOSED:
      return CLOSING_NOTICE.CLOSED
    case CLOSING_STATE.BLOCKED:
      return CLOSING_NOTICE.BLOCKED
    default:
      return null
  }
})

/*********************************************************
 * Textes
 *
 * @description
 * Clés de traduction ; le gabarit ne fait que les afficher.
 ********************************************************/
const workflowStep = ADMIN_DASHBOARD_STEPS.findIndex(entry => entry.step === ADMIN_DASHBOARD_STEP.CLOSING) + 1
const eyebrow = computed(() => edition.value
  ? t('admin.closing.eyebrow', 'Édition {year} · étape {step} sur {total}', { year: edition.value.year, step: workflowStep, total: ADMIN_DASHBOARD_STEP_COUNT })
  : t('admin.closing.eyebrow_none', 'Aucune édition'))
const lead = computed(() => t('admin.closing.lead', 'Dernière étape : clôturer l’édition une fois la finale validée.'))
const reason = computed(() => view.value?.state === CLOSING_STATE.BLOCKED
  ? t('admin.closing.reason_blocked', 'Clôture indisponible : la finale doit d’abord être validée.')
  : '')
const emptyTitle: ITranslatableText = { key: 'admin.closing.empty_title', fallback: 'Aucune édition à clôturer' }
const emptyDescription: ITranslatableText = { key: 'admin.closing.empty_text', fallback: 'Choisissez une édition dans le sélecteur de la barre haute.' }
const verifyLabel = computed(() => t('admin.closing.verify', 'Vérifier l’état'))
const failureView = computed(() => {
  if (failure.value === null) {
    return null
  }
  const text = CLOSING_FAILURE_TEXT[failure.value]
  return {
    title: t(text.title.key, text.title.fallback),
    body: t(text.body.key, text.body.fallback),
    verifiable: CLOSING_VERIFIABLE_FAILURES.includes(failure.value)
  }
})

/*********************************************************
 * Actions
 *
 * @description
 * « Clôturer définitivement » écrit, « Vérifier l'état » relit l'édition (le serveur est la source de vérité : après un échec on ne présume de rien).
 ********************************************************/
const handleConfirm = () => {
  closingState.close()
}
const handleVerify = () => {
  closingState.verify()
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
.admin-closing {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--admin-closing---gap, var(--origam-space---5));

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
    grid-template-columns: minmax(0, 1fr);
    align-items: start;
    gap: var(--origam-space---5);

    @media (min-width: 1001px) {
      grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr);
    }
  }
}
</style>

<style>
:root {
  --admin-closing---gap: var(--origam-space---5);
}
</style>

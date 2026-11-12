<template>
  <div
    class="dashboard"
    data-cy="admin-dashboard"
  >
    <header class="dashboard__head">
      <div>
        <p class="dashboard__eyebrow">
          {{ eyebrow }}
        </p>
        <origam-title
          tag="h1"
          class="dashboard__title font-display neon--sm"
          data-cy="page-title"
          :text="heading"
        />
      </div>
      <origam-btn
        v-if="view"
        :to="validateTarget"
        variant="flat"
        size="x-large"
        bg-color="primary"
        elevation="lg"
        :disabled="!view.canValidate"
        data-cy="admin-dashboard-cta"
      >
        <template #default>
          {{ ctaLabel }}
          <origam-badge
            :model-value="true"
            :content="view.recordedCount"
            inline
            class="dashboard__badge"
            color="secondary"
            :aria-label="badgeLabel"
          />
        </template>
      </origam-btn>
    </header>
    <origam-alert
      v-if="issue"
      :status="issue.status"
      :title="issue.title"
      :text="issue.text"
      rounded="lg"
      data-cy="admin-dashboard-issue"
    />
    <origam-btn
      v-if="isSessionExpired"
      :to="loginTarget"
      variant="outlined"
      class="dashboard__login"
      :text="loginLabel"
      data-cy="admin-dashboard-login"
    />
    <async-state
      v-else-if="!issue"
      :pending="pending"
      :error="genericError"
      :empty="isEmpty"
      :empty-title="emptyTitle"
      @retry="handleRetry"
    >
      <template #default>
        <template v-if="view">
          <origam-alert
            v-if="view.readOnly"
            status="info"
            :text="archivedLabel"
            rounded="lg"
            class="dashboard__archived"
            data-cy="admin-dashboard-archived"
          >
            <template #append>
              <origam-btn
                :to="publicTarget"
                variant="text"
                size="small"
                :text="publicLabel"
                data-cy="admin-dashboard-public"
              />
            </template>
          </origam-alert>
          <div class="dashboard__grid">
            <admin-control-center
              class="dashboard__steps"
              :items="view.steps"
              :progress="view.progress"
            />
            <admin-todo
              class="dashboard__todo"
              :items="view.todo"
            />
            <admin-activity
              class="dashboard__log"
              :items="activityRows"
              :pending="activityPending"
              :error="activityError"
              @retry="handleActivityRetry"
            />
          </div>
        </template>
      </template>
    </async-state>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { OrigamAlert, OrigamBadge, OrigamBtn, OrigamTitle } from 'origam/components'
import AdminActivity from '~/components/admin/dashboard/AdminActivity.vue'
import AdminControlCenter from '~/components/admin/dashboard/AdminControlCenter.vue'
import AdminTodo from '~/components/admin/dashboard/AdminTodo.vue'
import AsyncState from '~/components/common/AsyncState.vue'
import { useAdminActivity } from '~/composables/useAdminActivity'
import { useAdminDashboard } from '~/composables/useAdminDashboard'
import { useSeo } from '~/composables/useSeo'
import { useT } from '~/composables/useT'
import { ROUTES } from '~/consts/routes.const'
import { ADMIN_DASHBOARD_ERROR } from '~/enums/admin-dashboard.enum'
import { recordedQueueLink } from '~/utils/admin-dashboard.util'

/*********************************************************
 * Page
 *
 * @description
 * Tableau de bord admin (`/admin`) : centre de contrôle, éléments à traiter et activité récente de l'édition active.
 * Tout passe par `useAdminDashboard` et `useAdminActivity` ; la page n'appelle aucune couche HTTP.
 ********************************************************/
definePageMeta({ layout: 'admin', middleware: 'admin' })
const { t } = useT()
const props = withDefaults(defineProps<{}>(), {})
const emits = defineEmits<{}>()
defineSlots<{}>()
const { view, pending, error, errorKind, isEmpty, refresh, editionId } = await useAdminDashboard()
const { rows: activityRows, pending: activityPending, error: activityError, refresh: refreshActivity } = useAdminActivity(editionId)
const pageTitle = computed(() => t('pages.admin_dashboard.title', 'Tableau de bord'))
useHead({ title: pageTitle })
useSeo({ noindex: true })

/*********************************************************
 * En-tête
 *
 * @description
 * Le titre devient « Édition {année} » quand une édition est chargée ; la page garde toujours un `h1`.
 ********************************************************/
const eyebrow = computed(() => pageTitle.value)
const heading = computed(() => view.value
  ? t('admin.dashboard.heading', 'Édition {year}', { year: view.value.year })
  : pageTitle.value)
const ctaLabel = computed(() => t('admin.dashboard.cta_validate', 'Valider les scores saisis'))
const badgeLabel = computed(() => t('admin.dashboard.cta_badge_label', '{count} scores saisis', { count: view.value?.recordedCount ?? 0 }))
const validateTarget = recordedQueueLink()

/*********************************************************
 * États dégradés
 *
 * @description
 * Session expirée (401), permission refusée (403) et édition inexistante (404) ont chacune leur message ;
 * toute autre erreur (500, hors ligne, 429) passe par `AsyncState`, qui sait relancer la requête.
 * Une édition clôturée reste consultable en lecture seule.
 ********************************************************/
const isSessionExpired = computed(() => errorKind.value === ADMIN_DASHBOARD_ERROR.SESSION_EXPIRED)
const issue = computed(() => {
  switch (errorKind.value) {
    case ADMIN_DASHBOARD_ERROR.SESSION_EXPIRED:
      return { status: 'warning' as const, title: t('admin.dashboard.session_expired_title', 'Votre session a expiré'), text: t('admin.dashboard.session_expired_text', 'Reconnectez-vous pour continuer.') }
    case ADMIN_DASHBOARD_ERROR.FORBIDDEN:
      return { status: 'error' as const, title: t('admin.dashboard.forbidden_title', 'Accès refusé'), text: t('admin.dashboard.forbidden_text', 'Vous n’avez pas la permission de piloter cette édition.') }
    case ADMIN_DASHBOARD_ERROR.NOT_FOUND:
      return { status: 'error' as const, title: t('admin.dashboard.not_found_title', 'Édition introuvable'), text: t('admin.dashboard.not_found_text', 'Cette édition n’existe pas. Choisissez-en une autre dans le sélecteur.') }
    default:
      return null
  }
})
const genericError = computed(() => errorKind.value === ADMIN_DASHBOARD_ERROR.OTHER ? error.value : null)
const loginTarget = ROUTES.LOGIN
const loginLabel = computed(() => t('admin.dashboard.login', 'Se reconnecter'))
const archivedLabel = computed(() => t('admin.dashboard.archived', 'Édition clôturée. Rien à traiter : consultation en lecture seule.'))
const publicTarget = ROUTES.HOME
const publicLabel = computed(() => t('admin.dashboard.public_site', 'Voir le site public'))
const emptyTitle = { key: 'admin.dashboard.empty_title', fallback: 'Aucune édition en cours' }

/*********************************************************
 * Actions
 *
 * @description
 * « Réessayer » relance les trois lectures du tableau de bord, ou la seule lecture du flux d'activité.
 ********************************************************/
const handleRetry = () => {
  refresh()
}
const handleActivityRetry = () => {
  refreshActivity()
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
.dashboard {
  display: grid;
  gap: var(--origam-space---6);

  &__head {
    display: flex;
    flex-wrap: wrap;
    align-items: end;
    justify-content: space-between;
    gap: var(--origam-space---4);
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
    margin-block-start: var(--origam-space---2);
    font-size: var(--origam-font__size---4xl);
    line-height: 1;
  }

  &__badge {
    margin-inline-start: var(--dashboard__badge---margin-start, calc(var(--origam-space---1) + var(--origam-space---2)));
  }

  &__login {
    justify-self: start;
  }

  &__grid {
    display: grid;
    grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
    grid-template-areas:
      'steps todo'
      'steps log';
    gap: var(--origam-space---5);
    align-items: start;

    > * {
      min-width: 0;
    }
  }

  &__steps {
    grid-area: steps;
  }

  &__todo {
    grid-area: todo;
  }

  &__log {
    grid-area: log;
  }
}

@media (max-width: 1000px) {
  .dashboard__grid {
    grid-template-columns: minmax(0, 1fr);
    grid-template-areas:
      'todo'
      'steps'
      'log';
  }
}
</style>

<style>
:root {
  --dashboard__badge---margin-start: calc(var(--origam-space---1) + var(--origam-space---2));
}
</style>

<template>
  <origam-card
    tag="section"
    rounded="xl"
    border
    elevation="md"
    :aria-labelledby="titleId"
    class="qualification-prerequisites"
    data-cy="qualification-prerequisites"
  >
    <template #default>
      <header class="qualification-prerequisites__head">
        <h2
          :id="titleId"
          class="qualification-prerequisites__title"
        >
          {{ title }}
        </h2>
        <edition-chip
          :family="chipFamily"
          :text="countText"
          data-cy="qualification-prerequisites-count"
        />
      </header>
      <origam-progress
        :model-value="prerequisites.percent"
        color="primary"
        :bg-color="trackColor"
        :thickness="thickness"
        rounded="full"
        class="qualification-prerequisites__progress"
        :aria-label="progressLabel"
        data-cy="qualification-prerequisites-progress"
      />
      <p class="qualification-prerequisites__text">
        {{ text }}
      </p>
      <origam-btn
        v-if="hasPending"
        variant="text"
        size="small"
        class="qualification-prerequisites__link"
        :to="matchesRoute"
        :text="linkLabel"
        data-cy="qualification-matches-link"
      />
    </template>
  </origam-card>
</template>

<script setup lang="ts">
import { computed, useId } from 'vue'
import { OrigamBtn, OrigamCard, OrigamProgress } from 'origam/components'
import EditionChip from '~/components/edition/EditionChip.vue'
import { useT } from '~/composables/useT'
import { HOME_PROGRESS_THICKNESS, HOME_PROGRESS_TRACK_COLOR } from '~/consts/home.const'
import { ROUTES } from '~/consts/routes.const'
import { EDITION_CHIP_FAMILY } from '~/enums/edition-tab.enum'
import type { IQualificationPrerequisitesProps } from '~/interfaces/qualification-view.interface'

/*********************************************************
 * Global
 *
 * @description
 * « Poules à jour » : matchs de poule validés sur le total. Tant qu'il en reste, les actions de la page restent inactives et la raison est
 * écrite sous chaque bouton ; le lien mène à « Poules et matchs » (le serveur refuse de toute façon en 409).
 ********************************************************/
const { t } = useT()
const props = withDefaults(defineProps<IQualificationPrerequisitesProps>(), {})
const emits = defineEmits<{}>()
defineSlots<{}>()
const titleId = useId()
const thickness = HOME_PROGRESS_THICKNESS
const trackColor = HOME_PROGRESS_TRACK_COLOR
const matchesRoute = ROUTES.ADMIN_MATCHES
const hasPending = computed(() => props.prerequisites.pending > 0)
const chipFamily = computed(() => hasPending.value ? EDITION_CHIP_FAMILY.TINTED_WARNING : EDITION_CHIP_FAMILY.TINTED_SUCCESS)
const title = computed(() => t('admin.qualification.prerequisites_title', '1 · Poules à jour'))
const countText = computed(() => t('admin.qualification.prerequisites_count', '{validated} / {total}', { validated: props.prerequisites.validated, total: props.prerequisites.total }))
const progressLabel = computed(() => t('admin.qualification.prerequisites_progress', '{validated} matchs de poule validés sur {total}', { validated: props.prerequisites.validated, total: props.prerequisites.total }))
const text = computed(() => t('admin.qualification.prerequisites_text', 'Tant que tous les matchs de poule ne sont pas validés, les actions de cette page restent inactives (la raison est affichée sous chaque bouton).'))
const linkLabel = computed(() => props.prerequisites.pending === 1
  ? t('admin.qualification.prerequisites_link_one', 'Voir le match restant →')
  : t('admin.qualification.prerequisites_link', 'Voir les {pending} matchs restants →', { pending: props.prerequisites.pending }))

/*********************************************************
 * Expose
 *
 * @description
 * Rien à piloter depuis l'extérieur.
 ********************************************************/
defineExpose({})
</script>

<style scoped lang="scss">
.qualification-prerequisites {
  padding: var(--qualification-prerequisites---padding, var(--origam-space---6));

  @media (max-width: 760px) {
    padding: var(--origam-space---5);
  }

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--qualification-prerequisites---gap, var(--origam-space---3));
    margin-bottom: var(--origam-space---4);
  }

  &__title {
    margin: 0;
    font-size: var(--origam-font__size---xl);
    font-weight: var(--origam-font__weight---bold);
    line-height: var(--origam-font__lineHeight---tight);
  }

  &__progress {
    --origam-progress-linear__background---opacity: 1;
    margin-bottom: var(--origam-space---5);
  }

  &__link {
    --origam-btn---height: var(--origam-space---11);
    --origam-btn---padding-sm: var(--origam-space---4);
    --origam-btn---font-size: var(--origam-font__size---sm);
  }

  &__text {
    margin: 0;
    color: var(--origam-color__text---secondary);
  }
}
</style>

<style>
:root {
  --qualification-prerequisites---padding: var(--origam-space---6);
  --qualification-prerequisites---gap: var(--origam-space---3);
}
</style>

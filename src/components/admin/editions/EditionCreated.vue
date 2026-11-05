<template>
  <origam-card
    tag="section"
    class="edition-created"
    rounded="xl"
    border
    elevation="md"
    aria-live="polite"
    :aria-labelledby="titleId"
    data-cy="edition-created"
  >
    <span
      class="edition-created__code font-display neon--sm"
      aria-hidden="true"
    >{{ edition.code }}</span>
    <div class="edition-created__body">
      <p class="edition-created__eyebrow">
        {{ eyebrow }}
      </p>
      <origam-title
        :id="titleId"
        tag="h2"
        class="edition-created__title"
        :text="title"
        data-cy="edition-created-title"
      />
      <p class="edition-created__address">
        {{ addressLead }} <b data-cy="edition-created-address">{{ address }}</b>{{ addressTail }}
      </p>
    </div>
    <div class="edition-created__cta">
      <origam-btn
        variant="flat"
        bg-color="primary"
        elevation="lg"
        size="x-large"
        font-size="md"
        :to="participantsRoute"
        :text="participantsLabel"
        data-cy="edition-created-participants"
      />
      <origam-btn
        variant="outlined"
        size="x-large"
        font-size="md"
        :to="editRoute"
        :text="editLabel"
        data-cy="edition-created-edit"
      />
    </div>
  </origam-card>
</template>

<script setup lang="ts">
import { computed, useId } from 'vue'
import { OrigamBtn, OrigamCard, OrigamTitle } from 'origam/components'
import { useT } from '~/composables/useT'
import { ROUTES } from '~/consts/routes.const'
import type { IEditionCreatedProps } from '~/interfaces/admin-editions.interface'
import { buildAdminEditionLink } from '~/utils/admin-editions.util'

/*********************************************************
 * Global
 *
 * @description
 * Confirmation de création : le code attribué par le serveur (CE-1) et l'adresse publique, qui ne changeront plus (R-9).
 * Suite : ajouter les participants (l'édition créée est celle que l'admin retrouve dans le sélecteur), ou compléter ses informations.
 ********************************************************/
const { t } = useT()
const props = withDefaults(defineProps<IEditionCreatedProps>(), {})
const emits = defineEmits<{}>()
defineSlots<{}>()
const titleId = useId()
const eyebrow = computed(() => t('admin.editions.created_eyebrow', 'Édition créée'))
const title = computed(() => t('admin.editions.created_title', 'Code attribué : {code}', { code: props.edition.code }))
const address = computed(() => t('admin.editions.created_address', '/editions/{code}', { code: props.edition.code }))
const addressLead = computed(() => t('admin.editions.created_address_lead', 'Adresse publique :'))
const addressTail = computed(() => t('admin.editions.created_address_tail', '. Ce code ne pourra plus être modifié.'))
const participantsLabel = computed(() => t('admin.editions.created_participants', 'Ajouter les participants'))
const editLabel = computed(() => t('admin.editions.created_edit', 'Modifier les informations'))
const participantsRoute = ROUTES.ADMIN_PARTICIPANTS
const editRoute = computed(() => buildAdminEditionLink(props.edition.code))

/*********************************************************
 * Expose
 *
 * @description
 * Rien à piloter depuis l'extérieur.
 ********************************************************/
defineExpose({})
</script>

<style scoped lang="scss">
.edition-created {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--edition-created---gap, var(--origam-space---6));
  padding: var(--edition-created---padding, var(--origam-space---6));
  border-color: var(--origam-color__feedback--success---border);

  &__code {
    font-size: var(--origam-font__size---4xl);
    line-height: 1;
    color: var(--origam-color__bar---amber);
  }

  &__body {
    display: grid;
    gap: var(--origam-space---1);
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
    font-size: var(--origam-font__size---xl);
    font-weight: var(--origam-font__weight---bold);
    letter-spacing: normal;
    line-height: var(--origam-font__lineHeight---tight);
  }

  &__address {
    margin: 0;
    color: var(--origam-color__text---secondary);
  }

  &__cta {
    display: flex;
    flex-wrap: wrap;
    gap: var(--origam-space---3);
  }

  @media (max-width: 760px) {
    grid-template-columns: minmax(0, 1fr);
    gap: var(--origam-space---3);

    &__cta {
      display: grid;
    }
  }
}
</style>

<style>
:root {
  --edition-created---gap: var(--origam-space---6);
  --edition-created---padding: var(--origam-space---6);
}
</style>

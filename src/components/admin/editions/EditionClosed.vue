<template>
  <origam-card
    tag="section"
    class="edition-closed"
    rounded="xl"
    border
    elevation="md"
    :aria-labelledby="titleId"
    data-cy="edition-closed"
  >
    <header class="edition-closed__head">
      <div class="edition-closed__heading">
        <p class="edition-closed__eyebrow">
          {{ eyebrow }}
        </p>
        <origam-title
          :id="titleId"
          tag="h2"
          class="edition-closed__title"
          font-size="xl"
          font-weight="bold"
          line-height="tight"
          letter-spacing="normal"
          :text="title"
        />
      </div>
      <edition-chip
        :text="statusText"
        :family="statusFamily"
        data-cy="edition-closed-status"
      />
    </header>
    <origam-alert
      status="info"
      density="compact"
      rounded="lg"
      font-size="md"
      font-weight="bold"
      letter-spacing="normal"
      line-height="normal"
      :title="noticeTitle"
      :text="noticeText"
      data-cy="edition-closed-notice"
    />
    <edition-readonly-fields
      :edition="edition"
      :fields="fields"
    />
    <origam-alert
      v-if="failure"
      status="error"
      rounded="lg"
      font-size="md"
      font-weight="bold"
      letter-spacing="normal"
      line-height="normal"
      :title="failureTitle"
      :text="failureText"
      data-cy="edition-closed-error"
    />
  </origam-card>
</template>

<script setup lang="ts">
import { computed, useId } from 'vue'
import { OrigamAlert, OrigamCard, OrigamTitle } from 'origam/components'
import EditionReadonlyFields from '~/components/admin/editions/EditionReadonlyFields.vue'
import EditionChip from '~/components/edition/EditionChip.vue'
import { useT } from '~/composables/useT'
import { EDITION_READONLY_CLOSED_FIELDS } from '~/consts/admin-editions.const'
import { EDITION_HERO_STATUS } from '~/consts/edition-view.const'
import { EDITION_STATUS } from '~/enums/edition.enum'
import type { IEditionClosedProps } from '~/interfaces/admin-editions.interface'

/*********************************************************
 * Global
 *
 * @description
 * Fiche d'une édition clôturée : lecture seule (le serveur répond 409 `EDITION_CLOSED` à toute écriture). Elle remplace le
 * formulaire. L'alerte d'erreur n'apparaît que si l'édition a été clôturée pendant une modification : le 409 est alors traduit.
 ********************************************************/
const { t } = useT()
const props = withDefaults(defineProps<IEditionClosedProps>(), { failure: null })
const emits = defineEmits<{}>()
defineSlots<{}>()
const titleId = useId()
const fields = EDITION_READONLY_CLOSED_FIELDS
const status = EDITION_HERO_STATUS[EDITION_STATUS.CLOSED]
const statusFamily = status.family
const statusText = computed(() => t(status.label.key, status.label.fallback))
const eyebrow = computed(() => t('admin.editions.closed_eyebrow', 'Édition {code}', { code: props.edition.code }))
const title = computed(() => t('admin.editions.closed_title', 'Édition clôturée · lecture seule'))
const noticeTitle = computed(() => t('admin.editions.closed_notice_title', 'Édition clôturée'))
const noticeText = computed(() => t('admin.editions.closed_notice_text', 'Ses résultats et ses points sont figés : elle ne se modifie plus.'))
const failureTitle = computed(() => props.failure ? t(props.failure.title.key, props.failure.title.fallback, props.failure.title.params) : '')
const failureText = computed(() => props.failure ? t(props.failure.text.key, props.failure.text.fallback, props.failure.text.params) : '')

/*********************************************************
 * Expose
 *
 * @description
 * Rien à piloter depuis l'extérieur.
 ********************************************************/
defineExpose({})
</script>

<style scoped lang="scss">
.edition-closed {
  display: grid;
  gap: var(--edition-closed---gap, var(--origam-space---5));
  padding: var(--edition-closed---padding, var(--origam-space---6));
  border-style: dashed;

  &__head {
    display: flex;
    flex-wrap: wrap;
    align-items: start;
    justify-content: space-between;
    gap: var(--origam-space---3);
  }

  &__heading {
    display: grid;
    gap: 0;
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
}
</style>

<style>
:root {
  --edition-closed---gap: var(--origam-space---5);
  --edition-closed---padding: var(--origam-space---6);
}
</style>

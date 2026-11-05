<template>
  <div class="admin-editions">
    <reference-head :title="title" />
    <editions-toolbar v-model:query="query" />
    <async-state
      :pending="pending"
      :error="failure"
      :empty="isEmpty"
      :empty-title="emptyTitle"
      @retry="refresh"
    >
      <editions-table :editions="editions" />
      <p
        v-if="hasNoMatch"
        class="admin-editions__none"
        data-cy="editions-no-match"
      >
        {{ noMatchText }}
      </p>
      <p
        class="admin-editions__note"
        data-cy="editions-note"
      >
        {{ note }}
      </p>
    </async-state>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ReferenceHead from '~/components/admin/ReferenceHead.vue'
import EditionsTable from '~/components/admin/editions/EditionsTable.vue'
import EditionsToolbar from '~/components/admin/editions/EditionsToolbar.vue'
import AsyncState from '~/components/common/AsyncState.vue'
import { useAdminEditions } from '~/composables/useAdminEditions'
import { useT } from '~/composables/useT'

/*********************************************************
 * Page
 *
 * @description
 * Liste des éditions de l'admin (F-13) : recherche par code ou année, « Créer une édition », et l'accès à chaque fiche.
 ********************************************************/
definePageMeta({ layout: 'admin', middleware: 'admin' })
const { t } = useT()
const props = withDefaults(defineProps<{}>(), {})
const emits = defineEmits<{}>()
defineSlots<{}>()
const { editions, query, pending, failure, isEmpty, hasNoMatch, refresh } = useAdminEditions()
const title = computed(() => t('pages.admin_editions.title', 'Éditions'))
useHead({ title })
const emptyTitle = computed(() => ({ key: 'admin.editions.empty', fallback: 'Aucune édition pour le moment' }))
const noMatchText = computed(() => t('admin.editions.no_match', 'Aucune édition ne correspond à cette recherche.'))
const note = computed(() => t('admin.editions.archive_note', 'Les éditions de l’archive (2012a à 2025) ont été importées : nom, date et lieu n’y sont pas renseignés. Le code d’une édition ne change jamais, c’est son adresse publique (/editions/2012a).'))

/*********************************************************
 * Expose
 *
 * @description
 * Une page n'expose rien à un parent.
 ********************************************************/
defineExpose({})
</script>

<style scoped lang="scss">
.admin-editions {
  display: grid;
  gap: var(--admin-editions---gap, var(--origam-space---5));
  padding-block: var(--admin-editions---padding-block, var(--origam-space---12) var(--origam-space---10));

  &__none,
  &__note {
    margin: 0;
    font-size: var(--origam-font__size---sm);
    color: var(--origam-color__text---tertiary);
  }

  &__note {
    max-width: 60rem;
  }
}
</style>

<style>
:root {
  --admin-editions---gap: var(--origam-space---5);
  --admin-editions---padding-block: var(--origam-space---12) var(--origam-space---10);
}
</style>

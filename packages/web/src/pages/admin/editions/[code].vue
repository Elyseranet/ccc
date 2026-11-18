<template>
  <div class="admin-edition">
    <reference-head :title="title" />
    <async-state
      :pending="loading"
      :error="loadFailure"
      @retry="refresh"
    >
      <template v-if="edition">
        <div class="admin-edition__tools">
          <origam-btn
            variant="outlined"
            :href="exportUrl"
            download
            :text="exportLabel"
            data-cy="edition-export"
          />
        </div>
        <edition-closed
          v-if="isClosed"
          :edition="edition"
          :failure="failure"
        />
        <edition-form
          v-else
          :mode="mode"
          :values="values"
          :edition="edition"
          :pending="saving"
          :failure="failure"
          :saved="saved"
          @submit="handleSubmit"
        />
        <edition-delete-zone
          v-if="canDelete"
          :edition="edition"
          :busy="deleting"
          :failure="deleteFailure"
          @confirm="handleDelete"
        />
      </template>
    </async-state>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { OrigamBtn } from 'origam/components'
import EditionClosed from '~/components/admin/editions/EditionClosed.vue'
import EditionDeleteZone from '~/components/admin/editions/EditionDeleteZone.vue'
import EditionForm from '~/components/admin/editions/EditionForm.vue'
import ReferenceHead from '~/components/admin/ReferenceHead.vue'
import AsyncState from '~/components/common/AsyncState.vue'
import { useEditionDelete } from '~/composables/useEditionDelete'
import { useEditionEdit } from '~/composables/useEditionEdit'
import { useT } from '~/composables/useT'
import { EDITION_FORM_MODE } from '~/enums/admin-editions.enum'
import { EDITION_ORIGIN } from '~/enums/edition.enum'
import type { IEditionFormValues } from '~/interfaces/admin-editions.interface'
import { emptyEditionFormValues, toEditionFormValues } from '~/utils/admin-editions.util'
import { useSeo } from '~/composables/useSeo'

/*********************************************************
 * Page
 *
 * @description
 * Fiche d'une édition (F-13), adressée par son code : modification du nom, de la date, du lieu et de la description
 * (R-9), ou lecture seule quand l'édition est clôturée ; zone « danger » de suppression pour une édition créée dans l'appli (F-60).
 ********************************************************/
definePageMeta({ layout: 'admin', middleware: 'admin' })
const { t } = useT()
const props = withDefaults(defineProps<{}>(), {})
const emits = defineEmits<{}>()
defineSlots<{}>()
const route = useRoute()
const code = computed(() => String(route.params.code ?? ''))
const { edition, loading, loadFailure, isClosed, update, saving, saved, failure, refresh, exportUrl } = useEditionEdit(code)
const { remove, deleting, failure: deleteFailure } = useEditionDelete()
// Une archive importée n'est jamais supprimable (B-28) : la zone n'existe pas pour elle, le serveur refuse aussi.
const canDelete = computed(() => edition.value?.origin === EDITION_ORIGIN.APP)
const title = computed(() => t('pages.admin_edition.title', 'Édition {code}', { code: code.value }))
const exportLabel = computed(() => t('admin.editions.export_button', 'Exporter (Excel)'))
useHead({ title })
useSeo({ noindex: true })
const mode = EDITION_FORM_MODE.EDIT
const values = computed(() => edition.value ? toEditionFormValues(edition.value) : emptyEditionFormValues())

/*********************************************************
 * Actions
 *
 * @description
 * Le formulaire n'émet que des valeurs déjà validées ; le composable les envoie.
 ********************************************************/
const handleSubmit = (submitted: IEditionFormValues) => {
  update(submitted)
}

const handleDelete = () => {
  if (edition.value) {
    remove(edition.value)
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
.admin-edition {
  display: grid;
  gap: var(--admin-edition---gap, var(--origam-space---5));
  padding-block: var(--admin-edition---padding-block, var(--origam-space---12) var(--origam-space---10));

  &__tools {
    display: flex;
    justify-content: flex-end;
  }
}
</style>

<style>
:root {
  --admin-edition---gap: var(--origam-space---5);
  --admin-edition---padding-block: var(--origam-space---12) var(--origam-space---10);
}
</style>

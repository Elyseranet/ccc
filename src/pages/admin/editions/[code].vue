<template>
  <div class="admin-edition">
    <reference-head :title="title" />
    <async-state
      :pending="loading"
      :error="loadFailure"
      @retry="refresh"
    >
      <template v-if="edition">
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
      </template>
    </async-state>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import EditionClosed from '~/components/admin/editions/EditionClosed.vue'
import EditionForm from '~/components/admin/editions/EditionForm.vue'
import ReferenceHead from '~/components/admin/ReferenceHead.vue'
import AsyncState from '~/components/common/AsyncState.vue'
import { useEditionEdit } from '~/composables/useEditionEdit'
import { useT } from '~/composables/useT'
import { EDITION_FORM_MODE } from '~/enums/admin-editions.enum'
import type { IEditionFormValues } from '~/interfaces/admin-editions.interface'
import { emptyEditionFormValues, toEditionFormValues } from '~/utils/admin-editions.util'

/*********************************************************
 * Page
 *
 * @description
 * Fiche d'une édition (F-13), adressée par son code : modification du nom, de la date, du lieu et de la description
 * (R-9), ou lecture seule quand l'édition est clôturée.
 ********************************************************/
definePageMeta({ layout: 'admin', middleware: 'admin' })
const { t } = useT()
const props = withDefaults(defineProps<{}>(), {})
const emits = defineEmits<{}>()
defineSlots<{}>()
const route = useRoute()
const code = computed(() => String(route.params.code ?? ''))
const { edition, loading, loadFailure, isClosed, update, saving, saved, failure, refresh } = useEditionEdit(code)
const title = computed(() => t('pages.admin_edition.title', 'Édition {code}', { code: code.value }))
useHead({ title })
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
}
</style>

<style>
:root {
  --admin-edition---gap: var(--origam-space---5);
  --admin-edition---padding-block: var(--origam-space---12) var(--origam-space---10);
}
</style>

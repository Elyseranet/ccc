<template>
  <div class="admin-edition-new">
    <reference-head :title="title" />
    <edition-created
      v-if="created"
      :edition="created"
    />
    <edition-form
      v-else
      :mode="mode"
      :values="values"
      :pending="pending"
      :failure="failure"
      @submit="handleSubmit"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import EditionCreated from '~/components/admin/editions/EditionCreated.vue'
import EditionForm from '~/components/admin/editions/EditionForm.vue'
import ReferenceHead from '~/components/admin/ReferenceHead.vue'
import { useEditionCreate } from '~/composables/useEditionCreate'
import { useT } from '~/composables/useT'
import { EDITION_FORM_MODE } from '~/enums/admin-editions.enum'
import type { IEditionFormValues } from '~/interfaces/admin-editions.interface'
import { emptyEditionFormValues } from '~/utils/admin-editions.util'
import { useSeo } from '~/composables/useSeo'

/*********************************************************
 * Page
 *
 * @description
 * Création d'une édition (F-13) : année, nom, date, lieu, description. Le code est généré par le serveur (CE-1) et
 * affiché dans la confirmation qui remplace le formulaire.
 ********************************************************/
definePageMeta({ layout: 'admin', middleware: 'admin' })
const { t } = useT()
const props = withDefaults(defineProps<{}>(), {})
const emits = defineEmits<{}>()
defineSlots<{}>()
const { create, pending, failure, created } = useEditionCreate()
const title = computed(() => t('pages.admin_edition_new.title', 'Nouvelle édition'))
useHead({ title })
useSeo({ noindex: true })
const mode = EDITION_FORM_MODE.CREATE
const values = emptyEditionFormValues()

/*********************************************************
 * Actions
 *
 * @description
 * Le formulaire n'émet que des valeurs déjà validées ; le composable les envoie.
 ********************************************************/
const handleSubmit = (submitted: IEditionFormValues) => {
  create(submitted)
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
.admin-edition-new {
  display: grid;
  gap: var(--admin-edition-new---gap, var(--origam-space---5));
  padding-block: var(--admin-edition-new---padding-block, var(--origam-space---12) var(--origam-space---10));
}
</style>

<style>
:root {
  --admin-edition-new---gap: var(--origam-space---5);
  --admin-edition-new---padding-block: var(--origam-space---12) var(--origam-space---10);
}
</style>

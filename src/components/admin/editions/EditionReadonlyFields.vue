<template>
  <origam-data-list
    mode="kv"
    density="compact"
    rounded="lg"
    class="edition-readonly"
    :items="items"
    data-cy="edition-readonly"
  >
    <template #value="{ item }">
      <edition-readonly-value :row="rowOf(item.id)" />
    </template>
  </origam-data-list>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { OrigamDataList } from 'origam/components'
import EditionReadonlyValue from '~/components/admin/editions/EditionReadonlyValue.vue'
import { useT } from '~/composables/useT'
import { EDITION_READONLY_LABELS } from '~/consts/admin-editions.const'
import { EDITION_HERO_STATUS } from '~/consts/edition-view.const'
import { EDITION_READONLY_FIELD } from '~/enums/admin-editions.enum'
import type { IEditionReadonlyFieldsProps, IEditionReadonlyRow } from '~/interfaces/admin-editions.interface'
import { formatEditionDate } from '~/utils/admin-editions.util'

/*********************************************************
 * Global
 *
 * @description
 * Champs de l'édition en lecture seule, dans `origam-data-list` : code, année et statut en modification (R-9), tous les
 * champs d'une édition clôturée. Une valeur absente est annoncée « Non renseigné » (les éditions de l'archive n'ont ni nom,
 * ni date, ni lieu). Le N d'une édition non close n'est pas connu : « — ».
 ********************************************************/
const { t } = useT()
const props = withDefaults(defineProps<IEditionReadonlyFieldsProps>(), {})
const emits = defineEmits<{}>()
defineSlots<{}>()
const missingText = computed(() => t('admin.editions.not_provided', 'Non renseigné'))
const noValueText = computed(() => t('admin.editions.no_value', '—'))

/*********************************************************
 * Lignes
 *
 * @description
 * Une ligne par champ demandé, dans l'ordre demandé : libellé, texte, précision et pastille de statut.
 ********************************************************/
const valueOf = (field: EDITION_READONLY_FIELD): { text: string, missing: boolean } => {
  const { edition } = props
  switch (field) {
    case EDITION_READONLY_FIELD.CODE:
      return { text: edition.code, missing: false }
    case EDITION_READONLY_FIELD.YEAR:
      return { text: String(edition.year), missing: false }
    case EDITION_READONLY_FIELD.STATUS: {
      const status = EDITION_HERO_STATUS[edition.status].label
      return { text: t(status.key, status.fallback), missing: false }
    }
    case EDITION_READONLY_FIELD.NAME:
      return { text: edition.name ?? missingText.value, missing: !edition.name }
    case EDITION_READONLY_FIELD.DATE: {
      const date = formatEditionDate(edition.heldOn)
      return { text: date ?? missingText.value, missing: !date }
    }
    case EDITION_READONLY_FIELD.LOCATION:
      return { text: edition.location ?? missingText.value, missing: !edition.location }
    default:
      return edition.participantCount === null
        ? { text: noValueText.value, missing: true }
        : { text: String(edition.participantCount), missing: false }
  }
}
const rows = computed<IEditionReadonlyRow[]>(() => props.fields.map((field) => {
  const labels = EDITION_READONLY_LABELS[field]
  return {
    id: field,
    label: t(labels.label.key, labels.label.fallback),
    hint: labels.hint ? t(labels.hint.key, labels.hint.fallback) : null,
    chip: field === EDITION_READONLY_FIELD.STATUS ? EDITION_HERO_STATUS[props.edition.status].family : null,
    ...valueOf(field)
  }
}))
const items = computed(() => rows.value.map(row => ({ id: row.id, key: row.label, value: row.text })))
const rowOf = (id: string | number | undefined): IEditionReadonlyRow => rows.value.find(row => row.id === id) ?? rows.value[0]!

/*********************************************************
 * Expose
 *
 * @description
 * Rien à piloter depuis l'extérieur.
 ********************************************************/
defineExpose({})
</script>

<style scoped lang="scss">
.edition-readonly {
  padding: var(--edition-readonly---padding, var(--origam-space---2));
}
</style>

<style>
:root {
  --edition-readonly---padding: var(--origam-space---2);
}
</style>

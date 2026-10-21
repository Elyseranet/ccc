<template>
  <origam-select
    v-model="adminEdition.editionId"
    :items="editionOptions"
    :label="label"
    single-line
    hide-details
    variant="solo"
    rounded="full"
    :menu-icon="CaretDown"
    class="admin-edition-select"
  />
</template>

<script setup lang="ts">
import { OrigamSelect } from 'origam/components'
import CaretDown from '~/components/icons/CaretDown.vue'
import { useAdminEdition } from '~/composables/useAdminEdition'
import type { IAdminEditionSelectProps } from '~/interfaces/admin-edition-select.interface'

/*********************************************************
 * Global
 *
 * @description
 * Sélecteur de l'édition active de l'admin, branché sur le store `admin-edition` : la coque (barre haute) et la page
 * « Plus » l'utilisent, donc changer d'édition à un endroit la change partout.
 * Le nom accessible vient de la prop `label` (texte déjà traduit par le parent), passée à `origam-select` : sans elle, Origam nomme
 * le champ « Ouvrir » (aria-label et title de l'input), défaut suivi dans Elyseranet/origam#1251. Avec `single-line`, le libellé ne s'affiche pas dans le champ.
 * La hauteur du champ se règle par `--admin-edition-select---height`, le décalage vertical du texte (compensation de la bordure) par
 * `--admin-edition-select---text-shift`.
 ********************************************************/
const props = withDefaults(defineProps<IAdminEditionSelectProps>(), {
  label: undefined
})
const emits = defineEmits<{}>()
defineSlots<{}>()
const { store: adminEdition, options: editionOptions } = await useAdminEdition()

/*********************************************************
 * Expose
 *
 * @description
 * Rien à piloter depuis l'extérieur.
 ********************************************************/
defineExpose({})
</script>

<style scoped lang="scss">
.admin-edition-select {
  :deep(.origam-field) {
    --origam-input__control---height: var(--admin-edition-select---height, var(--origam-space---11));
    --origam-field---corner-clearance: var(--origam-space---5);
    --origam-field---padding-start: calc(var(--origam-space---5) + var(--origam-border__width---thin));
    --origam-field---padding-end: 0;
    --origam-field---letter-spacing: normal;
    --origam-field__input---opacity: 1;
    --origam-field---append-inner-icon-opacity: 1;
    --origam-field__input---padding-top: calc((var(--origam-input__control---height) - 1.5rem) / 2 - var(--admin-edition-select---text-shift));
    --origam-field__input---padding-bottom: calc((var(--origam-input__control---height) - 1.5rem) / 2 + var(--admin-edition-select---text-shift));

    background: var(--origam-color__surface---sunken);
    color: var(--origam-color__text---primary);
  }

  :deep(.origam-field__append-inner) {
    padding-inline: 0 var(--origam-space---3);
  }

  :deep(.origam-select__selection-text) {
    letter-spacing: normal;
  }
}
</style>

<style>
:root {
  --admin-edition-select---height: var(--origam-space---11);
  --admin-edition-select---text-shift: var(--origam-border__width---thin);
}
</style>

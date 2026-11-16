<template>
  <template
    v-for="part in parts"
    :key="part.id"
  >
    <span
      v-if="part.marker"
      class="legal-text__marker"
      data-cy="legal-marker"
    >{{ part.text }}</span>
    <template v-else>
      {{ part.text }}
    </template>
  </template>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ILegalTextProps, ILegalTextPart } from '~/interfaces/legal.interface'
import { splitLegalMarkers } from '~/utils/legal-text.util'

/*********************************************************
 * Global
 *
 * @description
 * Texte légal dont les informations manquantes sont des marqueurs `[À FOURNIR : …]`. Chaque marqueur est rendu en
 * clair et mis en évidence (monospace, fond d'avertissement) : il ne peut pas passer en production par oubli, et un
 * test peut le compter dans le rendu.
 ********************************************************/
const props = withDefaults(defineProps<ILegalTextProps>(), {})
const emits = defineEmits<{}>()
defineSlots<{}>()

/*********************************************************
 * Segments
 *
 * @description
 * La clé d'un segment est son rang : le texte ne change qu'avec la langue, jamais en cours d'affichage.
 ********************************************************/
const parts = computed(() => splitLegalMarkers(props.text).map((part: ILegalTextPart, index: number) => ({ ...part, id: index })))

/*********************************************************
 * Expose
 *
 * @description
 * Rien à piloter depuis l'extérieur.
 ********************************************************/
defineExpose({})
</script>

<style scoped lang="scss">
.legal-text__marker {
  padding-inline: var(--legal-text__marker---padding-inline, var(--origam-space---1));
  border: var(--origam-border__width---thin) dashed var(--origam-color__feedback--warning---border);
  border-radius: var(--origam-radius---sm);
  background: var(--origam-color__feedback--warning---bgSubtle);
  color: var(--origam-color__feedback--warning---fgSubtle);
  font-family: var(--origam-font__family---mono);
  font-size: var(--origam-font__size---sm);
  overflow-wrap: anywhere;
}
</style>

<style>
:root {
  --legal-text__marker---padding-inline: var(--origam-space---1);
}
</style>

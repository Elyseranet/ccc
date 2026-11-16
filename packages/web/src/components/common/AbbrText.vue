<template>
  <template
    v-for="(segment, index) in segments"
    :key="index"
  >
    <abbr
      v-if="segment.title"
      :title="segment.title"
    >{{ segment.text }}</abbr>
    <template v-else>{{ segment.text }}</template>
  </template>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useT } from '~/composables/useT'
import { ABBREVIATION_KIND } from '~/enums/abbreviation.enum'
import type { IAbbrTextProps } from '~/interfaces/abbreviation.interface'
import { splitAbbreviations } from '~/utils/abbreviation.util'

/*********************************************************
 * Global
 *
 * @description
 * Texte courant dont les abréviations (« ACP », codes de règle « RG19 ») sont enveloppées dans `<abbr title>` : le sens est donné à
 * chaque occurrence (RGAA 9.4). Les définitions viennent de la Spec fonctionnelle (ACP : Association de Cap'seurs Professionnels ;
 * RG : règle de gestion), jamais d'un texte inventé. `abbr` ne se souligne pas (`main.css`) : aucun changement de rendu.
 ********************************************************/
const { t } = useT()
const props = withDefaults(defineProps<IAbbrTextProps>(), {})
const emits = defineEmits<{}>()
defineSlots<{}>()
const segments = computed(() => splitAbbreviations(props.text).map(segment => ({
  text: segment.text,
  title: segment.kind === ABBREVIATION_KIND.ACP
    ? t('abbr.acp', 'Association de Cap’seurs Professionnels')
    : segment.kind === ABBREVIATION_KIND.RULE
      ? t('abbr.rule', 'Règle de gestion {number}', { number: segment.number ?? 0 })
      : ''
})))

/*********************************************************
 * Expose
 *
 * @description
 * Rien à piloter depuis l'extérieur.
 ********************************************************/
defineExpose({})
</script>

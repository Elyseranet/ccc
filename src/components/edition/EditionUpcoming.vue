<template>
  <section
    class="edition-upcoming"
    :aria-labelledby="titleId"
    :data-cy="dataCy"
  >
    <h2
      :id="titleId"
      class="sr-only"
    >
      {{ heading }}
    </h2>
    <async-state
      empty
      :empty-title="emptyTitle"
      :empty-description="emptyDescription"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, useId } from 'vue'
import AsyncState from '~/components/common/AsyncState.vue'
import { useT } from '~/composables/useT'
import type { ITranslatableText } from '~/interfaces/common-components.interface'
import type { IEditionUpcomingProps } from '~/interfaces/edition-view.interface'

/*********************************************************
 * Global
 *
 * @description
 * Onglet dont le contenu arrive avec F-03b (Poules, Bracket, Matchs) : un état « à venir » traduit, sans donnée fictive.
 ********************************************************/
const { t } = useT()
const props = withDefaults(defineProps<IEditionUpcomingProps>(), {})
const emits = defineEmits<{}>()
defineSlots<{}>()
const titleId = useId()
const heading = computed(() => t(props.heading.key, props.heading.fallback))
const emptyTitle: ITranslatableText = { key: 'edition.upcoming_title', fallback: 'Bientôt disponible' }
const emptyDescription: ITranslatableText = { key: 'edition.upcoming_text', fallback: 'Cet onglet arrive prochainement.' }

/*********************************************************
 * Expose
 *
 * @description
 * Rien à piloter depuis l'extérieur.
 ********************************************************/
defineExpose({})
</script>

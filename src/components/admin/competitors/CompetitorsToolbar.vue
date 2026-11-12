<template>
  <div class="competitors-toolbar">
    <origam-form
      class="competitors-toolbar__search"
      role="search"
      :aria-label="searchLabel"
      @submit.prevent
    >
      <origam-label
        :for="searchId"
        class="competitors-toolbar__label"
        :text="searchLabel"
      />
      <origam-text-field
        :id="searchId"
        type="search"
        single-line
        rounded="full"
        clearable
        hide-details="auto"
        autocomplete="off"
        :placeholder="searchPlaceholder"
        :model-value="query"
        data-cy="competitors-search"
        @update:model-value="handleQuery"
      />
    </origam-form>
    <p
      class="competitors-toolbar__count"
      aria-live="polite"
      data-cy="competitors-count"
    >
      {{ countText }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, useId } from 'vue'
import { OrigamForm, OrigamLabel, OrigamTextField } from 'origam/components'
import { useT } from '~/composables/useT'
import type { ICompetitorsToolbarEmits, ICompetitorsToolbarProps } from '~/interfaces/admin-competitors.interface'

/*********************************************************
 * Global
 *
 * @description
 * Barre d'outils de l'annuaire : recherche par nom, prénom ou pseudo (deux caractères au moins), et nombre de compétiteurs.
 * Le décompte est annoncé aux lecteurs d'écran quand la recherche le change. Le parent possède l'état (l'URL).
 ********************************************************/
const { t } = useT()
const props = withDefaults(defineProps<ICompetitorsToolbarProps>(), {})
const emits = defineEmits<ICompetitorsToolbarEmits>()
defineSlots<{}>()
const searchId = useId()
const searchLabel = computed(() => t('admin.competitors.search_label', 'Rechercher un compétiteur'))
const searchPlaceholder = computed(() => t('admin.competitors.search_placeholder', 'Nom, prénom ou pseudo'))
const countText = computed(() => props.total === 1
  ? t('admin.competitors.count_one', '1 compétiteur')
  : t('admin.competitors.count_other', '{count} compétiteurs', { count: props.total }))

/*********************************************************
 * Actions
 *
 * @description
 * Le champ relaie sa valeur ; vidé, il envoie une chaîne vide.
 ********************************************************/
const handleQuery = (value: string | null) => {
  emits('update:query', value ?? '')
}

/*********************************************************
 * Expose
 *
 * @description
 * Rien à piloter depuis l'extérieur.
 ********************************************************/
defineExpose({})
</script>

<style scoped lang="scss">
.competitors-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  justify-content: space-between;
  gap: var(--competitors-toolbar---gap, var(--origam-space---4));

  &__search {
    min-width: min(100%, 22rem);
  }

  // Le label d'Origam est en ligne : sa boîte prendrait la hauteur de ligne du parent (24,8 px au lieu de 19,84).
  &__label {
    display: block;
    margin-block-end: var(--origam-space---1);
    font-size: var(--origam-font__size---xs);
    font-weight: var(--origam-font__weight---bold);
    letter-spacing: var(--origam-font__letterSpacing---wide);
    text-transform: uppercase;
    color: var(--origam-color__text---tertiary);
  }

  &__count {
    margin: 0;
    font-variant-numeric: tabular-nums;
    color: var(--competitors-toolbar__count---color, var(--origam-color__text---secondary));
  }
}
</style>

<style>
:root {
  --competitors-toolbar---gap: var(--origam-space---4);
  --competitors-toolbar__count---color: var(--origam-color__text---secondary);
}
</style>

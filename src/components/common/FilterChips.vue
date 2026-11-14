<template>
  <origam-chip-group
    :model-value="modelValue"
    mandatory
    filter
    :aria-label="label"
    class="filter-chips"
    @update:model-value="handleUpdate"
  >
    <origam-chip
      v-for="view in views"
      :key="view.value"
      :value="view.value"
      size="large"
      border
      :border-color="view.borderColor"
      pill
      filter-icon=""
      :color="view.color"
      :bg-color="view.bgColor"
      :aria-pressed="view.selected"
      :data-cy="view.dataCy"
    >
      <template #filter />
      <template #default>
        <span class="filter-chips__label">
          {{ view.label }}
          <span
            class="filter-chips__count"
            :class="{ 'filter-chips__count--selected': view.selected }"
          >{{ view.count }}</span>
        </span>
      </template>
    </origam-chip>
  </origam-chip-group>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { OrigamChip, OrigamChipGroup } from 'origam/components'
import type { IFilterChipsEmits, IFilterChipsProps, IFilterChipsSlots } from '~/interfaces/filter-chips.interface'

/*********************************************************
 * Global
 *
 * @description
 * Groupe de puces de filtre : une seule puce active (`mandatory`), l'état est porté par le parent (`modelValue`, `update:modelValue`). La valeur est une chaîne : le parent
 * retrouve l'entrée de ses propres filtres (typée) à partir de la valeur émise.
 * La puce active prend la couleur secondaire et un filet transparent, les autres le texte secondaire et le filet par défaut (maquette `.fchip`) ;
 * le compteur porte aussi le sens (jamais la couleur seule) et `aria-pressed` dit l'état aux lecteurs d'écran.
 * Retour à la ligne : `origam-chip-group` repose sur `origam-slide-group`, un conteneur qui défile sur une seule ligne (`flex-wrap` sans variable, contenu
 * `white-space: nowrap`) ; sa prop `column` ne fait qu'ajouter une classe qu'aucune règle ne lit. D'où les `:deep` ci-dessous (Elyseranet/origam#1284,
 * fiche `docs/tickets/origam/chip-group-retour-a-la-ligne-evolution.md`). Seule définition de cette recette (F-20).
 ********************************************************/
const props = defineProps<IFilterChipsProps>()
const emits = defineEmits<IFilterChipsEmits>()
defineSlots<IFilterChipsSlots>()
const views = computed(() => props.items.map((item) => {
  const selected = item.value === props.modelValue
  return {
    ...item,
    selected,
    color: selected ? 'secondary' : 'var(--origam-color__text---secondary)',
    bgColor: selected ? 'secondary' : 'transparent',
    borderColor: selected ? 'transparent' : 'var(--origam-color__border---default)'
  }
}))
const handleUpdate = (value: string) => {
  emits('update:modelValue', value)
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
.filter-chips {
  --origam-chip---height-lg: var(--filter-chips---height, calc(var(--origam-space---11) - 2 * var(--origam-border__width---thin)));
  --origam-chip---padding-lg: var(--filter-chips---padding, var(--origam-space---4));
  --origam-chip---font-size-lg: var(--filter-chips---font-size, var(--origam-font__size---md));

  overflow: visible;

  :deep(.origam-slide-group__container),
  :deep(.origam-slide-group__content) {
    flex-wrap: wrap;
    overflow: visible;
    contain: none;
  }

  :deep(.origam-slide-group__content) {
    flex: 1 1 auto;
    min-width: 0;
    gap: var(--origam-space---2);
  }

  &__label {
    display: inline-flex;
    align-items: center;
    gap: var(--origam-space---2);
    line-height: var(--origam-font__lineHeight---normal);
  }

  &__count {
    padding-inline: var(--origam-space---2);
    border-radius: var(--origam-radius---full);
    background: var(--origam-color__surface---overlay);
    font-size: var(--origam-font__size---xs);
    line-height: var(--origam-font__lineHeight---normal);
    font-variant-numeric: tabular-nums;

    &--selected {
      background: var(--origam-color__surface---default);
      color: var(--origam-color__text---primary);
    }
  }
}
</style>

<style>
:root {
  --filter-chips---height: calc(var(--origam-space---11) - 2 * var(--origam-border__width---thin));
  --filter-chips---padding: var(--origam-space---4);
  --filter-chips---font-size: var(--origam-font__size---md);
}
</style>

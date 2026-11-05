<template>
  <div class="editions-toolbar">
    <origam-form
      class="editions-toolbar__search"
      role="search"
      :aria-label="searchLabel"
      @submit.prevent
    >
      <origam-text-field
        type="search"
        rounded="full"
        clearable
        hide-details
        autocomplete="off"
        :label="searchLabel"
        :placeholder="searchPlaceholder"
        :model-value="query"
        data-cy="editions-search"
        @update:model-value="handleQuery"
      />
    </origam-form>
    <origam-btn
      variant="flat"
      bg-color="primary"
      elevation="lg"
      size="x-large"
      font-size="md"
      :hover="ctaHover"
      :to="createRoute"
      :text="createLabel"
      data-cy="editions-create"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { OrigamBtn, OrigamForm, OrigamTextField } from 'origam/components'
import { useT } from '~/composables/useT'
import { ADMIN_EDITIONS_CTA_HOVER } from '~/consts/admin-editions.const'
import { ROUTES } from '~/consts/routes.const'
import type { IEditionsToolbarEmits, IEditionsToolbarProps } from '~/interfaces/admin-editions.interface'

/*********************************************************
 * Global
 *
 * @description
 * Barre d'outils de la liste : recherche par code ou année, et « Créer une édition ». La recherche filtre au fil de la saisie,
 * sans envoi ; le parent possède l'état.
 ********************************************************/
const { t } = useT()
const props = withDefaults(defineProps<IEditionsToolbarProps>(), {})
const emits = defineEmits<IEditionsToolbarEmits>()
defineSlots<{}>()
const searchLabel = computed(() => t('admin.editions.search_label', 'Rechercher une édition'))
const searchPlaceholder = computed(() => t('admin.editions.search_placeholder', 'Code ou année'))
const createLabel = computed(() => t('admin.editions.create', 'Créer une édition'))
const createRoute = ROUTES.ADMIN_EDITION_NEW
const ctaHover = ADMIN_EDITIONS_CTA_HOVER

/*********************************************************
 * Actions
 *
 * @description
 * Le champ de recherche relaie sa valeur ; vidé, il envoie une chaîne vide.
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
.editions-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  justify-content: space-between;
  gap: var(--editions-toolbar---gap, var(--origam-space---4));

  &__search {
    min-width: min(100%, 22rem);
  }

  @media (max-width: 760px) {
    :deep(.origam-btn) {
      width: 100%;
    }
  }
}
</style>

<style>
:root {
  --editions-toolbar---gap: var(--origam-space---4);
}
</style>

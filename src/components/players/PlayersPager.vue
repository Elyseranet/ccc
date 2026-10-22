<template>
  <nav
    class="players-pager"
    :aria-label="navLabel"
    data-cy="players-pagination"
  >
    <span
      class="players-pager__range"
      data-cy="players-pager-range"
    >{{ rangeText }}</span>
    <ol class="players-pager__list">
      <template
        v-for="(item, index) in items"
        :key="index"
      >
        <li
          v-if="item === null"
          class="players-pager__gap"
          aria-hidden="true"
        >…</li>
        <li v-else>
          <origam-btn
            class="players-pager__page"
            rounded="full"
            :variant="item === page ? 'flat' : 'text'"
            :bg-color="item === page ? 'primary' : undefined"
            :aria-current="item === page ? 'page' : undefined"
            :aria-label="pageLabel(item)"
            :text="String(item)"
            :data-cy="`players-pager-page-${item}`"
            @click="handlePage(item)"
          />
        </li>
      </template>
    </ol>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { OrigamBtn } from 'origam/components'
import { useT } from '~/composables/useT'
import { PLAYERS_PAGINATION_VISIBLE } from '~/consts/players.const'
import type { IPlayersPagerEmits, IPlayersPagerProps } from '~/interfaces/players.interface'
import { buildPageItems } from '~/utils/player.util'

/*********************************************************
 * Global
 *
 * @description
 * Pagination de l'annuaire : « 1–20 sur 145 » et les numéros de page. La page courante porte `aria-current="page"`.
 * Chaque numéro a un nom accessible complet (« Page 3 »), le chiffre seul ne dit pas de quoi il s'agit.
 ********************************************************/
const { t } = useT()
const props = withDefaults(defineProps<IPlayersPagerProps>(), {})
const emits = defineEmits<IPlayersPagerEmits>()
defineSlots<{}>()

/*********************************************************
 * Pages
 *
 * @description
 * Au plus `PLAYERS_PAGINATION_VISIBLE` entrées, avec des points de suspension au-delà.
 ********************************************************/
const pageCount = computed(() => Math.max(1, Math.ceil(props.total / props.pageSize)))
const items = computed(() => buildPageItems(props.page, pageCount.value, PLAYERS_PAGINATION_VISIBLE))
const navLabel = computed(() => t('players.pagination.label', 'Pagination'))
const rangeText = computed(() => {
  const from = (props.page - 1) * props.pageSize + 1
  const to = Math.min(props.page * props.pageSize, props.total)
  return t('players.pagination.range', '{from}–{to} sur {total}', { from, to, total: props.total })
})
const pageLabel = (page: number): string => t('players.pagination.page', 'Page {page}', { page })
const handlePage = (page: number) => {
  emits('update:page', page)
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
.players-pager {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--origam-space---3);
  margin-top: var(--players-pager---margin-top, var(--origam-space---5));
  font-size: var(--origam-font__size---sm);
  color: var(--origam-color__text---secondary);

  &__range {
    font-variant-numeric: tabular-nums;
  }

  &__list {
    display: flex;
    flex-wrap: wrap;
    gap: var(--origam-space---1);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  &__gap {
    display: grid;
    place-items: center;
    min-width: var(--origam-space---11);
  }

  &__page {
    --origam-btn---height: var(--origam-space---11);
    --origam-btn---min-width: var(--origam-space---11);
    --origam-btn---padding-lg: 0;
    --origam-btn---font-size: var(--origam-font__size---sm);
    min-width: var(--origam-space---11);
  }
}
</style>

<style>
:root {
  --players-pager---margin-top: var(--origam-space---5);
}
</style>

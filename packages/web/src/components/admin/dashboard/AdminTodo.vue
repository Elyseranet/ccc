<template>
  <section
    class="todo"
    :aria-labelledby="titleId"
    data-cy="admin-todo"
  >
    <origam-title
      :id="titleId"
      tag="h2"
      class="todo__title"
      :text="title"
    />
    <origam-card
      v-for="item in items"
      :key="item.id"
      :to="item.to ?? undefined"
      rounded="xl"
      border
      :border-color="item.hot ? hotBorderColor : undefined"
      padding="5"
      :hover="item.to !== null"
      :class="['todo__card', { 'todo__card--hot': item.hot, 'todo__card--off': item.to === null }]"
      :data-cy="`admin-todo-${item.id}`"
    >
      <template #default>
        <span class="todo__body">
          <span :class="['todo__count', 'font-display', { 'todo__count--hot': item.hot }]">{{ item.count }}</span>
          <span class="todo__text">
            <b>{{ item.title }}</b>
            <small>{{ item.subtitle }}</small>
          </span>
          <span
            v-if="item.to !== null"
            aria-hidden="true"
          >→</span>
        </span>
      </template>
    </origam-card>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { OrigamCard, OrigamTitle } from 'origam/components'
import { useT } from '~/composables/useT'
import { ADMIN_TODO_HOT_BORDER_COLOR } from '~/consts/admin-dashboard.const'
import type { IAdminTodoEmits, IAdminTodoProps, IAdminTodoSlots } from '~/interfaces/admin-dashboard.interface'

/*********************************************************
 * Global
 *
 * @description
 * « À traiter maintenant » : une carte par file d'attente de l'organisateur. Une carte sans destination (aucun brouillon de tirage)
 * est inerte et atténuée ; la carte « chaude » (scores saisis à valider) porte la bordure primaire.
 ********************************************************/
const { t } = useT()
const props = withDefaults(defineProps<IAdminTodoProps>(), {})
const emits = defineEmits<IAdminTodoEmits>()
defineSlots<IAdminTodoSlots>()
const titleId = 'admin-todo-title'
const hotBorderColor = ADMIN_TODO_HOT_BORDER_COLOR
const title = computed(() => t('admin.dashboard.todo_title', 'À traiter maintenant'))

/*********************************************************
 * Expose
 *
 * @description
 * Rien à piloter depuis l'extérieur.
 ********************************************************/
defineExpose({})
</script>

<style scoped lang="scss">
.todo {
  display: grid;
  gap: var(--origam-space---3);

  &__title {
    margin-block-end: var(--origam-space---1);
    font-size: var(--origam-font__size---xl);
    font-weight: var(--origam-font__weight---bold);
    letter-spacing: normal;
    line-height: var(--origam-font__lineHeight---tight);
  }

  &__body {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: var(--origam-space---4);
  }

  &__count {
    min-width: 2ch;
    font-size: var(--origam-font__size---3xl);
    line-height: 1;
    font-variant-numeric: tabular-nums;
    color: var(--origam-color__text---secondary);

    &--hot {
      color: var(--origam-color__bar---amber);
    }
  }

  &__text {
    display: grid;
    gap: 2px;
    text-align: start;

    small {
      font-size: var(--origam-font__size---sm);
      color: var(--origam-color__text---secondary);
    }
  }

  &__card--off {
    background: var(--origam-color__surface---sunken);
    box-shadow: none;
  }
}
</style>

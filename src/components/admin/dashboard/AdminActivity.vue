<template>
  <origam-card
    tag="section"
    padding="6"
    :aria-labelledby="titleId"
    class="activity"
    data-cy="admin-activity"
  >
    <template #default>
      <header class="activity__head">
        <origam-title
          :id="titleId"
          tag="h2"
          class="activity__title"
          :text="title"
        />
        <span class="activity__note">{{ note }}</span>
      </header>
      <async-state
        :pending="pending"
        :error="error"
        :empty="isEmpty"
        :empty-title="emptyTitle"
        @retry="handleRetry"
      >
        <template #default>
          <ul
            class="activity__list"
            :aria-label="title"
          >
            <li
              v-for="row in rows"
              :key="row.id"
              class="activity__item"
              :data-cy="`admin-activity-${row.id}`"
            >
              <span class="activity__row">
                <origam-chip
                  :text="row.kindLabel"
                  :color="row.color"
                  size="small"
                />
                <span class="activity__label">{{ row.head }}
                  <b
                    v-if="row.score"
                    class="activity__score"
                  >{{ row.score }}</b>
                  {{ row.tail }}</span>
                <small
                  v-if="row.context"
                  class="activity__context"
                >{{ row.context }}</small>
              </span>
            </li>
          </ul>
        </template>
      </async-state>
    </template>
  </origam-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { OrigamCard, OrigamChip, OrigamTitle } from 'origam/components'
import AsyncState from '~/components/common/AsyncState.vue'
import { useT } from '~/composables/useT'
import { ADMIN_DASHBOARD_ACTIVITY_KINDS } from '~/consts/admin-dashboard.const'
import type { IAdminActivityEmits, IAdminActivityProps, IAdminActivitySlots } from '~/interfaces/admin-dashboard.interface'

/*********************************************************
 * Global
 *
 * @description
 * « Activité récente » (A17) : flux des seules validations de match et de tirage, du plus récent au plus ancien.
 * Les lignes arrivent composées (`buildActivityRows`) ; le composant ajoute le libellé et la couleur de la pastille de chaque type.
 * Son propre `AsyncState` porte les états chargement, erreur (route B-15 absente comprise) et vide, sans masquer le reste de la page.
 ********************************************************/
const { t } = useT()
const props = withDefaults(defineProps<IAdminActivityProps>(), {
  error: null,
  pending: false
})
const emits = defineEmits<IAdminActivityEmits>()
defineSlots<IAdminActivitySlots>()
const titleId = 'admin-activity-title'
const title = computed(() => t('admin.dashboard.activity_title', 'Activité récente'))
const note = computed(() => t('admin.dashboard.activity_note', 'Validations uniquement'))
const emptyTitle = { key: 'admin.dashboard.activity_empty', fallback: 'Aucune validation pour le moment' }
const rows = computed(() => props.items.map((row) => {
  const kind = ADMIN_DASHBOARD_ACTIVITY_KINDS[row.kind]
  return { ...row, kindLabel: t(kind.text.key, kind.text.fallback), color: kind.color }
}))
const isEmpty = computed(() => props.items.length === 0)

/*********************************************************
 * Actions
 *
 * @description
 * « Réessayer » remonte au parent, qui relance la lecture du flux.
 ********************************************************/
const handleRetry = () => {
  emits('retry')
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
.activity {
  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--origam-space---3);
    margin-block-end: var(--origam-space---4);
  }

  &__title {
    font-size: var(--origam-font__size---xl);
    font-weight: var(--origam-font__weight---bold);
    line-height: var(--origam-font__lineHeight---tight);
  }

  &__note {
    color: var(--origam-color__text---secondary);
  }

  &__list {
    margin: 0;
    padding: var(--origam-space---2) 0;
    border-radius: var(--origam-radius---lg);
    background: var(--origam-color__surface---default);
    list-style: none;
  }

  &__item {
    display: flex;
    align-items: center;
    box-sizing: border-box;
    min-height: var(--origam-space---12);
    padding: var(--origam-space---2);
    border-radius: var(--origam-radius---lg);
  }

  &__row {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: var(--origam-space---3);
    width: 100%;
  }

  &__label {
    font-size: var(--origam-font__size---sm);
  }

  &__score {
    font-variant-numeric: tabular-nums;
  }

  &__context {
    font-size: var(--origam-font__size---xs);
    color: var(--origam-color__text---secondary);
  }
}
</style>

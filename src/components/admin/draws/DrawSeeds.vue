<template>
  <origam-card
    tag="section"
    rounded="xl"
    border
    elevation="md"
    padding="6"
    :aria-labelledby="titleId"
    class="draw-seeds"
    data-cy="draw-seeds"
  >
    <div class="draw-seeds__content">
      <h2
        :id="titleId"
        class="draw-seeds__title"
      >
        {{ title }}
      </h2>
      <p class="draw-seeds__lead">
        {{ lead }}
      </p>
      <ol class="draw-seeds__list">
        <li
          v-for="seed in seeds"
          :key="seed.participationId"
          class="draw-seeds__item"
          :class="{ 'draw-seeds__item--out': !isSelected(seed.participationId) }"
          data-cy="draw-seed-row"
        >
          <span class="draw-seeds__rank font-display">{{ seed.rank }}</span>
          <span class="draw-seeds__name">{{ seed.competitor.displayName }}</span>
          <span class="draw-seeds__acp">{{ formatAcp(seed.acp) }}</span>
        </li>
      </ol>
      <section
        v-for="group in tieGroups"
        :key="group.index"
        class="draw-seeds__tie"
        :aria-labelledby="`${titleId}-tie-${group.index}`"
        data-cy="draw-seed-tie"
      >
        <h3
          :id="`${titleId}-tie-${group.index}`"
          class="draw-seeds__tie-title"
        >
          {{ tieTitle(group) }}
        </h3>
        <p class="draw-seeds__tie-lead">
          {{ tieLead }}
        </p>
        <ul class="draw-seeds__candidates">
          <li
            v-for="candidate in group.candidates"
            :key="candidate.participationId"
          >
            <origam-checkbox
              :model-value="isChosen(group.index, candidate.participationId)"
              :label="candidate.competitor.displayName"
              hide-details
              :data-cy="`draw-seed-choice-${candidate.participationId}`"
              @update:model-value="emits('toggle', group.index, candidate.participationId)"
            />
          </li>
        </ul>
      </section>
      <origam-alert
        v-if="issue"
        status="warning"
        rounded="lg"
        :text="issueText"
        data-cy="draw-seeds-issue"
      />
      <div class="draw-seeds__actions">
        <origam-btn
          variant="outlined"
          size="large"
          :disabled="busy"
          :text="backLabel"
          data-cy="draw-seeds-back"
          @click="emits('back')"
        />
        <origam-btn
          variant="flat"
          bg-color="primary"
          elevation="lg"
          size="large"
          :disabled="!canConfirm"
          :loading="busy"
          :text="confirmLabel"
          data-cy="draw-seeds-confirm"
          @click="emits('confirm')"
        />
      </div>
    </div>
  </origam-card>
</template>

<script setup lang="ts">
import { computed, useId } from 'vue'
import { OrigamAlert, OrigamBtn, OrigamCard, OrigamCheckbox } from 'origam/components'
import { useT } from '~/composables/useT'
import type { IDrawSeedsProps, IPoolDrawTieGroup } from '~/interfaces/pool-draw.interface'

/*********************************************************
 * Global
 *
 * @description
 * Étape 2 : têtes de série (RG9), les meilleurs du classement ACP sur les 5 dernières éditions clôturées (A8). Une égalité parfaite sur
 * la frontière (RG10) n'est jamais tranchée par l'application : la règle de choix n'est pas écrite, l'administrateur coche les joueurs
 * retenus parmi les ex æquo, autant que de places.
 ********************************************************/
const { t } = useT()
const props = withDefaults(defineProps<IDrawSeedsProps>(), {})
const emits = defineEmits<{
  (event: 'toggle', groupIndex: number, participationId: string): void
  (event: 'back'): void
  (event: 'confirm'): void
}>()
defineSlots<{}>()
const titleId = useId()
const title = computed(() => t('admin.draws.seeds_title', '2 · Têtes de série'))
const lead = computed(() => t('admin.draws.seeds_lead', 'Les {count} meilleurs du classement ACP sur les 5 dernières éditions clôturées (A8).', { count: props.poolCount }))
const tieLead = computed(() => t('admin.draws.seeds_tie_lead', 'Ces joueurs sont à égalité parfaite sur tous les critères : l’application ne les départage pas, choisissez-les.'))
const issueText = computed(() => (props.issue ? t(props.issue.key, props.issue.fallback, props.issue.params) : ''))
const backLabel = computed(() => t('admin.draws.seeds_back', 'Modifier les paramètres'))
const confirmLabel = computed(() => t('admin.draws.seeds_confirm', 'Ouvrir le tirage'))
const tieTitle = (group: IPoolDrawTieGroup): string => t('admin.draws.seeds_tie_title', 'Égalité : {needed} sur {count} à retenir', { needed: group.needed, count: group.candidates.length })
const formatAcp = (value: number): string => value.toFixed(2)
const isSelected = (participationId: string): boolean => props.selectedIds.includes(participationId)
const isChosen = (groupIndex: number, participationId: string): boolean => (props.choices[groupIndex] ?? []).includes(participationId)

/*********************************************************
 * Expose
 *
 * @description
 * Rien à piloter depuis l'extérieur.
 ********************************************************/
defineExpose({})
</script>

<style scoped lang="scss">
.draw-seeds {
  &__content {
    display: grid;
    gap: var(--origam-space---4);
  }

  &__title {
    margin: 0;
    font-size: var(--origam-font__size---xl);
    font-weight: var(--origam-font__weight---bold);
    line-height: var(--origam-font__lineHeight---tight);
  }

  &__lead,
  &__tie-lead {
    margin: 0;
    color: var(--origam-color__text---secondary);
  }

  &__list,
  &__candidates {
    display: grid;
    gap: var(--origam-space---1);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  &__item {
    display: grid;
    grid-template-columns: var(--origam-space---8) minmax(0, 1fr) auto;
    align-items: center;
    gap: var(--origam-space---2);
    min-height: var(--origam-space---11);
    padding-inline: var(--origam-space---3);
    border-radius: var(--origam-radius---md);
    background: var(--origam-color__surface---sunken);

    &--out {
      opacity: 0.6;
    }
  }

  &__rank {
    color: var(--origam-color__bar---amber);
  }

  &__name {
    font-weight: var(--origam-font__weight---bold);
  }

  &__acp {
    font-variant-numeric: tabular-nums;
    color: var(--origam-color__text---secondary);
  }

  &__tie {
    display: grid;
    gap: var(--origam-space---2);
    padding: var(--origam-space---4);
    border: var(--origam-border__width---thin) dashed var(--origam-color__border---strong);
    border-radius: var(--origam-radius---lg);
  }

  &__tie-title {
    margin: 0;
    font-size: var(--origam-font__size---md);
    font-weight: var(--origam-font__weight---bold);
  }

  &__actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: var(--origam-space---3);
  }
}
</style>

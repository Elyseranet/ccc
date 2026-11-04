<template>
  <origam-card
    tag="section"
    rounded="xl"
    border
    elevation="md"
    padding="6"
    :aria-labelledby="titleId"
    class="draw-parameters"
    data-cy="draw-parameters"
  >
    <div class="draw-parameters__content">
      <h2
        :id="titleId"
        class="draw-parameters__title"
      >
        {{ title }}
      </h2>
      <p class="draw-parameters__lead">
        {{ lead }}
      </p>
      <div class="draw-parameters__fields">
        <div class="draw-parameters__field">
          <origam-label
            :for="fieldId"
            :text="poolsLabel"
          />
          <origam-number-field
            :id="fieldId"
            :model-value="poolCount"
            :min="1"
            :max="20"
            :step="1"
            :disabled="readOnly || busy"
            single-line
            hide-details
            data-cy="draw-pool-count"
            @update:model-value="handlePoolCount"
          />
        </div>
        <dl class="draw-parameters__facts">
          <div>
            <dt>{{ seedsLabel }}</dt>
            <dd
              class="font-display"
              data-cy="draw-seed-count"
            >
              {{ poolCount }}
            </dd>
          </div>
          <div>
            <dt>{{ playersLabel }}</dt>
            <dd
              class="font-display"
              data-cy="draw-player-count"
            >
              {{ total }}
            </dd>
          </div>
        </dl>
      </div>
      <p class="draw-parameters__rule">
        {{ rule }}
      </p>
      <origam-alert
        v-if="issue"
        status="warning"
        rounded="lg"
        :text="issueText"
        data-cy="draw-parameters-issue"
      />
      <div class="draw-parameters__actions">
        <origam-btn
          variant="flat"
          bg-color="primary"
          elevation="lg"
          size="large"
          :disabled="Boolean(issue) || readOnly"
          :loading="busy"
          :text="nextLabel"
          data-cy="draw-parameters-next"
          @click="emits('next')"
        />
      </div>
    </div>
  </origam-card>
</template>

<script setup lang="ts">
import { computed, useId } from 'vue'
import { OrigamAlert, OrigamBtn, OrigamCard, OrigamLabel, OrigamNumberField } from 'origam/components'
import { useT } from '~/composables/useT'
import type { IDrawParametersProps } from '~/interfaces/pool-draw.interface'

/*********************************************************
 * Global
 *
 * @description
 * Étape 1 : nombre de poules. Autant de têtes de série que de poules (RG9) : le second chiffre suit le premier et on ne peut pas
 * passer à l'étape suivante tant que le nombre de poules est hors bornes (1 à 20, jamais plus que d'inscrits).
 ********************************************************/
const { t } = useT()
const props = withDefaults(defineProps<IDrawParametersProps>(), {})
const emits = defineEmits<{ (event: 'update:poolCount', value: number): void, (event: 'next'): void }>()
defineSlots<{}>()
const titleId = useId()
const fieldId = useId()
const title = computed(() => t('admin.draws.parameters_title', '1 · Paramètres'))
const lead = computed(() => t('admin.draws.parameters_lead', 'Choisissez le nombre de poules : il y a autant de têtes de série que de poules (RG9).'))
const poolsLabel = computed(() => t('admin.draws.parameters_pools', 'Poules'))
const seedsLabel = computed(() => t('admin.draws.parameters_seeds', 'Têtes de série'))
const playersLabel = computed(() => t('admin.draws.parameters_players', 'Inscrits'))
const rule = computed(() => t('admin.draws.parameters_rule', 'Les poules sont les plus égales possible, à un joueur près (RG16) ; les joueurs des plus petites poules boivent une bière avant les matchs (RG17).'))
const issueText = computed(() => (props.issue ? t(props.issue.key, props.issue.fallback, props.issue.params) : ''))
const nextLabel = computed(() => t('admin.draws.parameters_next', 'Calculer les têtes de série'))
const handlePoolCount = (value: number | null) => {
  emits('update:poolCount', value ?? 0)
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
.draw-parameters {
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
  &__rule {
    margin: 0;
    color: var(--origam-color__text---secondary);
  }

  &__fields {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: var(--origam-space---6);
  }

  &__field {
    display: grid;
    gap: var(--origam-space---2);
    min-width: 12rem;
  }

  &__facts {
    display: flex;
    gap: var(--origam-space---6);
    margin: 0;

    dt {
      font-size: var(--origam-font__size---xs);
      font-weight: var(--origam-font__weight---bold);
      letter-spacing: var(--origam-font__letterSpacing---wider);
      text-transform: uppercase;
      color: var(--origam-color__text---tertiary);
    }

    dd {
      margin: 0;
      font-size: var(--origam-font__size---3xl);
      line-height: 1;
      color: var(--origam-color__bar---amber);
      font-variant-numeric: tabular-nums;
    }
  }

  &__actions {
    display: flex;
    justify-content: flex-end;
  }
}
</style>

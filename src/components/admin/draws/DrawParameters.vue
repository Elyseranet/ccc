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
          <origam-text-field
            :id="fieldId"
            :model-value="text"
            inputmode="numeric"
            :maxlength="2"
            :rules="rules"
            validate-on="input lazy"
            :disabled="readOnly || busy"
            single-line
            data-cy="draw-pool-count"
            @update:model-value="handleInput"
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
      <div class="draw-parameters__actions">
        <origam-btn
          variant="flat"
          :bg-color="buttonColor"
          :elevation="buttonElevation"
          size="large"
          :disabled="isBlocked"
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
import { computed, ref, useId, watch } from 'vue'
import { OrigamBtn, OrigamCard, OrigamLabel, OrigamTextField } from 'origam/components'
import { usePrimaryActionButton } from '~/composables/usePrimaryActionButton'
import { useT } from '~/composables/useT'
import type { IDrawParametersProps } from '~/interfaces/pool-draw.interface'
import { parameterIssue } from '~/utils/pool-draw.util'

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
const nextLabel = computed(() => t('admin.draws.parameters_next', 'Calculer les têtes de série'))
/*
 * Le champ garde le texte tapé : un nombre hors bornes (« 25 ») reste affiché avec son message au lieu d'être ramené en silence à une
 * valeur valide (Origam #1327, décision 87eea8e). Un texte vide ou non entier est transmis tel quel (0, NaN) et `issue` le refuse.
 */
const text = ref(props.poolCount > 0 ? String(props.poolCount) : '')
const typedPoolCount = (value: string): number => (value.trim() === '' ? 0 : Number(value))
// L'erreur n'apparaît qu'après une interaction (saisie ou sortie du champ) : `validate-on="input lazy"` n'évalue pas à l'ouverture.
// « Suivant » reste désactivé tant que `issue` est posée (RG9).
const rules = [(value: string | null): true | string => {
  const typed = typedPoolCount(value ?? '')
  const found = parameterIssue(typed, typed, props.total)
  return found ? t(found.key, found.fallback, found.params) : true
}]
const handleInput = (value: string | null) => {
  text.value = value ?? ''
  emits('update:poolCount', typedPoolCount(text.value))
}
// Une valeur venue de l'extérieur (brouillon rechargé) remplace le texte, jamais celle que l'on vient de taper.
watch(() => props.poolCount, (value) => {
  if (typedPoolCount(text.value) !== value) {
    text.value = value > 0 ? String(value) : ''
  }
})

const isBlocked = computed(() => Boolean(props.issue) || props.readOnly)
const { buttonColor, buttonElevation } = usePrimaryActionButton(isBlocked)

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

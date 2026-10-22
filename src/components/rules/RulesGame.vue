<template>
  <section
    class="rules-game"
    aria-labelledby="rules-game-title"
    data-cy="rules-game"
  >
    <div class="rules-game__intro">
      <dl class="rules-game__facts">
        <div
          v-for="fact in facts"
          :key="fact.id"
          class="rules-game__fact"
        >
          <dt class="rules-game__eyebrow">
            {{ fact.label }}
          </dt>
          <dd class="rules-game__fact-value font-display">
            {{ fact.value }}
          </dd>
        </div>
      </dl>
      <div>
        <origam-title
          id="rules-game-title"
          tag="h2"
          font-size="4xl"
          line-height="none"
          class="font-display neon--sm"
          :text="heading"
        />
        <p class="rules-game__lead">
          {{ lead }}
        </p>
      </div>
    </div>
    <ol
      class="rules-game__steps"
      :aria-label="stepsLabel"
      data-cy="rules-steps"
    >
      <li
        v-for="step in steps"
        :key="step.id"
        class="rules-game__step-item"
      >
        <origam-card
          rounded="xl"
          border
          padding="6"
          class="rules-game__step"
          :data-cy="step.dataCy"
        >
          <div class="rules-game__step-body">
            <span
              class="rules-game__step-number font-display"
              aria-hidden="true"
            >{{ step.number }}</span>
            <origam-title
              tag="h3"
              font-size="xl"
              font-weight="bold"
              line-height="tight"
              letter-spacing="normal"
              :text="step.title"
            />
            <p class="rules-game__step-text">
              {{ step.text }}
            </p>
          </div>
        </origam-card>
      </li>
    </ol>
    <origam-card
      tag="aside"
      rounded="xl"
      border
      elevation="md"
      padding="6"
      class="rules-game__note"
      data-cy="rules-note"
    >
      <p class="rules-game__note-text">
        <strong>{{ noteLead }}</strong>
        {{ noteText }}
      </p>
    </origam-card>
    <origam-title
      tag="h2"
      font-size="4xl"
      line-height="none"
      class="rules-game__golden-heading font-display neon--sm"
      aria-hidden="true"
      :text="goldenTitle"
    />
    <common-golden-rules :variant="goldenVariant" />
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { OrigamCard, OrigamTitle } from 'origam/components'
import { useT } from '~/composables/useT'
import { RULES_FACTS, RULES_STEPS } from '~/consts/rules.const'
import { GOLDEN_RULES_VARIANT } from '~/enums/golden-rules-variant.enum'

/*********************************************************
 * Global
 *
 * @description
 * Onglet « Le jeu » : principe, déroulé d'un point, règle du bûcheron et règles d'or (RG25 à RG32).
 * Le titre visible « Les huit règles d'or » est masqué aux lecteurs d'écran : GoldenRules porte déjà son propre h2.
 ********************************************************/
const { t } = useT()
const props = withDefaults(defineProps<{}>(), {})
const emits = defineEmits<{}>()
defineSlots<{}>()

/*********************************************************
 * Textes
 *
 * @description
 * Tous les libellés viennent des constantes (clés + repli) ou des clés ci-dessous.
 ********************************************************/
const heading = computed(() => t('rules.game_heading', 'Deux joueurs. Une cible. Un point à la fois.'))
const lead = computed(() => t('rules.game_lead', 'Les joueurs lancent leur capsule chacun leur tour. Une touche est suivie de la réplique adverse ; le point est marqué si l’adversaire ne touche pas à son tour.'))
const stepsLabel = computed(() => t('rules.steps_label', 'Le déroulé d’un point'))
const noteLead = computed(() => t('rules.note_lead', 'Le bûcheron ne compte pas :'))
const noteText = computed(() => t('rules.note_text', 'toucher la bière sans faire tomber la capsule posée dessus ne rapporte pas de point.'))
const goldenTitle = computed(() => t('golden_rules.title', 'Les huit règles d’or'))
const facts = computed(() => RULES_FACTS.map(fact => ({ id: fact.id, label: t(fact.label.key, fact.label.fallback), value: fact.value })))
const goldenVariant = GOLDEN_RULES_VARIANT.CARDS
const steps = computed(() => RULES_STEPS.map((step, index) => ({
  id: step.id,
  number: index + 1,
  dataCy: `rules-step-${step.id}`,
  title: t(step.title.key, step.title.fallback),
  text: t(step.text.key, step.text.fallback)
})))

/*********************************************************
 * Expose
 *
 * @description
 * Rien à piloter depuis l'extérieur.
 ********************************************************/
defineExpose({})
</script>

<style scoped lang="scss">
.rules-game {
  display: grid;
  gap: var(--rules-game---gap, var(--origam-space---10));

  &__intro {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.6fr);
    gap: var(--origam-space---8);
    align-items: center;
  }

  &__facts {
    display: grid;
    gap: var(--origam-space---3);
    margin: 0;
  }

  &__fact {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--origam-space---4);
    padding: var(--origam-space---4) var(--origam-space---5);
    border: var(--origam-border__width---thin) solid var(--origam-color__border---default);
    border-radius: var(--origam-radius---lg);
    background: var(--origam-color__surface---raised);
  }

  &__eyebrow {
    font-size: var(--origam-font__size---xs);
    font-weight: var(--origam-font__weight---bold);
    letter-spacing: var(--origam-font__letterSpacing---wider);
    text-transform: uppercase;
    color: var(--origam-color__text---tertiary);
  }

  &__fact-value {
    margin: 0;
    font-size: var(--origam-font__size---3xl);
    font-variant-numeric: tabular-nums;
    color: var(--origam-color__bar---amber);
  }

  &__steps {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: var(--origam-space---4);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  &__step-item {
    display: grid;
  }

  &__step {
    align-content: start;
  }

  &__step-body {
    display: grid;
    align-content: start;
    gap: var(--origam-space---2);
  }

  &__step-number {
    display: grid;
    place-items: center;
    width: var(--origam-space---12);
    aspect-ratio: 1;
    border-radius: var(--origam-radius---full);
    background: var(--origam-color__action--secondary---bg);
    color: var(--origam-color__action--secondary---fg);
    font-size: var(--origam-font__size---xl);
  }

  &__step-text {
    margin: 0;
    color: var(--origam-color__text---secondary);
  }

  &__lead {
    max-width: 40rem;
    margin: var(--origam-space---6) 0 0;
    font-size: var(--origam-font__size---xl);
    color: var(--origam-color__text---secondary);
  }

  &__note-text {
    margin: 0;
  }

  &__golden-heading {
    margin-top: var(--origam-space---6);
  }
}

@media (max-width: 1100px) {
  .rules-game__steps {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .rules-game__intro,
  .rules-game__steps {
    grid-template-columns: 1fr;
  }

  .rules-game__note {
    padding: var(--origam-space---5);
  }
}


</style>

<style>
:root {
  --rules-game---gap: var(--origam-space---10);
}
</style>

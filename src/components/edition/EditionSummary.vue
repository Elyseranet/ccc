<template>
  <section
    class="edition-summary"
    aria-labelledby="edition-summary-title"
    data-cy="edition-summary"
  >
    <origam-title
      id="edition-summary-title"
      tag="h2"
      class="sr-only"
      :text="title"
    />
    <origam-card
      v-if="podium"
      tag="article"
      rounded="xl"
      border
      elevation="md"
      padding="6"
      aria-labelledby="edition-podium-title"
      class="edition-summary__podium"
      data-cy="edition-podium"
    >
      <origam-title
        id="edition-podium-title"
        tag="h3"
        class="sr-only"
        :text="podiumTitle"
      />
      <div class="edition-summary__podium-body">
        <div class="edition-summary__champ">
          <cap-badge
            class="edition-summary__cap"
            text="1"
            :text-size="capTextSize"
          />
          <p class="edition-summary__champ-text">
            <span class="edition-summary__eyebrow">{{ championLabel }}</span>
            <span
              class="edition-summary__champ-name font-display neon--sm"
              data-cy="edition-champion"
            >{{ podium.champion.displayName }}</span>
            <span
              v-if="finalLine"
              class="edition-summary__final"
              data-cy="edition-final-line"
            >{{ finalLine }}</span>
          </p>
        </div>
        <ul class="edition-summary__rest">
          <li
            v-if="podium.finalist"
            class="edition-summary__place"
          >
            <span class="edition-summary__eyebrow">{{ finalistLabel }}</span>
            <common-player-link
              :competitor="podium.finalist"
              :titles="podium.finalistTitles"
              inline
            />
          </li>
          <li
            v-for="place in podium.semifinalists"
            :key="place.person.id"
            class="edition-summary__place"
          >
            <span class="edition-summary__eyebrow">{{ semifinalistLabel }}</span>
            <common-player-link
              :competitor="place.person"
              :titles="place.titles"
              inline
            />
          </li>
        </ul>
      </div>
    </origam-card>
    <ul class="edition-summary__facts">
      <li
        v-for="fact in factRows"
        :key="fact.id"
        class="edition-summary__fact-item"
      >
        <origam-card
          rounded="xl"
          border
          elevation="md"
          padding="5"
          class="edition-summary__fact"
          :data-cy="fact.dataCy"
        >
          <div class="edition-summary__fact-body">
            <p class="edition-summary__eyebrow">
              {{ fact.label }}
            </p>
            <p class="edition-summary__fact-value font-display">
              {{ fact.value }}
            </p>
            <small
              v-if="fact.detail"
              class="edition-summary__small"
            ><abbr-text :text="fact.detail" /></small>
            <small
              v-if="fact.extra"
              class="edition-summary__small"
            >{{ fact.extra }}</small>
          </div>
        </origam-card>
      </li>
    </ul>
    <origam-card
      tag="article"
      rounded="xl"
      border
      elevation="md"
      padding="6"
      aria-labelledby="edition-steps-title"
      class="edition-summary__steps"
      data-cy="edition-steps"
    >
      <origam-title
        id="edition-steps-title"
        tag="h3"
        class="edition-summary__steps-title"
        font-size="xl"
        font-weight="bold"
        line-height="tight"
        letter-spacing="normal"
        :text="stepsTitle"
      />
      <ol class="edition-summary__stepper">
        <li
          v-for="step in stepRows"
          :key="step.id"
          class="edition-summary__step"
          :class="step.className"
          :data-cy="step.dataCy"
        >
          <span class="edition-summary__step-index">{{ step.index }}</span>
          <span>{{ step.label }}</span>
          <edition-chip
            :family="step.family"
            :text="step.stateLabel"
          />
        </li>
      </ol>
    </origam-card>
  </section>
</template>

<script setup lang="ts">
import AbbrText from '~/components/common/AbbrText.vue'
import { computed } from 'vue'
import { OrigamCard, OrigamTitle } from 'origam/components'
import CommonPlayerLink from '~/components/common/PlayerLink.vue'
import EditionChip from '~/components/edition/EditionChip.vue'
import { useT } from '~/composables/useT'
import CapBadge from '~/components/common/CapBadge.vue'
import { EDITION_PODIUM_CAP_TEXT_SIZE, EDITION_STEP_FAMILIES, EDITION_STEP_STATE_LABELS } from '~/consts/edition-view.const'
import type { IEditionSummaryProps } from '~/interfaces/edition-view.interface'

/*********************************************************
 * Global
 *
 * @description
 * Synthèse : podium, chiffres de l'édition et Déroulé. Le Déroulé est UNE carte qui contient une liste ordonnée native
 * (chaque étape est une ligne), pas un `origam-stepper` ni une liste de cartes. Les nombres sont des paramètres i18n.
 ********************************************************/
const { t } = useT()
const props = withDefaults(defineProps<IEditionSummaryProps>(), {})
const emits = defineEmits<{}>()
defineSlots<{}>()
const capTextSize = EDITION_PODIUM_CAP_TEXT_SIZE

/*********************************************************
 * Textes
 *
 * @description
 * Les libellés construits par `edition-view.util` sont des clés ; ils sont traduits ici.
 ********************************************************/
const title = computed(() => t('edition.summary_title', 'Synthèse'))
const podiumTitle = computed(() => t('edition.podium_title', 'Podium'))
const championLabel = computed(() => t('edition.podium_champion', 'Champion·ne'))
const finalistLabel = computed(() => t('edition.podium_finalist', 'Finaliste'))
const semifinalistLabel = computed(() => t('edition.podium_semifinalist', 'Demi-finale'))
const stepsTitle = computed(() => t('edition.steps_title', 'Déroulé'))
const finalLine = computed(() => {
  const podium = props.podium
  if (!podium || !podium.finalist || podium.finalWinnerScore === null || podium.finalLoserScore === null) {
    return ''
  }
  return t('edition.podium_final_line', 'Finale gagnée {winner}–{loser} contre {opponent}', { winner: podium.finalWinnerScore, loser: podium.finalLoserScore, opponent: podium.finalist.displayName })
})
const factRows = computed(() => props.facts.map(fact => ({
  id: fact.id,
  dataCy: `edition-fact-${fact.id.replaceAll('_', '-')}`,
  label: t(fact.label.key, fact.label.fallback),
  value: fact.value,
  detail: fact.detail ? t(fact.detail.key, fact.detail.fallback, fact.detail.params) : '',
  extra: fact.extra ? t(fact.extra.key, fact.extra.fallback, fact.extra.params) : ''
})))
const stepRows = computed(() => props.steps.map(step => ({
  id: step.id,
  index: step.index,
  dataCy: `edition-step-${step.id.replaceAll('_', '-')}`,
  label: t(step.label.key, step.label.fallback),
  className: `edition-summary__step--${step.state}`,
  family: EDITION_STEP_FAMILIES[step.state],
  stateLabel: t(EDITION_STEP_STATE_LABELS[step.state].key, EDITION_STEP_STATE_LABELS[step.state].fallback)
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
.edition-summary {
  $this: &;

  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
  grid-template-areas: 'pod steps' 'facts steps';
  gap: var(--edition-summary---gap, var(--origam-space---4));

  &__podium {
    --origam-card---display: grid;

    grid-area: pod;
    background:
      radial-gradient(30rem 18rem at 0% 0%, color-mix(in srgb, var(--origam-color__bar---amber) 22%, transparent), transparent 70%),
      var(--origam-color__surface---raised);
  }

  &__podium-body {
    display: grid;
    height: 100%;
    gap: var(--origam-space---6);
  }

  &__champ {
    display: flex;
    align-items: center;
    gap: var(--origam-space---5);
  }

  &__champ-text {
    display: grid;
    gap: var(--origam-space---1);
    margin: 0;
  }

  &__cap {
    width: 6rem;
    flex: none;
    rotate: -10deg;
  }


  &__eyebrow {
    margin: 0;
    font-size: var(--origam-font__size---xs);
    font-weight: var(--origam-font__weight---bold);
    letter-spacing: var(--origam-font__letterSpacing---wider);
    text-transform: uppercase;
    color: var(--origam-color__text---tertiary);
  }

  &__champ-name {
    font-size: var(--origam-font__size---4xl);
    line-height: 1;
  }

  &__final {
    color: var(--origam-color__text---secondary);
    font-variant-numeric: tabular-nums;
  }

  &__rest {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--origam-space---3);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  &__place {
    display: grid;
    gap: var(--origam-space---1);
    padding: var(--origam-space---3) var(--origam-space---4);
    border-radius: var(--origam-radius---lg);
    background: var(--origam-color__surface---sunken);
    font-weight: var(--origam-font__weight---semibold);

    // Comme la maquette : les étoiles passent sous le nom (variables de PlayerLink).
    --player-link---content-direction: column;
    --player-link---content-align: flex-start;
    --player-link---content-gap: var(--origam-space---1);
    --player-link---stars-margin: 0;
  }

  &__facts {
    grid-area: facts;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--origam-space---4);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  &__fact-item {
    display: grid;
  }

  &__fact-body {
    display: flex;
    flex-direction: column;
    gap: var(--origam-space---1);
  }

  &__fact-value {
    margin: 0;
    font-size: var(--origam-font__size---3xl);
    line-height: 1;
    font-variant-numeric: tabular-nums;
    color: var(--origam-color__bar---amber);
  }

  &__small {
    font-size: var(--origam-font__size---sm);
    color: var(--origam-color__text---secondary);
  }

  &__steps {
    grid-area: steps;
  }

  &__steps-title {
    margin: 0;
    font-size: var(--origam-font__size---xl);
    font-weight: var(--origam-font__weight---bold);
    line-height: var(--origam-font__lineHeight---tight);
  }

  &__stepper {
    display: grid;
    gap: var(--origam-space---2);
    margin: var(--origam-space---4) 0 0;
    padding: 0;
    list-style: none;
  }

  &__step {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: var(--origam-space---3);
    padding: var(--origam-space---2) var(--origam-space---3);
    border-radius: var(--origam-radius---lg);
    background: var(--origam-color__surface---sunken);
    font-weight: var(--origam-font__weight---semibold);
  }

  &__step-index {
    display: grid;
    place-items: center;
    width: var(--origam-space---8);
    aspect-ratio: 1;
    border-radius: var(--origam-radius---full);
    background: var(--origam-color__feedback--success---bgSubtle);
    color: var(--origam-color__feedback--success---fgSubtle);
    font-size: var(--origam-font__size---sm);
    font-variant-numeric: tabular-nums;
  }

  &__step--active #{$this}__step-index {
    background: var(--origam-color__action--secondary---bg);
    color: var(--origam-color__action--secondary---fg);
  }

  &__step--pending #{$this}__step-index {
    background: var(--origam-color__surface---overlay);
    color: var(--origam-color__text---secondary);
  }
}

@media (max-width: 1100px) {
  .edition-summary {
    grid-template-columns: 1fr;
    grid-template-areas: 'pod' 'facts' 'steps';
  }
}

@media (max-width: 760px) {
  .edition-summary {
    &__podium,
    &__steps {
      padding: var(--origam-space---5);
    }

    &__rest,
    &__facts {
      grid-template-columns: 1fr;
    }

    &__champ {
      flex-direction: column;
      align-items: flex-start;
    }
  }
}
</style>

<style>
:root {
  --edition-summary---gap: var(--origam-space---4);
}
</style>

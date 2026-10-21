<template>
  <section
    class="rules-tournament"
    aria-labelledby="rules-tournament-title"
    data-cy="rules-tournament"
  >
    <h2
      id="rules-tournament-title"
      class="sr-only"
    >
      {{ heading }}
    </h2>
    <ul class="rules-tournament__grid">
      <li
        v-for="card in cards"
        :key="card.id"
        class="rules-tournament__item"
      >
        <origam-card
          tag="article"
          rounded="xl"
          border
          elevation="md"
          padding="6"
          class="rules-tournament__card"
          :data-cy="card.dataCy"
        >
          <div class="rules-tournament__body">
            <p class="rules-tournament__eyebrow">
              {{ card.eyebrow }}
            </p>
            <p
              v-if="card.bigValue"
              class="rules-tournament__big font-display"
              :class="card.bigClass"
            >
              <span class="rules-tournament__num">{{ card.bigValue }}</span>
              {{ card.bigUnit }}
            </p>
            <origam-title
              v-if="card.title"
              tag="h3"
              font-size="xl"
              font-weight="bold"
              line-height="tight"
              letter-spacing="normal"
              :text="card.title"
            />
            <p
              class="rules-tournament__text"
              :class="card.textClass"
            >
              {{ card.text }}
            </p>
          </div>
        </origam-card>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { OrigamCard, OrigamTitle } from 'origam/components'
import { useT } from '~/composables/useT'
import { RULES_TOURNAMENT_CARDS } from '~/consts/rules.const'

/*********************************************************
 * Global
 *
 * @description
 * Onglet « Le tournoi » : format des matchs et des poules (RG15 à RG22). Liste de cartes, contenu de document.
 ********************************************************/
const { t } = useT()
const props = withDefaults(defineProps<{}>(), {})
const emits = defineEmits<{}>()
defineSlots<{}>()

/*********************************************************
 * Textes
 *
 * @description
 * Les cartes sont préparées ici pour garder le template sans logique.
 ********************************************************/
const heading = computed(() => t('rules.tournament_heading', 'Le tournoi'))
const cards = computed(() => RULES_TOURNAMENT_CARDS.map(card => ({
  id: card.id,
  dataCy: `rules-card-${card.id.replaceAll('_', '-')}`,
  eyebrow: t(card.eyebrow.key, card.eyebrow.fallback),
  title: card.title ? t(card.title.key, card.title.fallback) : '',
  text: t(card.text.key, card.text.fallback),
  bigValue: card.bigValue ?? '',
  bigUnit: card.bigUnit ? t(card.bigUnit.key, card.bigUnit.fallback) : '',
  textClass: card.bigValue ? '' : 'rules-tournament__text--muted',
  bigClass: card.isAmber ? 'rules-tournament__big--amber' : ''
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
.rules-tournament {
  &__grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--rules-tournament---gap, var(--origam-space---4));
    margin: 0;
    padding: 0;
    list-style: none;
  }

  &__item {
    display: grid;
  }

  &__card {
    align-content: start;
  }

  &__body {
    display: grid;
    align-content: start;
    gap: var(--origam-space---3);
  }

  &__eyebrow {
    margin: 0;
    font-size: var(--origam-font__size---xs);
    font-weight: var(--origam-font__weight---bold);
    letter-spacing: var(--origam-font__letterSpacing---wider);
    text-transform: uppercase;
    color: var(--origam-color__text---tertiary);
  }

  &__big {
    margin: 0;
    font-size: var(--origam-font__size---4xl);
    line-height: 1;
    color: var(--origam-color__bar---ice);

    &--amber {
      color: var(--origam-color__bar---amber);
    }
  }

  &__num {
    font-variant-numeric: tabular-nums;
  }

  &__text {
    margin: 0;

    &--muted {
      color: var(--origam-color__text---secondary);
    }
  }
}

@media (max-width: 1100px) {
  .rules-tournament__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .rules-tournament__grid {
    grid-template-columns: 1fr;
  }

  .rules-tournament__card {
    padding: var(--origam-space---5);
  }
}
</style>

<style>
:root {
  --rules-tournament---gap: var(--origam-space---4);
}
</style>

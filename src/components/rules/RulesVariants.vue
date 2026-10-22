<template>
  <section
    id="variantes"
    class="rules-variants"
    aria-labelledby="rules-variants-title"
    tabindex="-1"
    data-cy="rules-variants"
  >
    <h2
      id="rules-variants-title"
      class="sr-only"
    >
      {{ heading }}
    </h2>
    <p class="rules-variants__lead">
      {{ lead }}
    </p>
    <ul class="rules-variants__grid">
      <li
        v-for="variant in variants"
        :key="variant.id"
        class="rules-variants__item"
      >
        <origam-card
          tag="article"
          rounded="xl"
          border
          elevation="md"
          padding="6"
          class="rules-variants__card"
          :data-cy="variant.dataCy"
        >
          <figure class="rules-variants__figure">
            <rules-variant-figure :variant="variant.source" />
            <figcaption class="rules-variants__caption">
              <span class="rules-variants__eyebrow">{{ variant.eyebrow }}</span>
              <origam-title
                tag="h3"
                font-size="2xl"
                class="font-display"
                :text="variant.name"
              />
              <span class="rules-variants__text">{{ variant.text }}</span>
            </figcaption>
          </figure>
        </origam-card>
      </li>
    </ul>
    <p class="rules-variants__note">
      {{ note }}
    </p>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { OrigamCard, OrigamTitle } from 'origam/components'
import { useT } from '~/composables/useT'
import { RULES_VARIANTS } from '~/consts/rules.const'

/*********************************************************
 * Global
 *
 * @description
 * Onglet « Variantes » (cible de `/variants` via `#variantes`, A2). L'id et `tabindex="-1"` permettent d'y amener
 * le focus depuis le hash.
 ********************************************************/
const { t } = useT()
const props = withDefaults(defineProps<{}>(), {})
const emits = defineEmits<{}>()
defineSlots<{}>()

/*********************************************************
 * Textes
 *
 * @description
 * Les variantes sont préparées ici pour garder le template sans logique.
 ********************************************************/
const heading = computed(() => t('rules.variants_heading', 'Variantes'))
const lead = computed(() => t('rules.variants_lead', 'Les règles principales restent identiques ; seule la disposition des bières change.'))
const note = computed(() => t('rules.variants_note', 'Quelle que soit la variante, les règles principales (touche, contre-caps, bûcheron, finir sa bière) restent identiques.'))
const variants = computed(() => RULES_VARIANTS.map(variant => ({
  id: variant.id,
  source: variant,
  dataCy: `rules-variant-${variant.id}`,
  eyebrow: t('rules.variant_label', 'Variante {n}', { n: variant.number }),
  name: t(variant.name.key, variant.name.fallback),
  text: t(variant.description.key, variant.description.fallback)
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
.rules-variants {
  scroll-margin-top: var(--origam-space---20);

  &:focus-visible {
    outline: var(--origam-border__width---2) solid var(--origam-color__border---focus, var(--origam-color__action--primary---bg));
    outline-offset: var(--origam-space---2);
  }

  &__lead {
    max-width: var(--rules-variants__lead---max-width, 40rem);
    margin: 0;
    font-size: var(--origam-font__size---xl);
    color: var(--origam-color__text---secondary);
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--rules-variants---gap, var(--origam-space---4));
    margin: var(--origam-space---6) 0 0;
    padding: 0;
    list-style: none;
  }

  &__item {
    display: grid;
  }

  &__card :deep(.origam-card__content) {
    height: 100%;
  }

  &__figure {
    display: grid;
    height: 100%;
    gap: var(--origam-space---4);
    margin: 0;
  }

  &__caption {
    display: grid;
    gap: var(--origam-space---2);
  }

  &__eyebrow {
    font-size: var(--origam-font__size---xs);
    font-weight: var(--origam-font__weight---bold);
    letter-spacing: var(--origam-font__letterSpacing---wider);
    text-transform: uppercase;
    color: var(--origam-color__text---tertiary);
  }

  &__text {
    color: var(--origam-color__text---secondary);
  }

  &__note {
    margin: var(--origam-space---5) 0 0;
    color: var(--origam-color__text---secondary);
  }
}

@media (max-width: 1100px) {
  .rules-variants__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .rules-variants__grid {
    grid-template-columns: 1fr;
  }

  .rules-variants__card {
    padding: var(--origam-space---5);
  }
}
</style>

<style>
:root {
  --rules-variants---gap: var(--origam-space---4);
  --rules-variants__lead---max-width: 40rem;
}
</style>

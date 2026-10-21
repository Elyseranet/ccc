<template>
  <section
    class="golden-rules"
    aria-labelledby="golden-rules-title"
    data-cy="golden-rules"
  >
    <h2
      id="golden-rules-title"
      class="sr-only"
    >
      {{ title }}
    </h2>
    <ol class="golden-rules__list">
      <li
        v-for="rule in rules"
        :key="rule.number"
        class="golden-rules__item font-display"
      >
        <span class="golden-rules__label">{{ rule.prefix }}</span>
        {{ rule.text }}
      </li>
    </ol>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useT } from '~/composables/useT'
import { GOLDEN_RULES } from '~/consts/golden-rules.const'

/*********************************************************
 * Global
 *
 * @description
 * Bandeau STATIQUE des huit règles d'or (RG25 à RG32) : grille 4 × 2 en bureau, défilement manuel à l'aimant sur mobile.
 * Aucun défilement automatique (décision utilisateur).
 ********************************************************/
const { t } = useT()
const props = withDefaults(defineProps<{}>(), {})
const emits = defineEmits<{}>()
defineSlots<{}>()

/*********************************************************
 * Textes
 *
 * @description
 * La numérotation « Règle d'or N » suit l'ordre du bandeau (1 à 8) ; le numéro RG de la spec n'est pas affiché.
 ********************************************************/
const title = computed(() => t('golden_rules.title', 'Les huit règles d’or'))
const rules = computed(() => GOLDEN_RULES.map((rule, index) => ({
  number: rule.number,
  prefix: t('golden_rules.label', 'Règle d’or {n}', { n: index + 1 }),
  text: t(rule.key, rule.label)
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
.golden-rules {
  background: var(--origam-color__action--secondary---bg);
  color: var(--origam-color__action--secondary---fg);

  &__list {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    margin: 0;
    padding: 0;
    list-style: none;
  }

  &__item {
    display: grid;
    align-content: start;
    gap: var(--origam-space---2);
    padding: var(--origam-space---5) var(--origam-space---6);
    border-right: 1px solid color-mix(in srgb, var(--origam-color__action--secondary---fg) 18%, transparent);
    border-bottom: 1px solid color-mix(in srgb, var(--origam-color__action--secondary---fg) 18%, transparent);
    font-size: var(--origam-font__size---lg);
    line-height: var(--origam-font__lineHeight---tight);
  }

  &__label {
    font-family: var(--origam-font__family---sans);
    font-size: var(--origam-font__size---xs);
    font-weight: var(--origam-font__weight---bold);
    letter-spacing: var(--origam-font__letterSpacing---wider);
    text-transform: uppercase;
  }
}

@media (max-width: 760px) {
  .golden-rules__list {
    display: flex;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    scrollbar-width: none;
  }

  .golden-rules__item {
    flex: 0 0 var(--golden-rules---item-width, 78%);
    scroll-snap-align: start;
  }
}
</style>

<style>
:root {
  --golden-rules---item-width: 78%;
}
</style>

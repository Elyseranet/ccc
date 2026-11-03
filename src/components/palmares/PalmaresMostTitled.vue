<template>
  <div
    v-if="first"
    class="palmares-most-titled"
    role="group"
    :aria-label="label"
    data-cy="palmares-most-titled"
  >
    <svg
      class="palmares-most-titled__cap"
      viewBox="0 0 100 100"
      aria-hidden="true"
    >
      <polygon
        class="palmares-most-titled__cap-shape"
        :points="capPoints"
      />
      <circle
        class="palmares-most-titled__cap-inner"
        cx="50"
        cy="50"
        r="31"
      />
      <text
        class="palmares-most-titled__cap-text"
        x="50"
        y="58"
        text-anchor="middle"
      >
        {{ first.titles }}
      </text>
    </svg>
    <div class="palmares-most-titled__text">
      <span class="palmares-most-titled__eyebrow">{{ label }}</span>
      <div
        v-for="holder in holders"
        :key="holder.id"
        class="palmares-most-titled__holder"
        data-cy="palmares-most-titled-holder"
      >
        <span
          class="palmares-most-titled__name font-display neon--sm"
          data-cy="palmares-most-titled-name"
        >{{ holder.name }}</span>
        <span class="palmares-most-titled__detail">{{ holder.detail }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useT } from '~/composables/useT'
import { BRAND_CAP_POINTS } from '~/consts/brand.const'
import type { IPalmaresMostTitled, IPalmaresMostTitledProps } from '~/interfaces/palmares.interface'

/*********************************************************
 * Global
 *
 * @description
 * Le ou les plus titrés, dans l'en-tête : le plus de titres de l'archive (classement All Time), la capsule porte le nombre de
 * titres. À égalité (F-02-TIE), tous les joueurs sont montrés, dans l'ordre de l'API, sans départage inventé. Absent tant que
 * personne n'a de titre. Le surnom n'est affiché que s'il existe.
 ********************************************************/
const { t } = useT()
const props = withDefaults(defineProps<IPalmaresMostTitledProps>(), {})
const emits = defineEmits<{}>()
defineSlots<{}>()
const capPoints = BRAND_CAP_POINTS
const first = computed(() => props.mostTitled[0] ?? null)
const label = computed(() => props.mostTitled.length > 1
  ? t('palmares.most_titled_tied', 'Les plus titrés')
  : t('palmares.most_titled', 'Le plus titré'))
const holders = computed(() => props.mostTitled.map(entry => ({ id: entry.competitor.id, name: entry.competitor.displayName, detail: detailOf(entry) })))
const detailOf = (mostTitled: IPalmaresMostTitled): string => {
  const titles = mostTitled.titles === 1
    ? t('palmares.titles_one', '1 titre')
    : t('palmares.titles_other', '{count} titres', { count: mostTitled.titles })
  const participations = mostTitled.participations === 1
    ? t('palmares.participations_one', '1 participation')
    : t('palmares.participations_other', '{count} participations', { count: mostTitled.participations })
  const nickname = mostTitled.nickname ? t('palmares.nickname', '« {nickname} » · ', { nickname: mostTitled.nickname }) : ''
  return `${nickname}${titles} · ${participations}`
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
.palmares-most-titled {
  display: flex;
  align-items: center;
  gap: var(--origam-space---6);
  width: fit-content;
  max-width: 100%;
  margin-top: var(--origam-space---10);
  padding: var(--origam-space---5) var(--origam-space---6);
  border: var(--origam-border__width---thin) solid var(--origam-color__border---default);
  border-radius: var(--origam-radius---xl);
  background: color-mix(in srgb, var(--origam-color__surface---raised) 80%, transparent);

  &__cap {
    width: 5.5rem;
    flex: none;
    rotate: -12deg;
  }

  &__cap-shape {
    fill: var(--origam-color__bar---amber);
  }

  &__cap-inner {
    fill: var(--origam-color__surface---default);
  }

  &__cap-text {
    fill: var(--origam-color__bar---foam);
    font-family: var(--origam-font__family---display);
    font-size: 34px;
  }

  &__text {
    display: grid;
    gap: var(--origam-space---1);
  }

  &__holder {
    display: grid;
    gap: var(--origam-space---1);

    & + & {
      margin-top: var(--origam-space---3);
    }
  }

  &__eyebrow {
    font-size: var(--origam-font__size---xs);
    font-weight: var(--origam-font__weight---bold);
    letter-spacing: var(--origam-font__letterSpacing---wider);
    text-transform: uppercase;
    color: var(--origam-color__text---tertiary);
  }

  &__name {
    font-size: var(--origam-font__size---3xl);
    line-height: 1;
  }

  &__detail {
    color: var(--origam-color__text---secondary);
  }
}

@media (max-width: 760px) {
  .palmares-most-titled {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>

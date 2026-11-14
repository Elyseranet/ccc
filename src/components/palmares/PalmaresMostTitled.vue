<template>
  <div
    v-if="first"
    class="palmares-most-titled"
    role="group"
    :aria-label="label"
    data-cy="palmares-most-titled"
  >
    <cap-badge
      class="palmares-most-titled__cap"
      :text="String(first.titles)"
      :text-size="capTextSize"
    />
    <div
      v-if="isTied"
      class="palmares-most-titled__text palmares-most-titled__text--tied"
    >
      <p class="palmares-most-titled__eyebrow">
        {{ label }}
      </p>
      <ul class="palmares-most-titled__ties">
        <li
          v-for="holder in holders"
          :key="holder.id"
          class="palmares-most-titled__tie"
          data-cy="palmares-most-titled-holder"
        >
          <span
            class="palmares-most-titled__name palmares-most-titled__name--tie font-display neon--sm"
            data-cy="palmares-most-titled-name"
          >{{ holder.name }}</span>
          <span class="palmares-most-titled__detail">{{ holder.tieDetail }}</span>
        </li>
      </ul>
    </div>
    <div
      v-else
      class="palmares-most-titled__text"
    >
      <span class="palmares-most-titled__eyebrow">{{ label }}</span>
      <span
        class="palmares-most-titled__name font-display neon--sm"
        data-cy="palmares-most-titled-name"
      >{{ first.competitor.displayName }}</span>
      <span class="palmares-most-titled__detail">{{ holders[0]?.detail }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useT } from '~/composables/useT'
import CapBadge from '~/components/common/CapBadge.vue'
import { PALMARES_CAP_TEXT_SIZE } from '~/consts/palmares.const'
import type { IPalmaresMostTitled, IPalmaresMostTitledProps } from '~/interfaces/palmares.interface'
import { buildMostTitledLabel } from '~/utils/palmares.util'

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
const capTextSize = PALMARES_CAP_TEXT_SIZE
const first = computed(() => props.mostTitled[0] ?? null)
const isTied = computed(() => props.mostTitled.length > 1)
const labelText = computed(() => buildMostTitledLabel(props.mostTitled))
const label = computed(() => t(labelText.value.key, labelText.value.fallback, labelText.value.params))
const holders = computed(() => props.mostTitled.map(entry => ({ id: entry.competitor.id, name: entry.competitor.displayName, detail: detailOf(entry, true), tieDetail: detailOf(entry, false) })))
const detailOf = (mostTitled: IPalmaresMostTitled, withTitles: boolean): string => {
  const titles = mostTitled.titles === 1
    ? t('palmares.titles_one', '1 titre')
    : t('palmares.titles_other', '{count} titres', { count: mostTitled.titles })
  const participations = mostTitled.participations === 1
    ? t('palmares.participations_one', '1 participation')
    : t('palmares.participations_other', '{count} participations', { count: mostTitled.participations })
  const nickname = mostTitled.nickname ? t('palmares.nickname', '« {nickname} » · ', { nickname: mostTitled.nickname }) : ''
  return withTitles ? `${nickname}${titles} · ${participations}` : `${nickname}${participations}`
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


  &__text {
    display: grid;
    gap: var(--origam-space---1);
  }

  &__text--tied {
    gap: var(--origam-space---3);
  }

  &__ties {
    display: flex;
    flex-wrap: wrap;
    gap: var(--origam-space---3) var(--origam-space---8);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  &__tie {
    display: grid;
    gap: var(--origam-space---1);
  }

  &__eyebrow {
    margin: 0;
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

  &__name--tie {
    font-size: var(--origam-font__size---2xl);
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

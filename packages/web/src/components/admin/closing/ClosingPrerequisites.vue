<template>
  <origam-card
    tag="section"
    rounded="xl"
    border
    elevation="md"
    :aria-labelledby="titleId"
    class="closing-prerequisites"
    data-cy="closing-prerequisites"
  >
    <template #default>
      <header class="closing-prerequisites__head">
        <h2
          :id="titleId"
          class="closing-prerequisites__title"
        >
          {{ title }}
        </h2>
      </header>
      <ul class="closing-prerequisites__list">
        <li
          v-for="item in items"
          :key="item.id"
          class="closing-prerequisites__item"
          :data-cy="`closing-prerequisite-${item.id}`"
        >
          <span
            class="closing-prerequisites__mark"
            :class="{ 'closing-prerequisites__mark--met': item.met }"
            aria-hidden="true"
          >
            <icon-check v-if="item.met" />
          </span>
          <span>{{ item.label }}</span>
          <edition-chip
            :family="item.family"
            :text="item.chip"
          />
        </li>
      </ul>
      <origam-data-list
        mode="kv"
        :items="facts"
        :border="false"
        density="compact"
        rounded="none"
        bg-color="transparent"
        class="closing-prerequisites__facts"
        data-cy="closing-facts"
      />
    </template>
  </origam-card>
</template>

<script setup lang="ts">
import { computed, useId } from 'vue'
import { OrigamCard, OrigamDataList } from 'origam/components'
import EditionChip from '~/components/edition/EditionChip.vue'
import IconCheck from '~/components/icons/IconCheck.vue'
import { useT } from '~/composables/useT'
import { EDITION_CHIP_FAMILY } from '~/enums/edition-tab.enum'
import type { IClosingPrerequisitesProps } from '~/interfaces/edition-closing-view.interface'

/*********************************************************
 * Global
 *
 * @description
 * « Avant de clôturer » : les conditions en lignes cochées (« oui » teinté succès, « non » teinté alerte), puis champion·ne, finaliste et nombre de
 * participants. La finale validée est la seule condition que le serveur exige (409 `FINAL_NOT_VALIDATED`) ; « tous les matchs validés » est une information.
 ********************************************************/
const { t } = useT()
const props = withDefaults(defineProps<IClosingPrerequisitesProps>(), {})
const emits = defineEmits<{}>()
defineSlots<{}>()
const titleId = useId()
const title = computed(() => t('admin.closing.prerequisites_title', 'Avant de clôturer'))
const yes = computed(() => t('admin.closing.prerequisite_yes', 'oui'))
const no = computed(() => t('admin.closing.prerequisite_no', 'non'))
const noPlayer = computed(() => t('admin.closing.fact_none', '—'))
const items = computed(() => props.prerequisites.map(item => ({
  id: item.id,
  label: t(item.label.key, item.label.fallback),
  met: item.met,
  chip: item.met ? yes.value : no.value,
  family: item.met ? EDITION_CHIP_FAMILY.TINTED_SUCCESS : EDITION_CHIP_FAMILY.TINTED_WARNING
})))
const facts = computed(() => [
  { key: t('admin.closing.fact_champion', 'Champion·ne'), value: props.champion?.displayName ?? noPlayer.value },
  { key: t('admin.closing.fact_finalist', 'Finaliste'), value: props.finalist?.displayName ?? noPlayer.value },
  { key: t('admin.closing.fact_participants', 'Participants'), value: String(props.participantCount) }
])

/*********************************************************
 * Expose
 *
 * @description
 * Rien à piloter depuis l'extérieur.
 ********************************************************/
defineExpose({})
</script>

<style scoped lang="scss">
.closing-prerequisites {
  padding: var(--closing-prerequisites---padding, var(--origam-space---6));

  @media (max-width: 760px) {
    padding: var(--origam-space---5);
  }

  &__head {
    margin-bottom: var(--origam-space---4);
  }

  &__title {
    margin: 0;
    font-size: var(--origam-font__size---xl);
    font-weight: var(--origam-font__weight---bold);
    line-height: var(--origam-font__lineHeight---tight);
  }

  &__list {
    display: grid;
    gap: var(--origam-space---2);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  &__item {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: var(--origam-space---3);
    min-height: var(--origam-space---11);
    padding-inline: var(--origam-space---3);
    border-radius: var(--origam-radius---lg);
    background: var(--origam-color__surface---sunken);
  }

  &__mark {
    display: grid;
    place-items: center;
    width: var(--origam-space---6);
    aspect-ratio: 1;
    border-radius: var(--origam-radius---full);
    background: var(--origam-color__surface---overlay);

    &--met {
      background: var(--origam-color__feedback--success---bgSubtle);
      color: var(--origam-color__feedback--success---fgSubtle);
    }
  }

  &__facts {
    --origam-data-list---padding: 0;
    --origam-data-list__kv---display: grid;
    --origam-data-list__kv---key-font-size: var(--origam-font__size---xs);
    --origam-data-list__kv---key-font-weight: var(--origam-font__weight---bold);
    --origam-data-list__kv---key-color: var(--origam-color__text---secondary);

    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--origam-space---3);
    margin: var(--origam-space---4) 0 0;

    @media (max-width: 1000px) {
      grid-template-columns: minmax(0, 1fr);
    }
  }

  &__facts :deep(.origam-data-list__kv-row) {
    grid-template-columns: 1fr;
    row-gap: 0;
    border-bottom: 0;
    padding: 0;
  }

  &__facts :deep(.origam-data-list__kv-key) {
    text-transform: uppercase;
    letter-spacing: var(--origam-font__letterSpacing---wider);
  }

  &__facts :deep(.origam-data-list__kv-value) {
    font-weight: var(--origam-font__weight---bold);
  }
}
</style>

<style>
:root {
  --closing-prerequisites---padding: var(--origam-space---6);
}
</style>

<template>
  <section
    class="edition-participants"
    aria-labelledby="edition-participants-title"
    data-cy="edition-participants"
  >
    <h2
      id="edition-participants-title"
      class="sr-only"
    >
      {{ title }}
    </h2>
    <async-state
      :empty="isEmpty"
      :empty-title="emptyTitle"
      :empty-description="emptyDescription"
    >
      <template #default>
        <ul class="edition-participants__list">
          <li
            v-for="row in rows"
            :key="row.participationId"
            class="edition-participants__item"
            :data-cy="row.dataCy"
          >
            <origam-avatar
              :text="row.initials"
              :image="row.avatarUrl ?? undefined"
              rounded="full"
              size="40"
              class="edition-participants__avatar"
              aria-hidden="true"
            />
            <span class="edition-participants__name">
              <common-player-link
                :competitor="row.competitor"
                inline
              />
              <small
                v-if="row.pool"
                class="edition-participants__pool"
              >{{ row.pool }}</small>
            </span>
            <edition-chip
              :family="row.family"
              :text="row.result"
            />
          </li>
        </ul>
      </template>
    </async-state>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { OrigamAvatar } from 'origam/components'
import AsyncState from '~/components/common/AsyncState.vue'
import CommonPlayerLink from '~/components/common/PlayerLink.vue'
import EditionChip from '~/components/edition/EditionChip.vue'
import { useT } from '~/composables/useT'
import type { ITranslatableText } from '~/interfaces/common-components.interface'
import type { IEditionParticipantsProps } from '~/interfaces/edition-view.interface'

/*********************************************************
 * Global
 *
 * @description
 * Participants de l'édition, par ordre alphabétique. La liste est du contenu de document : un `<ul>` natif. L'avatar
 * est décoratif (le nom est à côté) : l'image publique si elle existe, sinon les initiales.
 ********************************************************/
const { t } = useT()
const props = withDefaults(defineProps<IEditionParticipantsProps>(), {})
const emits = defineEmits<{}>()
defineSlots<{}>()
const title = computed(() => t('edition.participants_title', 'Participants'))
const isEmpty = computed(() => props.participants.length === 0)
const emptyTitle: ITranslatableText = { key: 'edition.participants_empty_title', fallback: 'Aucun participant' }
const emptyDescription: ITranslatableText = { key: 'edition.participants_empty_text', fallback: 'Les participants de cette édition ne sont pas encore connus.' }
const rows = computed(() => props.participants.map(participant => ({
  participationId: participant.participationId,
  dataCy: `edition-participant-${participant.competitor.id}`,
  competitor: participant.competitor,
  avatarUrl: participant.avatarUrl,
  initials: participant.initials,
  pool: participant.poolRank === null ? '' : t('edition.participants_pool', 'Poule {rank}', { rank: participant.poolRank }),
  result: t(participant.result.key, participant.result.fallback),
  family: participant.family
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
.edition-participants {
  &__list {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--edition-participants---gap, var(--origam-space---2));
    margin: 0;
    padding: 0;
    list-style: none;
  }

  &__item {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: var(--origam-space---3);
    padding: var(--origam-space---3) var(--origam-space---4);
    border: var(--origam-border__width---thin) solid var(--origam-color__border---subtle);
    border-radius: var(--origam-radius---lg);
    background: var(--origam-color__surface---raised);
  }

  &__avatar {
    --origam-avatar---background-color: var(--origam-color__surface---overlay);
    --origam-avatar---color: var(--origam-color__text---primary);
    --origam-avatar---font-size: var(--origam-font__size---sm);
    --origam-avatar---font-weight: var(--origam-font__weight---bold);
    --origam-avatar---box-shadow: inset 0 0 0 var(--origam-border__width---2) var(--origam-color__border---default);

    flex: none;
  }

  &__name {
    display: grid;
    justify-items: start;
    font-weight: var(--origam-font__weight---semibold);
  }

  &__pool {
    font-size: var(--origam-font__size---xs);
    font-weight: var(--origam-font__weight---regular);
    color: var(--origam-color__text---secondary);
  }
}

@media (max-width: 1100px) {
  .edition-participants__list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .edition-participants__list {
    grid-template-columns: 1fr;
  }
}
</style>

<style>
:root {
  --edition-participants---gap: var(--origam-space---2);
}
</style>

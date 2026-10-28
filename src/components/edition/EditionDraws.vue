<template>
  <section
    class="edition-draws"
    aria-labelledby="edition-draws-title"
    data-cy="edition-draws"
  >
    <h2
      id="edition-draws-title"
      class="sr-only"
    >
      {{ title }}
    </h2>
    <div class="edition-draws__layout">
      <origam-card
        tag="article"
        rounded="xl"
        border
        elevation="md"
        padding="6"
        aria-labelledby="edition-draws-pools-title"
        class="edition-draws__pools"
        data-cy="edition-draws-pools"
      >
        <header class="edition-draws__head">
          <h3
            id="edition-draws-pools-title"
            class="edition-draws__title"
          >
            {{ poolsTitle }}
          </h3>
          <edition-chip
            v-if="poolsStatusRow"
            :family="poolsStatusRow.family"
            :text="poolsStatusRow.text"
          />
        </header>
        <p
          v-if="!noSeeds"
          class="edition-draws__note"
        >
          {{ poolsNote }}
        </p>
        <async-state
          :empty="noSeeds"
          :empty-title="noSeedsTitle"
          :empty-description="noSeedsText"
        >
          <template #default>
            <ol class="edition-draws__seeds">
              <li
                v-for="seed in seedRows"
                :key="seed.participationId"
                class="edition-draws__seed"
                :data-cy="seed.dataCy"
              >
                <edition-chip
                  :family="seedFamily"
                  :text="seed.pool"
                />
                <common-player-link
                  :competitor="seed.competitor"
                  inline
                />
              </li>
            </ol>
          </template>
        </async-state>
      </origam-card>
      <div class="edition-draws__rounds">
        <h3 class="edition-draws__title">
          {{ roundsTitle }}
        </h3>
        <p class="edition-draws__note">
          {{ roundsNote }}
        </p>
        <async-state
          :empty="noRounds"
          :empty-title="noRoundsTitle"
          :empty-description="noRoundsText"
        >
          <template #default>
            <div class="edition-draws__grid">
              <origam-card
                v-for="draw in drawRows"
                :key="draw.id"
                tag="article"
                rounded="xl"
                border
                elevation="md"
                padding="5"
                class="edition-draws__draw"
                :data-cy="draw.dataCy"
              >
                <header class="edition-draws__head">
                  <h4 class="edition-draws__draw-title">
                    {{ draw.title }}
                  </h4>
                  <edition-chip
                    :family="draw.family"
                    :text="draw.status"
                  />
                </header>
                <ol class="edition-draws__pairings">
                  <li
                    v-for="pairing in draw.pairings"
                    :key="pairing.index"
                    class="edition-draws__pairing"
                  >
                    <template
                      v-for="(person, position) in pairing.sides"
                      :key="person.id"
                    >
                      <i
                        v-if="position > 0"
                        class="edition-draws__versus"
                      >{{ versus }}</i>
                      <common-player-link
                        :competitor="person"
                        inline
                      />
                    </template>
                  </li>
                </ol>
              </origam-card>
            </div>
          </template>
        </async-state>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { OrigamCard } from 'origam/components'
import AsyncState from '~/components/common/AsyncState.vue'
import CommonPlayerLink from '~/components/common/PlayerLink.vue'
import EditionChip from '~/components/edition/EditionChip.vue'
import { useT } from '~/composables/useT'
import { EDITION_DRAW_STATUS_VIEW } from '~/consts/edition-view.const'
import { ROUND_LABELS } from '~/consts/round-labels.const'
import { EDITION_CHIP_FAMILY } from '~/enums/edition-tab.enum'
import type { ITranslatableText } from '~/interfaces/common-components.interface'
import type { IEditionDrawsProps } from '~/interfaces/edition-view.interface'

/*********************************************************
 * Global
 *
 * @description
 * Tirages : têtes de série et tirage des poules (RG9, RG11, RG12), puis un tirage par tour de la phase finale (RG13).
 * Listes ordonnées natives (contenu de document). Les titres à date des joueurs ne sont pas exposés par le DTO des
 * tirages : aucune étoile n'est affichée ici.
 ********************************************************/
const { t } = useT()
const props = withDefaults(defineProps<IEditionDrawsProps>(), {})
const emits = defineEmits<{}>()
defineSlots<{}>()
const seedFamily = EDITION_CHIP_FAMILY.FULL_SECONDARY
const title = computed(() => t('edition.draws_title', 'Tirages'))
const poolsTitle = computed(() => t('edition.draws_pools_title', 'Tirage des poules'))
const poolsNote = computed(() => t('edition.draws_pools_note', 'Têtes de série = les {count} meilleurs au classement ACP (RG9), une par poule ; les autres joueurs tirés poule après poule (RG11), par une main innocente (RG12).', { count: props.seeds.length }))
const roundsTitle = computed(() => t('edition.draws_rounds_title', 'Tirages de la phase finale'))
const roundsNote = computed(() => t('edition.draws_rounds_note', 'Rejoué à chaque tour sur les seuls qualifiés (RG13).'))
const versus = computed(() => t('edition.draws_versus', 'vs'))
const noSeeds = computed(() => props.seeds.length === 0)
const noRounds = computed(() => props.roundDraws.length === 0)
const noSeedsTitle: ITranslatableText = { key: 'edition.draws_seeds_empty_title', fallback: 'Aucune tête de série' }
const noSeedsText: ITranslatableText = { key: 'edition.draws_seeds_empty_text', fallback: 'Le tirage des poules n’a pas encore eu lieu.' }
const noRoundsTitle: ITranslatableText = { key: 'edition.draws_rounds_empty_title', fallback: 'Tour non encore tiré' }
const noRoundsText: ITranslatableText = { key: 'edition.draws_rounds_empty_text', fallback: 'Les affiches de chaque tour sont tirées au début du tour, parmi les seuls qualifiés (RG13).' }
const poolsStatusRow = computed(() => {
  if (!props.poolsStatus) {
    return null
  }
  const view = EDITION_DRAW_STATUS_VIEW[props.poolsStatus]
  return { family: view.family, text: t(view.pools.key, view.pools.fallback) }
})
const seedRows = computed(() => props.seeds.map(seed => ({
  participationId: seed.participationId,
  dataCy: `edition-seed-${seed.poolRank}`,
  competitor: seed.competitor,
  pool: t('edition.draws_pool_label', 'Poule {rank}', { rank: seed.poolRank })
})))
const drawRows = computed(() => props.roundDraws.map((draw) => {
  const view = EDITION_DRAW_STATUS_VIEW[draw.status]
  return {
    id: draw.id,
    dataCy: `edition-draw-${draw.roundKind.toLowerCase().replaceAll('_', '-')}`,
    title: t(ROUND_LABELS[draw.roundKind].key, ROUND_LABELS[draw.roundKind].label),
    family: view.family,
    status: t(view.round.key, view.round.fallback),
    pairings: draw.pairings
  }
}))

/*********************************************************
 * Expose
 *
 * @description
 * Rien à piloter depuis l'extérieur.
 ********************************************************/
defineExpose({})
</script>

<style scoped lang="scss">
.edition-draws {
  &__layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.6fr);
    gap: var(--edition-draws---gap, var(--origam-space---5));
    align-items: start;
  }

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--origam-space---3);
  }

  &__title {
    margin: 0;
    font-size: var(--origam-font__size---xl);
    font-weight: var(--origam-font__weight---bold);
    line-height: var(--origam-font__lineHeight---tight);
  }

  &__draw-title {
    margin: 0;
    font-size: var(--origam-font__size---xl);
    font-weight: var(--origam-font__weight---bold);
    line-height: var(--origam-font__lineHeight---tight);
  }

  &__note {
    margin: var(--origam-space---2) 0 0;
    font-size: var(--origam-font__size---sm);
    color: var(--origam-color__text---secondary);
  }

  &__seeds {
    display: grid;
    gap: var(--origam-space---2);
    margin: var(--origam-space---5) 0 0;
    padding: 0;
    list-style: none;
  }

  &__seed {
    display: flex;
    align-items: center;
    gap: var(--origam-space---3);
    padding: var(--origam-space---2) var(--origam-space---3);
    border-radius: var(--origam-radius---lg);
    background: var(--origam-color__surface---sunken);
    font-weight: var(--origam-font__weight---semibold);
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--origam-space---3);
    margin-top: var(--origam-space---4);
  }

  &__pairings {
    display: grid;
    gap: var(--origam-space---1);
    margin: var(--origam-space---3) 0 0;
    padding: 0;
    list-style: none;
    font-size: var(--origam-font__size---sm);
  }

  &__pairing {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: var(--origam-space---2);
  }

  &__versus {
    font-style: normal;
    font-weight: var(--origam-font__weight---bold);
    font-size: var(--origam-font__size---xs);
    color: var(--origam-color__action--secondary---fgSubtle);
  }
}

@media (max-width: 1100px) {
  .edition-draws__layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .edition-draws__pools {
    padding: var(--origam-space---5);
  }

  .edition-draws__grid {
    grid-template-columns: 1fr;
  }
}
</style>

<style>
:root {
  --edition-draws---gap: var(--origam-space---5);
}
</style>

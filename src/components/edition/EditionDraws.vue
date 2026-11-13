<template>
  <section
    class="edition-draws"
    aria-labelledby="edition-draws-title"
    data-cy="edition-draws"
  >
    <origam-title
      id="edition-draws-title"
      tag="h2"
      class="sr-only"
      :text="title"
    />
    <template v-if="reconstituted">
      <origam-alert
        status="info"
        density="compact"
        rounded="lg"
        font-size="md"
        font-weight="bold"
        letter-spacing="normal"
        line-height="normal"
        class="edition-draws__alert"
        :title="recAlertTitle"
        :text="recAlertText"
        data-cy="edition-draws-reconstituted"
      />
      <div
        class="edition-draws__layout"
        :class="{ 'edition-draws__layout--single': !hasRecPools }"
      >
        <origam-card
          v-if="hasRecPools"
          tag="article"
          rounded="xl"
          border
          elevation="md"
          padding="6"
          aria-labelledby="edition-draws-rec-pools-title"
          class="edition-draws__pools"
          data-cy="edition-draws-rec-pools"
        >
          <header class="edition-draws__head">
            <origam-title
              id="edition-draws-rec-pools-title"
              tag="h3"
              class="edition-draws__title"
              font-size="xl"
              font-weight="bold"
              line-height="tight"
              letter-spacing="normal"
              :text="recPoolsTitle"
            />
            <edition-chip
              :family="recChipFamily"
              :text="recChip"
            />
          </header>
          <p class="edition-draws__note">
            {{ recPoolsNote }}
          </p>
          <div class="edition-draws__rec-pools">
            <section
              v-for="pool in recPools"
              :key="pool.id"
              class="edition-draws__rec-pool"
              :aria-labelledby="pool.titleId"
              :data-cy="pool.dataCy"
            >
              <origam-title
                :id="pool.titleId"
                tag="h4"
                class="edition-draws__rec-pool-title"
                font-weight="bold"
                letter-spacing="normal"
                line-height="normal"
              >
                <template #default>
                  <edition-chip
                    :family="seedFamily"
                    :text="pool.label"
                  />
                </template>
              </origam-title>
              <ul class="edition-draws__rec-pool-list">
                <li
                  v-for="player in pool.players"
                  :key="player.id"
                >
                  <common-player-link
                    :competitor="player"
                    inline
                  />
                </li>
              </ul>
            </section>
          </div>
        </origam-card>
        <div class="edition-draws__rounds">
          <origam-title
            tag="h3"
            class="edition-draws__title"
            font-size="xl"
            font-weight="bold"
            line-height="tight"
            letter-spacing="normal"
            :text="recRoundsTitle"
          />
          <p class="edition-draws__note">
            {{ recRoundsNote }}
          </p>
          <div class="edition-draws__grid">
            <origam-card
              v-for="round in recRounds"
              :key="round.kind"
              tag="article"
              rounded="xl"
              border
              elevation="md"
              padding="5"
              class="edition-draws__draw"
              :data-cy="round.dataCy"
            >
              <header class="edition-draws__head">
                <origam-title
                  tag="h4"
                  class="edition-draws__draw-title"
                  font-size="xl"
                  font-weight="bold"
                  line-height="tight"
                  letter-spacing="normal"
                  :text="round.title"
                />
                <edition-chip
                  :family="recChipFamily"
                  :text="recChip"
                />
              </header>
              <ol class="edition-draws__pairings">
                <li
                  v-for="pairing in round.pairings"
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
        </div>
      </div>
    </template>
    <div
      v-else
      class="edition-draws__layout"
    >
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
          <origam-title
            id="edition-draws-pools-title"
            tag="h3"
            class="edition-draws__title"
            font-size="xl"
            font-weight="bold"
            line-height="tight"
            letter-spacing="normal"
            :text="poolsTitle"
          />
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
        <origam-title
          tag="h3"
          class="edition-draws__title"
          font-size="xl"
          font-weight="bold"
          line-height="tight"
          letter-spacing="normal"
          :text="roundsTitle"
        />
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
                  <origam-title
                    tag="h4"
                    class="edition-draws__draw-title"
                    font-size="xl"
                    font-weight="bold"
                    line-height="tight"
                    letter-spacing="normal"
                    :text="draw.title"
                  />
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
import { OrigamAlert, OrigamCard, OrigamTitle } from 'origam/components'
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
 * Édition clôturée sans tirage enregistré (F-35, DRAWS-ARCH) : `reconstituted` porte la composition des poules et les affiches de
 * chaque tour, déduites des poules et des matchs. Les listes de joueurs d'une poule sont des `ul` natifs (décision « listes statiques natives »
 * : le mapping de la maquette dit `origam-list`, qui pose `tabindex="0"` sur une liste non sélectionnable).
 * Listes ordonnées natives (contenu de document). Les titres à date des joueurs ne sont pas exposés par le DTO des
 * tirages : aucune étoile n'est affichée ici.
 ********************************************************/
const { t } = useT()
const props = withDefaults(defineProps<IEditionDrawsProps>(), { reconstituted: null })
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
const recChipFamily = EDITION_CHIP_FAMILY.NEUTRAL
const hasRecPools = computed(() => (props.reconstituted?.pools.length ?? 0) > 0)
const recAlertTitle = computed(() => t('edition.draws_rec_alert_title', 'Tirages reconstitués à partir des résultats'))
const recAlertText = computed(() => t('edition.draws_rec_alert_text', 'Les tirages de cette édition n’ont pas été archivés. La composition des poules et les affiches de chaque tour sont déduites des poules et des matchs joués.'))
const recPoolsTitle = computed(() => t('edition.draws_rec_pools_title', 'Composition des poules'))
const recPoolsNote = computed(() => t('edition.draws_rec_pools_note', 'Têtes de série non archivées. Joueurs par ordre alphabétique : l’ordre du tirage n’est pas connu.'))
const recRoundsTitle = computed(() => t('edition.draws_rec_rounds_title', 'Affiches de la phase finale'))
const recRoundsNote = computed(() => t('edition.draws_rec_rounds_note', 'Déduites des matchs de chaque tour. Les scores sont dans les onglets Bracket et Matchs.'))
const recChip = computed(() => t('edition.draws_rec_chip', 'Reconstitué'))
const recPools = computed(() => (props.reconstituted?.pools ?? []).map(pool => ({
  id: pool.id,
  titleId: `edition-draws-rec-pool-${pool.rank}-title`,
  dataCy: `edition-rec-pool-${pool.rank}`,
  label: t('edition.draws_pool_label', 'Poule {rank}', { rank: pool.rank }),
  players: pool.players
})))
const recRounds = computed(() => (props.reconstituted?.rounds ?? []).map(round => ({
  kind: round.kind,
  dataCy: `edition-rec-draw-${round.kind.toLowerCase().replaceAll('_', '-')}`,
  title: t(ROUND_LABELS[round.kind].key, ROUND_LABELS[round.kind].label),
  pairings: round.pairings
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

  &__layout--single {
    grid-template-columns: minmax(0, 1fr);
  }

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--origam-space---3);

    > .edition-chip {
      flex: none;
    }
  }

  &__alert {
    margin-bottom: var(--origam-space---5);
  }

  &__rec-pools {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(9rem, 1fr));
    gap: var(--origam-space---4);
    margin-top: var(--origam-space---5);
  }

  &__rec-pool {
    display: grid;
    align-content: start;
    gap: var(--origam-space---2);
    padding: var(--origam-space---3);
    border-radius: var(--origam-radius---lg);
    background: var(--origam-color__surface---sunken);
  }

  &__rec-pool-title {
    margin: 0;
    font-size: inherit;

    :deep(.edition-chip) {
      vertical-align: baseline;
    }
  }

  &__rec-pool-list {
    display: grid;
    gap: var(--origam-space---1);
    margin: 0;
    padding: 0;
    list-style: none;
    font-size: var(--origam-font__size---sm);
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
    // WCAG 2.5.8 (axe target-size) : des liens de 19,84 px de haut, espacés de 4 px, ont un pas de 23,84 px, sous les 24 px requis entre deux cibles trop petites.
    gap: calc(var(--origam-space---1) + 1px);
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

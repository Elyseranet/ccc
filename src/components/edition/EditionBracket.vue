<template>
  <section
    class="edition-bracket"
    aria-labelledby="edition-bracket-title"
    data-cy="edition-bracket"
  >
    <h2
      id="edition-bracket-title"
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
        <div
          class="edition-bracket__region"
          role="region"
          :aria-label="regionLabel"
          tabindex="0"
          data-cy="edition-bracket-region"
        >
          <div
            class="edition-bracket__columns"
            :style="columnsStyle"
          >
            <section
              v-for="round in roundViews"
              :key="round.kind"
              class="edition-bracket__column"
              :class="{ 'edition-bracket__column--final': round.isFinal }"
              :aria-labelledby="round.titleId"
              :data-cy="round.dataCy"
            >
              <h3
                :id="round.titleId"
                class="edition-bracket__title"
              >
                {{ round.title }}
              </h3>
              <ol class="edition-bracket__list">
                <li
                  v-for="match in round.matches"
                  :key="match.id"
                  class="edition-bracket__match"
                >
                  <div
                    v-for="side in match.sides"
                    :key="side.participationId"
                    class="edition-bracket__side"
                    :class="{ 'edition-bracket__side--win': side.isWinner }"
                  >
                    <span class="edition-bracket__name">
                      <common-player-link
                        :competitor="side.competitor"
                        inline
                      />
                      <span
                        v-if="side.isWinner"
                        class="sr-only"
                      >{{ winnerLabel }}</span>
                    </span>
                    <b class="edition-bracket__score">{{ side.score ?? '' }}</b>
                  </div>
                </li>
              </ol>
            </section>
          </div>
        </div>
        <p class="edition-bracket__note">
          {{ note }}
        </p>
        <details
          class="edition-bracket__details"
          data-cy="edition-bracket-list"
        >
          <summary class="edition-bracket__summary">
            {{ listSummary }}
          </summary>
          <section
            v-for="round in listRounds"
            :key="round.kind"
            class="edition-bracket__round"
            :aria-labelledby="round.titleId"
          >
            <h3
              :id="round.titleId"
              class="edition-bracket__round-title"
            >
              {{ round.title }}
            </h3>
            <ol class="edition-bracket__matches">
              <li
                v-for="match in round.matches"
                :key="match.id"
              >
                {{ match.text }}
              </li>
            </ol>
          </section>
        </details>
      </template>
    </async-state>
  </section>
</template>

<script setup lang="ts">
import { computed, useId } from 'vue'
import AsyncState from '~/components/common/AsyncState.vue'
import CommonPlayerLink from '~/components/common/PlayerLink.vue'
import { useT } from '~/composables/useT'
import { ROUND_KIND } from '~/enums/round.enum'
import { ROUND_LABELS } from '~/consts/round-labels.const'
import type { ITranslatableText } from '~/interfaces/common-components.interface'
import type { IEditionBracketProps } from '~/interfaces/edition-view.interface'

/*********************************************************
 * Global
 *
 * @description
 * Tableau de la phase finale. Les affiches sont tirées à chaque tour (RG13) : aucun trait de liaison entre les colonnes, et
 * seuls les tours publiés par l'API sont montrés (B-18), jamais un tour vide inventé. Rendu natif : `origam-bracket` dessine un
 * arbre à connecteurs et ne montre ni lien vers la fiche d'un joueur ni le score dans son slot `competitor` (mesuré sur
 * l'édition 2025). Le tableau défile horizontalement dans une région focalisable et nommée ; l'alternative en liste (`<details>`)
 * donne les mêmes affiches en texte. Le vainqueur n'est pas porté par la couleur seule : il est en gras et annoncé.
 ********************************************************/
const { t } = useT()
const props = withDefaults(defineProps<IEditionBracketProps>(), {})
const emits = defineEmits<{}>()
defineSlots<{}>()
const baseId = useId()
const title = computed(() => t('edition.bracket_title', 'Tableau'))
const regionLabel = computed(() => t('edition.bracket_region', 'Tableau à élimination directe, défilement horizontal'))
const note = computed(() => t('edition.bracket_note', 'Phase finale en deux bières : le vainqueur marque 10 (RG21-RG22). Les affiches sont tirées au début de chaque tour (RG13).'))
const listSummary = computed(() => t('edition.bracket_list_summary', 'Afficher le tableau en liste'))
const winnerLabel = computed(() => t('edition.bracket_winner', 'Vainqueur'))
const isEmpty = computed(() => props.rounds.length === 0)
const emptyTitle: ITranslatableText = { key: 'edition.bracket_empty_title', fallback: 'Aucun tour tiré' }
const emptyDescription: ITranslatableText = { key: 'edition.bracket_empty_text', fallback: 'Les affiches de chaque tour sont tirées au début du tour (RG13) : le tableau s’affiche tour après tour.' }
const columnsStyle = computed(() => ({ '--edition-bracket---columns': props.rounds.length }))
const roundTitle = (kind: IEditionBracketProps['rounds'][number]['kind']): string => t(ROUND_LABELS[kind].key, ROUND_LABELS[kind].label)
const roundViews = computed(() => props.rounds.map(round => ({
  kind: round.kind,
  isFinal: round.kind === ROUND_KIND.FINAL,
  titleId: `${baseId}-col-${round.kind}`,
  dataCy: `edition-bracket-${round.kind.toLowerCase().replaceAll('_', '-')}`,
  title: roundTitle(round.kind),
  matches: round.matches
})))
const listRounds = computed(() => props.rounds.map(round => ({
  kind: round.kind,
  titleId: `${baseId}-list-${round.kind}`,
  title: roundTitle(round.kind),
  matches: round.matches.map(match => ({
    id: match.id,
    text: match.sides.map(side => side.score === null ? side.competitor.displayName : `${side.competitor.displayName} ${side.score}`).join(t('edition.bracket_versus', ' contre '))
  }))
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
.edition-bracket {
  $this: &;

  &__region {
    overflow-x: auto;
    padding: var(--origam-space---5);
    border: var(--origam-border__width---thin) solid var(--origam-color__border---default);
    border-radius: var(--origam-radius---xl);
    background: var(--origam-color__surface---raised);
  }

  &__columns {
    display: grid;
    grid-template-columns: repeat(var(--edition-bracket---columns, 4), minmax(13rem, 1fr));
    gap: var(--edition-bracket---gap, var(--origam-space---8));
    min-width: var(--edition-bracket---min-width, 60rem);
  }

  &__column {
    display: grid;
    grid-template-rows: auto 1fr;
    gap: var(--origam-space---3);
  }

  &__title {
    margin: 0;
    font-size: var(--origam-font__size---xs);
    font-weight: var(--origam-font__weight---bold);
    letter-spacing: var(--origam-font__letterSpacing---wider);
    text-transform: uppercase;
    color: var(--origam-color__text---tertiary);
  }

  &__list {
    display: flex;
    flex-direction: column;
    justify-content: space-around;
    gap: var(--origam-space---3);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  &__match {
    position: relative;
    border: var(--origam-border__width---thin) solid var(--origam-color__border---default);
    border-radius: var(--origam-radius---md);
    background: var(--origam-color__surface---sunken);
  }

  &__column--final &__match {
    border-color: var(--origam-color__bar---amber);
    box-shadow: var(--origam-shadow---lg);
  }

  &__side {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: var(--origam-space---2);
    align-items: center;
    min-height: var(--origam-space---10);
    padding-inline: var(--origam-space---3);
    font-size: var(--origam-font__size---sm);
    color: var(--origam-color__text---secondary);

    & + & {
      border-top: var(--origam-border__width---thin) solid var(--origam-color__border---subtle);
    }

    &--win {
      color: var(--origam-color__text---primary);
      font-weight: var(--origam-font__weight---bold);
      background: var(--origam-color__action--primary---bgSubtle);
    }
  }

  &__name {
    display: inline-flex;
    align-items: center;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__score {
    font-variant-numeric: tabular-nums;
  }

  &__side--win #{$this}__score {
    color: var(--origam-color__bar---amber);
  }

  &__note {
    margin: var(--origam-space---4) 0 0;
    font-size: var(--origam-font__size---sm);
    color: var(--origam-color__text---secondary);
  }

  &__details {
    margin-top: var(--origam-space---4);
  }

  &__summary {
    cursor: pointer;
    font-weight: var(--origam-font__weight---semibold);
  }

  &__round-title {
    margin: var(--origam-space---3) 0 var(--origam-space---1);
    font-size: var(--origam-font__size---md);
  }

  &__matches {
    margin: 0;
    padding-left: var(--origam-space---5);
  }
}
</style>

<style>
:root {
  --edition-bracket---gap: var(--origam-space---8);
  --edition-bracket---min-width: 60rem;
}
</style>

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
        <origam-bracket
          class="edition-bracket__region"
          :rounds="bracketRounds"
          :aria-label="regionLabel"
          tabindex="0"
          data-cy="edition-bracket-region"
        >
          <template #connector>
            <g />
          </template>
          <template #competitor="{ competitor, isWinner, match, side }">
            <div
              v-if="competitor"
              class="edition-bracket__side"
              :class="{ 'edition-bracket__side--win': isWinner }"
            >
              <span class="edition-bracket__name">
                <common-player-link
                  :competitor="{ id: String(competitor.id), displayName: competitor.name }"
                  inline
                />
                <span
                  v-if="isWinner"
                  class="sr-only"
                >{{ winnerLabel }}</span>
              </span>
              <b
                v-if="isUnscored(match)"
                class="edition-bracket__score"
                :title="noScoreLabel"
              >{{ noScoreMark }}<span class="sr-only">{{ noScoreLabel }}</span></b>
              <b
                v-else
                class="edition-bracket__score"
              >{{ scoreOf(match, side) }}</b>
            </div>
          </template>
        </origam-bracket>
        <p class="edition-bracket__note">
          <abbr-text :text="note" />
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
import AbbrText from '~/components/common/AbbrText.vue'
import { computed, useId } from 'vue'
import { OrigamBracket } from 'origam/components'
import AsyncState from '~/components/common/AsyncState.vue'
import CommonPlayerLink from '~/components/common/PlayerLink.vue'
import { useT } from '~/composables/useT'
import { ROUND_KIND } from '~/enums/round.enum'
import { ROUND_LABELS } from '~/consts/round-labels.const'
import type { IBracketMatch } from 'origam/interfaces'
import type { ITranslatableText } from '~/interfaces/common-components.interface'
import type { IEditionBracketMatch, IEditionBracketProps } from '~/interfaces/edition-view.interface'

/*********************************************************
 * Global
 *
 * @description
 * Tableau de la phase finale sur `origam-bracket` (F-03-BRK, décision utilisateur F-03-BRK bis). Les affiches sont tirées à chaque tour (RG13) :
 * aucun trait de liaison (slot `connector` rempli d'un `<g />`, un slot vide laisserait le repli d'Origam, FA-11), et seuls les tours
 * publiés par l'API sont montrés (B-18). Le slot `competitor` porte le lien vers la fiche du joueur et le score. Le tableau défile dans
 * la racine d'Origam, rendue focalisable et nommée ; l'alternative en liste (`<details>`) donne les mêmes affiches en texte. Le vainqueur
 * n'est pas porté par la couleur seule : gras, annonce « Vainqueur » pour les lecteurs d'écran. L'écart à la maquette est accepté
 * (Elyseranet/origam#1282, fiche `docs/tickets/origam/bracket-largeur-hauteur-titre-et-slot-connector.md`) : le thème le réduit.
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
const roundTitle = (kind: IEditionBracketProps['rounds'][number]['kind']): string => t(ROUND_LABELS[kind].key, ROUND_LABELS[kind].label)
const bracketRounds = computed(() => props.rounds.map(round => ({
  id: round.kind,
  title: roundTitle(round.kind),
  matches: round.matches.map((match) => {
    const [first, second] = match.sides
    return {
      id: match.id,
      competitorA: first ? { id: first.competitor.id, name: first.competitor.displayName } : null,
      competitorB: second ? { id: second.competitor.id, name: second.competitor.displayName } : null,
      scoreA: first?.score ?? undefined,
      scoreB: second?.score ?? undefined,
      winnerId: match.sides.find(side => side.isWinner)?.competitor.id ?? null
    }
  })
})))
const unscoredIds = computed(() => new Set(props.rounds.flatMap(round => round.matches.filter(match => match.winnerWithoutScore).map(match => match.id))))
const noScoreLabel = computed(() => t('edition.bracket_score_not_archived', 'score non archivé'))
const noScoreMark = computed(() => t('edition.matches_no_score', '–'))
const isUnscored = (match: IBracketMatch): boolean => unscoredIds.value.has(String(match.id))
const scoreOf = (match: IBracketMatch, side: 'A' | 'B'): number | string => (side === 'A' ? match.scoreA : match.scoreB) ?? ''
const matchText = (match: IEditionBracketMatch): string => match.sides
  .map(side => side.score === null ? side.competitor.displayName : `${side.competitor.displayName} ${side.score}`)
  .join(t('edition.bracket_versus', ' contre '))
const listText = (match: IEditionBracketMatch): string => match.winnerWithoutScore
  ? t('edition.bracket_match_score_not_archived', '{match} (score non archivé)', { match: matchText(match) })
  : matchText(match)
const listRounds = computed(() => props.rounds.map(round => ({
  kind: round.kind,
  titleId: `${baseId}-list-${round.kind}`,
  title: roundTitle(round.kind),
  matches: round.matches.map(match => ({
    id: match.id,
    text: listText(match)
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

  &__side {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: var(--origam-space---2);
    align-items: center;
    min-height: var(--origam-space---10);
    padding-inline: var(--origam-space---3);
    font-size: var(--origam-font__size---sm);
    color: var(--origam-color__text---secondary);

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

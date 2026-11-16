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
          class="edition-bracket__layout"
          :data-rounds="rounds.length"
        >
        <origam-bracket
          class="edition-bracket__region"
          :class="{ 'edition-bracket__region--champion': champion }"
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
        <aside
          v-if="champion"
          class="edition-bracket__champion"
          :aria-labelledby="championTitleId"
          data-cy="edition-bracket-winner"
        >
          <h3
            :id="championTitleId"
            class="edition-bracket__champion-title"
          >
            {{ winnerLabel }}
          </h3>
          <brand-mark class="edition-bracket__logo" />
          <common-player-link
            size="x-large"
            wrap
            :competitor="{ id: String(champion.id), displayName: champion.displayName }"
            inline
          />
        </aside>
        </div>
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
          <p
            v-if="champion"
            class="edition-bracket__round-title"
          >
            {{ winnerListText }}
          </p>
        </details>
      </template>
    </async-state>
  </section>
</template>

<script setup lang="ts">
import AbbrText from '~/components/common/AbbrText.vue'
import { computed, useId } from 'vue'
import { OrigamBracket } from 'origam/components'
import BrandMark from '~/components/common/BrandMark.vue'
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
const championTitleId = `${baseId}-champion`
const title = computed(() => t('edition.bracket_title', 'Tableau'))
const regionLabel = computed(() => t('edition.bracket_region', 'Tableau à élimination directe, défilement horizontal'))
const note = computed(() => t('edition.bracket_note', 'Phase finale en deux bières : le vainqueur marque 10 (RG21-RG22). Les affiches sont tirées au début de chaque tour (RG13).'))
const listSummary = computed(() => t('edition.bracket_list_summary', 'Afficher le tableau en liste'))
const winnerLabel = computed(() => t('edition.bracket_winner', 'Vainqueur'))
const isEmpty = computed(() => props.rounds.length === 0)
const emptyTitle: ITranslatableText = { key: 'edition.bracket_empty_title', fallback: 'Aucun tour tiré' }
const emptyDescription: ITranslatableText = { key: 'edition.bracket_empty_text', fallback: 'Les affiches de chaque tour sont tirées au début du tour (RG13) : le tableau s’affiche tour après tour.' }
const roundTitle = (kind: IEditionBracketProps['rounds'][number]['kind']): string => t(ROUND_LABELS[kind].key, ROUND_LABELS[kind].label)
// Champion : vainqueur de la finale ; la colonne « Vainqueur » n'existe que s'il y en a un (F-57).
const champion = computed(() => props.rounds
  .find(round => round.kind === ROUND_KIND.FINAL)?.matches[0]?.sides.find(side => side.isWinner)?.competitor ?? null)
const winnerListText = computed(() => t('edition.bracket_winner_list', 'Vainqueur : {name}', { name: champion.value?.displayName ?? '' }))
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

  // Bloc « Vainqueur » (F-57), à part du bracket : à droite et étiré sur grand écran, sous le bracket sinon (container query sur la section).
  container-type: inline-size;

  // Ambre sur le champion seul : avec un vainqueur, la finale reprend l'aspect des autres cartes (sans vainqueur, elle garde son ambre).
  &__region--champion {
    --origam-bracket-match--final---border-color: var(--origam-color__border---default);
    --origam-bracket-match--final---box-shadow: none;
  }

  &__layout {
    display: grid;
    gap: var(--origam-space---5);
  }

  &__champion {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--origam-space---4);
    padding: var(--origam-space---8) var(--origam-space---5);
    text-align: center;
    border: 1px solid var(--origam-color__bar---amber);
    border-radius: var(--origam-radius---xl);
    background: var(--origam-color__action--primary---bgSubtle);
    box-shadow: var(--origam-shadow---lg);
  }

  &__champion-title {
    margin: 0;
    font-size: var(--origam-font__size---xs);
    font-weight: var(--origam-font__weight---bold);
    letter-spacing: var(--origam-font__letterSpacing---wider);
    text-transform: uppercase;
    color: var(--origam-color__text---tertiary);
  }

  &__logo {
    --brand-mark---size: var(--origam-space---20);
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

// Le bloc n'est à droite que si le bracket ENTIER (jamais tronqué) et 16 rem de bloc tiennent dans la section. Largeur du bracket Origam
// d'après le thème CCC, mesurée : marges 2 × 1,25 rem, cartes de 15 rem, écart de 3 rem entre tours (`--origam-bracket---round-gap`).
$bracket-padding: 2.5rem;
$round-width: 15rem;
$round-gap: 3rem;
$layout-gap: 1.25rem;
$champion-min: 16rem;

@for $rounds from 1 through 6 {
  @container (min-width: #{$bracket-padding + $round-width * $rounds + $round-gap * ($rounds - 1) + $layout-gap + $champion-min}) {
    .edition-bracket__layout[data-rounds='#{$rounds}'] {
      grid-template-columns: minmax(0, max-content) minmax($champion-min, 1fr);
    }
  }
}
</style>

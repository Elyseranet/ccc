<template>
  <ol
    class="match-queue"
    :aria-label="listLabel"
    data-cy="admin-matches-queue"
  >
    <li
      v-for="card in views"
      :key="card.id"
      class="match-queue__item"
    >
      <origam-card
        tag="article"
        rounded="xl"
        border
        elevation="sm"
        class="match-queue__card"
        :data-cy="card.dataCy"
      >
        <template #default>
          <p class="match-queue__title">
            {{ card.eyebrow }}
          </p>
          <span class="match-queue__chips">
            <edition-chip
              v-if="card.isTiebreak"
              :family="tiebreakFamily"
              :text="tiebreakText"
              data-cy="admin-match-tiebreak"
            />
            <edition-chip
              :family="card.family"
              :text="card.statusText"
            />
          </span>
          <span class="match-queue__name">{{ card.firstName }}</span>
          <span
            class="match-queue__score font-display"
            :aria-label="card.scoreLabel"
          >
            <template v-if="card.hasScore">
              <b>{{ card.firstScore }}</b><i aria-hidden="true">–</i><b>{{ card.secondScore }}</b>
            </template>
            <template v-else>
              <span aria-hidden="true">—</span>
            </template>
          </span>
          <span class="match-queue__name match-queue__name--second">{{ card.secondName }}</span>
          <origam-btn
            v-if="card.actionLabel"
            :variant="card.actionVariant"
            :bg-color="card.actionBgColor"
            :elevation="card.actionElevation"
            :hover="card.actionHover"
            block
            class="match-queue__action"
            :text="card.actionLabel"
            :aria-label="card.actionAriaLabel"
            :data-cy="card.actionDataCy"
            @click="handleAction(card.id, card.action)"
          />
        </template>
      </origam-card>
    </li>
  </ol>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { OrigamBtn, OrigamCard } from 'origam/components'
import EditionChip from '~/components/edition/EditionChip.vue'
import { useT } from '~/composables/useT'
import { MATCH_ACTION_VIEW } from '~/consts/admin-match-status.const'
import { MATCH_ACTION } from '~/enums/match-action.enum'
import { EDITION_CHIP_FAMILY } from '~/enums/edition-tab.enum'
import type { IMatchCard, IMatchQueueEmits, IMatchQueueProps } from '~/interfaces/admin-match-queue.interface'

/*********************************************************
 * Global
 *
 * @description
 * La file de traitement : une carte par match, en grille de deux colonnes en bureau et d'une en mobile (maquette `admin-matchs.html`,
 * mapping.md : pas d'`origam-data-table`). Liste ordonnée native (`<ol>`) : c'est du contenu de document, pas un `listbox` applicatif.
 * Le statut est écrit en toutes lettres (« Saisi · à valider »), jamais porté par la seule couleur. Le nom du bouton nomme les deux
 * joueurs (« Valider Clara Lambert contre Paul Girard »). Le bouton contient son libellé visible : « Valider » / « Saisir ».
 ********************************************************/
const { t } = useT()
const props = withDefaults(defineProps<IMatchQueueProps>(), {})
const emits = defineEmits<IMatchQueueEmits>()
defineSlots<{}>()

/*********************************************************
 * Cartes
 *
 * @description
 * Tous les textes sont calculés ici (clés de traduction), le gabarit ne fait que les afficher.
 ********************************************************/
const listLabel = computed(() => t('admin.matches.list_label', 'Matchs à traiter'))
const tiebreakFamily = EDITION_CHIP_FAMILY.TINTED_INFO
const tiebreakText = computed(() => t('admin.matches.tiebreak_chip', 'Départage'))
const eyebrowOf = (card: IMatchCard, round: string): string => {
  if (!card.isTiebreak) {
    return t('admin.matches.card_eyebrow', '{round} · {number}', { round, number: card.number })
  }
  return card.poolRank === null
    ? t('admin.matches.eyebrow_tiebreak_inter', 'Départage entre poules · {number}', { number: card.number })
    : t('admin.matches.eyebrow_tiebreak_pool', 'Poule {rank} · départage · {number}', { rank: card.poolRank, number: card.number })
}
const views = computed(() => props.cards.map((card) => {
  const action = card.action ? MATCH_ACTION_VIEW[card.action] : null
  const players = { first: card.firstName, second: card.secondName }
  const round = card.poolRank === null
    ? t(card.round.key, card.round.fallback)
    : t('admin.matches.pool_n', 'Poule {rank}', { rank: card.poolRank })
  const hasScore = card.firstScore !== null && card.secondScore !== null
  return {
    ...card,
    dataCy: `admin-match-${card.id}`,
    eyebrow: eyebrowOf(card, round),
    statusText: t(card.statusLabel.key, card.statusLabel.fallback),
    hasScore,
    scoreLabel: hasScore
      ? t('admin.matches.score_label', '{first} {firstScore}, {second} {secondScore}', {
        first: card.firstName,
        firstScore: card.firstScore ?? 0,
        second: card.secondName,
        secondScore: card.secondScore ?? 0
      })
      : t('admin.matches.no_score_label', 'Aucun score'),
    actionLabel: action ? t(action.label.key, action.label.fallback) : null,
    actionAriaLabel: action ? t(action.aria.key, action.aria.fallback, players) : undefined,
    actionVariant: action?.variant,
    actionBgColor: action?.bgColor,
    actionElevation: action?.elevation,
    actionHover: action?.hover,
    actionDataCy: action ? `admin-match-${action.dataCy}-${card.id}` : undefined
  }
}))

/*********************************************************
 * Actions
 *
 * @description
 * « Saisir » ouvre le formulaire ; « Valider » ouvre la confirmation. Le parent décide, ce composant n'écrit rien.
 ********************************************************/
const handleAction = (id: string, action: MATCH_ACTION | null) => {
  if (action === MATCH_ACTION.VALIDATE) {
    emits('validate', id)
  } else {
    emits('enter', id)
  }
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
.match-queue {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--match-queue---gap, var(--origam-space---3));
  margin: 0;
  padding: 0;
  list-style: none;

  @media (max-width: 1000px) {
    grid-template-columns: 1fr;
  }

  &__card {
    height: 100%;

    :deep(.origam-card__content) {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
      grid-template-areas: 't t chip' 'a s b' 'act act act';
      align-items: center;
      gap: var(--match-queue__card---gap, var(--origam-space---3));
      padding: var(--match-queue__card---padding, var(--origam-space---5));
    }
  }

  &__title {
    grid-area: t;
    margin: 0;
    color: var(--origam-color__text---tertiary);
    font-size: var(--origam-font__size---xs);
    font-weight: var(--origam-font__weight---bold);
    letter-spacing: var(--origam-font__letterSpacing---wide);
    text-transform: uppercase;
  }

  &__chips {
    display: flex;
    grid-area: chip;
    gap: var(--match-queue__chips---gap, var(--origam-space---2));
    justify-self: end;
  }

  &__name {
    grid-area: a;
    font-weight: var(--origam-font__weight---bold);

    &--second {
      grid-area: b;
      text-align: end;
    }
  }

  &__score {
    grid-area: s;
    color: var(--origam-color__bar---amber);
    font-size: var(--origam-font__size---2xl);
    font-variant-numeric: tabular-nums;

    i {
      padding-inline: var(--origam-space---1);
      color: var(--origam-color__text---tertiary);
      font-style: normal;
    }

    b {
      font-weight: inherit;
    }
  }

  &__action {
    grid-area: act;
    justify-self: stretch;
    min-height: var(--match-queue__action---min-height, var(--origam-space---11));
  }
}
</style>

<style>
:root {
  --match-queue---gap: var(--origam-space---3);
  --match-queue__chips---gap: var(--origam-space---2);
  --match-queue__card---gap: var(--origam-space---3);
  --match-queue__card---padding: var(--origam-space---5);
  --match-queue__action---min-height: var(--origam-space---11);
}
</style>

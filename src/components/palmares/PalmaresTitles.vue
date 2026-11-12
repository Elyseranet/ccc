<template>
  <section
    class="palmares-titles"
    aria-labelledby="palmares-titles-title"
    data-cy="palmares-titles"
  >
    <div class="palmares-titles__head">
      <h2
        id="palmares-titles-title"
        class="palmares-titles__title font-display neon--sm"
      >
        {{ title }}
      </h2>
      <p class="palmares-titles__note">
        {{ note }}
      </p>
    </div>
    <ol class="palmares-titles__list">
      <li
        v-for="entry in entries"
        :key="entry.code"
        class="palmares-titles__item"
        :data-cy="entry.dataCy"
      >
        <origam-card
          rounded="lg"
          border
          elevation="none"
          padding="5"
          class="palmares-titles__card"
          :class="{ 'palmares-titles__card--now': entry.isCurrent }"
        >
          <div class="palmares-titles__body">
            <span class="palmares-titles__edition font-display">{{ entry.label }}</span>
            <template v-if="entry.isCurrent">
              <span class="palmares-titles__who">{{ currentLabel }}</span>
              <origam-btn
                variant="text"
                color="primary"
                font-size="sm"
                :to="entry.to"
                :text="seeEdition"
                class="palmares-titles__link"
              />
            </template>
            <template v-else-if="entry.champion">
              <span class="palmares-titles__who">
                <player-link
                  inline
                  flow
                  wrap
                  :competitor="entry.champion.competitor"
                  :titles="entry.champion.titles"
                />
              </span>
              <span
                v-if="entry.runnerUp"
                class="palmares-titles__final"
              >
                {{ beats }}
                <player-link
                  inline
                  flow
                  wrap
                  :competitor="entry.runnerUp.competitor"
                  :titles="entry.runnerUp.titles"
                />
                <template v-if="entry.scoreText">
                  {{ ' ' }}<b>{{ entry.scoreText }}</b>
                </template>
              </span>
            </template>
            <span
              v-else
              class="palmares-titles__who"
            >{{ noChampion }}</span>
            <span
              v-if="entry.playersText"
              class="palmares-titles__count"
            >{{ entry.playersText }}</span>
          </div>
        </origam-card>
      </li>
    </ol>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { OrigamBtn, OrigamCard } from 'origam/components'
import PlayerLink from '~/components/common/PlayerLink.vue'
import { useT } from '~/composables/useT'
import { ROUTES } from '~/consts/routes.const'
import type { IPalmaresTitlesProps } from '~/interfaces/palmares.interface'

/*********************************************************
 * Global
 *
 * @description
 * Chronologie des titres : une carte par édition, la plus récente d'abord (2012 en compte deux). Une édition sans champion
 * est « en cours » et renvoie vers sa page : aucun champion n'est inventé. Les étoiles sont celles de l'API à la date de
 * l'édition (RG6), jamais recalculées ; le nom et ses étoiles coulent comme du texte (`flow`), comme la maquette. Le score de la finale n'est affiché que si les deux scores sont validés.
 ********************************************************/
const { t } = useT()
const props = withDefaults(defineProps<IPalmaresTitlesProps>(), {})
const emits = defineEmits<{}>()
defineSlots<{}>()
const title = computed(() => t('palmares.titles_title', 'Les titres'))
const note = computed(() => t('palmares.titles_note', 'RG6 · une étoile par titre au classement'))
const currentLabel = computed(() => t('palmares.current_edition', 'Édition en cours'))
const seeEdition = computed(() => t('palmares.see_edition', 'Voir l’édition'))
const beats = computed(() => t('palmares.beats', 'bat'))
const noChampion = computed(() => t('palmares.no_champion', 'Aucun champion enregistré'))
const entries = computed(() => props.titles.map((entry) => {
  const year = t('edition.selector_year', '{year}', { year: entry.option.year })
  const label = entry.option.ordinal
    ? t('edition.selector_with_ordinal', '{year} · {ordinal}', { year: entry.option.year, ordinal: t(entry.option.ordinal.key, entry.option.ordinal.fallback, entry.option.ordinal.params) })
    : year
  return {
    code: entry.option.code,
    dataCy: `palmares-title-${entry.option.code}`,
    label,
    isCurrent: entry.isCurrent,
    to: ROUTES.EDITION.replace(':id', entry.option.code),
    champion: entry.champion,
    runnerUp: entry.runnerUp,
    scoreText: entry.score ? t('palmares.score', '{champion}–{runnerUp}', { champion: entry.score.champion, runnerUp: entry.score.runnerUp }) : '',
    playersText: entry.isCurrent || entry.participantCount === null ? '' : t('palmares.players', '{count} joueurs', { count: entry.participantCount })
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
.palmares-titles {
  &__head {
    display: flex;
    flex-wrap: wrap;
    align-items: end;
    justify-content: space-between;
    gap: var(--origam-space---4);
    margin-bottom: var(--origam-space---8);
  }

  &__title {
    margin: 0;
    font-size: var(--origam-font__size---4xl);
    line-height: var(--origam-font__lineHeight---none);
  }

  &__note {
    margin: 0;
    color: var(--origam-color__text---secondary);
  }

  &__list {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: var(--origam-space---3);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  &__item {
    display: grid;
  }

  &__card {
    background: var(--origam-color__surface---raised);
    border-color: var(--origam-color__border---default);
  }

  &__card--now {
    background: var(--origam-color__action--secondary---bgSubtle);
    border-style: dashed;
  }

  &__body {
    display: grid;
    gap: var(--origam-space---1);
    align-content: start;
  }

  &__edition {
    font-size: var(--origam-font__size---2xl);
    color: var(--origam-color__bar---amber);
    line-height: 1.1;
  }

  &__who {
    font-weight: var(--origam-font__weight---bold);
    font-size: var(--origam-font__size---lg);
  }

  &__final {
    font-size: var(--origam-font__size---sm);
    color: var(--origam-color__text---secondary);

    b {
      color: var(--origam-color__text---primary);
    }
  }

  &__count {
    font-size: var(--origam-font__size---xs);
    color: var(--origam-color__text---tertiary);
  }
}

@media (max-width: 1100px) {
  .palmares-titles__list {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .palmares-titles__list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (prefers-reduced-motion: no-preference) {
  .palmares-titles__card {
    transition: transform var(--origam-motion__duration---medium) var(--origam-motion__easing---standard), border-color var(--origam-motion__duration---medium) var(--origam-motion__easing---standard);

    &:hover {
      transform: translateY(-3px);
      border-color: var(--origam-color__border---strong);
    }
  }
}
</style>

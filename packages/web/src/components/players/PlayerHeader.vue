<template>
  <origam-card
    class="player-header"
    rounded="xl"
    border
    elevation="md"
    data-cy="player-header"
  >
    <template #default>
      <div class="player-header__grid">
        <origam-avatar
          class="player-header__avatar font-display"
          rounded="full"
          aria-hidden="true"
          :text="initials"
          :image="competitor.avatarUrl ?? undefined"
        />
        <div class="player-header__id">
          <p
            v-if="aliasText"
            class="player-header__alias font-display"
            data-cy="player-alias"
          >{{ aliasText }}</p>
          <origam-title
            tag="h1"
            class="player-header__name font-display neon"
            data-cy="page-title"
            :text="competitor.displayName"
          />
          <div class="player-header__meta">
            <origam-chip
              v-if="hasTitles"
              color="primary"
              bg-color="primary"
              data-cy="player-titles"
            >
              <template #default>
                <span
                  class="player-header__stars"
                  aria-hidden="true"
                >{{ stars }}</span>
                {{ titlesLabel }}
              </template>
            </origam-chip>
            <span class="player-header__since">{{ sinceLabel }}</span>
          </div>
        </div>
        <origam-btn
          class="player-header__cta"
          variant="flat"
          bg-color="primary"
          elevation="lg"
          :hover="ctaHover"
          size="x-large"
          font-size="md"
          :to="compareTo"
          data-cy="player-compare"
        >
          <template #default>
            {{ compareLabel }}
            <span
              class="player-header__arrow"
              aria-hidden="true"
            >→</span>
          </template>
        </origam-btn>
      </div>
    </template>
  </origam-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { OrigamAvatar, OrigamBtn, OrigamCard, OrigamChip, OrigamTitle } from 'origam/components'
import { useT } from '~/composables/useT'
import { PLAYERS_CTA_HOVER } from '~/consts/players.const'
import type { IPlayerHeaderProps } from '~/interfaces/players.interface'
import { getInitials } from '~/utils/player.util'

/*********************************************************
 * Global
 *
 * @description
 * En-tête de fiche : identité publique uniquement (jamais d'email ni de téléphone). Sans photo, les initiales.
 * L'avatar est décoratif, le nom est juste à côté. Le nombre de titres est écrit en toutes lettres,
 * les étoiles ne sont qu'un décor (RG6).
 ********************************************************/
const { t } = useT()
const props = withDefaults(defineProps<IPlayerHeaderProps>(), {})
const emits = defineEmits<{}>()
defineSlots<{}>()

/*********************************************************
 * Identité
 *
 * @description
 * Le pseudo s'affiche entre guillemets français, comme dans la maquette.
 ********************************************************/
const initials = computed(() => getInitials(props.competitor.displayName))
const aliasText = computed(() => props.competitor.nickname
  ? t('player.alias', '« {nickname} »', { nickname: props.competitor.nickname })
  : '')

/*********************************************************
 * Titres et ancienneté
 *
 * @description
 * Singulier et pluriel ont chacun leur clé (pas de syntaxe de pluriel dans ce projet).
 ********************************************************/
const hasTitles = computed(() => props.titles > 0)
const stars = computed(() => '*'.repeat(props.titles))
const titlesLabel = computed(() => props.titles === 1
  ? t('player.titles_one', '1 titre')
  : t('player.titles_other', '{count} titres', { count: props.titles }))
const sinceLabel = computed(() => {
  if (props.firstEditionLabel === null) {
    return ''
  }
  return props.participationCount === 1
    ? t('player.since_one', 'Première édition {edition} · 1 participation', { edition: props.firstEditionLabel })
    : t('player.since_other', 'Première édition {edition} · {count} participations', { edition: props.firstEditionLabel, count: props.participationCount })
})
const ctaHover = PLAYERS_CTA_HOVER
const compareLabel = computed(() => t('player.compare', 'Comparer avec…'))

/*********************************************************
 * Expose
 *
 * @description
 * Rien à piloter depuis l'extérieur.
 ********************************************************/
defineExpose({})
</script>

<style scoped lang="scss">
.player-header {
  margin-top: var(--origam-space---6);
  padding: var(--player-header---padding, var(--origam-space---10));
  overflow: hidden;
  background:
    radial-gradient(40rem 22rem at 100% 0%, color-mix(in srgb, var(--origam-color__bar---neon) 28%, transparent), transparent 70%),
    radial-gradient(30rem 20rem at 0% 100%, color-mix(in srgb, var(--origam-color__bar---amber) 18%, transparent), transparent 70%),
    var(--origam-color__surface---raised);

  &__grid {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: end;
    gap: var(--player-header---gap, var(--origam-space---8));
  }

  &__avatar {
    width: var(--player-header__avatar---size, clamp(6rem, 13vw, 10rem));
    height: var(--player-header__avatar---size, clamp(6rem, 13vw, 10rem));
    background: var(--origam-color__bar---amber);
    color: var(--origam-color__surface---default);
    font-size: var(--origam-font__size---4xl);
    box-shadow: var(--origam-shadow---xl);
    rotate: -6deg;
  }

  &__alias {
    margin: 0;
    font-size: var(--origam-font__size---2xl);
    color: var(--origam-color__action--secondary---fgSubtle);
  }

  &__name {
    margin: var(--origam-space---2) 0 0;
    font-size: var(--origam-font__size---4xl);
    line-height: var(--origam-font__lineHeight---none);
  }

  &__meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--origam-space---2) var(--origam-space---4);
    margin-top: var(--origam-space---5);
  }

  &__stars {
    letter-spacing: 0.08em;
    font-weight: var(--origam-font__weight---bold);
  }

  &__arrow {
    margin-inline-start: var(--origam-space---2);
  }

  &__since {
    color: var(--origam-color__text---secondary);
  }

  @media (max-width: 760px) {
    padding: var(--origam-space---6);

    &__grid {
      grid-template-columns: 1fr;
      gap: var(--origam-space---5);
    }

    &__cta {
      justify-self: start;
    }
  }
}
</style>

<style>
:root {
  --player-header---gap: var(--origam-space---8);
  --player-header---padding: var(--origam-space---10);
  --player-header__avatar---size: clamp(6rem, 13vw, 10rem);
}
</style>

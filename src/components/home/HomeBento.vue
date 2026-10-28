<template>
  <div
    class="home-bento"
    data-cy="home-bento"
  >
    <div class="home-bento__head">
      <origam-title
        id="home-bento-title"
        tag="h2"
        font-size="4xl"
        line-height="none"
        class="font-display neon--sm"
        :text="sectionTitle"
      />
      <p class="home-bento__intro">
        {{ introBefore }} <strong>{{ introStrong }}</strong>{{ introAfter }}
      </p>
    </div>
    <div class="home-bento__grid">
      <home-current-edition
        class="home-bento__tile home-bento__tile--now"
        :current="overview.current"
      />
      <origam-card
        :to="ROUTES.EDITIONS"
        rounded="xl"
        border
        elevation="md"
        hover
        class="home-bento__tile home-bento__tile--editions home-bento__stat"
        data-cy="home-tile-editions"
      >
        <template #default>
          <span class="home-bento__number home-bento__number--amber font-display num">{{ archive.editions }}</span>
          <span class="home-bento__label">{{ editionsLabel }}</span>
        </template>
      </origam-card>
      <origam-card
        :to="ROUTES.PLAYERS"
        rounded="xl"
        border
        elevation="md"
        hover
        class="home-bento__tile home-bento__tile--players home-bento__stat"
        data-cy="home-tile-players"
      >
        <template #default>
          <span class="home-bento__number home-bento__number--ice font-display num">{{ archive.competitors }}</span>
          <span class="home-bento__label">{{ playersLabel }}</span>
        </template>
      </origam-card>
      <origam-card
        :to="ROUTES.HALL_OF_FAME"
        rounded="xl"
        border
        elevation="md"
        hover
        class="home-bento__tile home-bento__tile--champion"
        data-cy="home-tile-champion"
      >
        <template #default>
          <span class="home-bento__eyebrow">{{ championEyebrow }}</span>
          <span
            v-if="champion"
            class="home-bento__champion-name font-display neon--sm"
          >{{ champion.competitor.displayName }}</span>
          <span
            v-else
            class="home-bento__label"
          >{{ championNone }}</span>
          <span
            v-if="champion"
            class="home-bento__champion-meta"
          >
            <span v-if="championNickname">{{ championNickname }}</span>
            <span
              class="home-bento__stars"
              aria-hidden="true"
            >{{ championStars }}</span>
            {{ championTitles }}
          </span>
          <svg
            class="home-bento__cap"
            viewBox="0 0 100 100"
            aria-hidden="true"
            focusable="false"
          >
            <polygon
              class="home-bento__cap-body"
              :points="capPoints"
            />
            <circle
              class="home-bento__cap-inner"
              cx="50"
              cy="50"
              r="31"
            />
          </svg>
        </template>
      </origam-card>
      <origam-card
        :to="ROUTES.EDITIONS"
        rounded="xl"
        border
        elevation="md"
        hover
        class="home-bento__tile home-bento__tile--matches home-bento__stat"
        :aria-label="matchesFull"
        data-cy="home-tile-matches"
      >
        <template #default>
          <span class="home-bento__number home-bento__number--secondary font-display num">{{ archive.matches }}</span>
          <span class="home-bento__label">{{ matchesLabel }}</span>
        </template>
      </origam-card>
      <origam-card
        tag="article"
        rounded="xl"
        border
        elevation="md"
        class="home-bento__tile home-bento__tile--rank"
        aria-labelledby="home-rank-title"
        data-cy="home-tile-ranking"
      >
        <template #default>
          <origam-title
            id="home-rank-title"
            tag="h3"
            font-size="xl"
            font-weight="bold"
            line-height="tight"
            :text="rankTitle"
          />
          <p class="home-bento__eyebrow">
            {{ rankEyebrow }}
          </p>
          <ol
            v-if="hasRanking"
            class="home-bento__rank"
          >
            <li
              v-for="entry in ranking"
              :key="entry.competitor.id"
              class="home-bento__rank-row"
              data-cy="home-rank-row"
            >
              <span class="home-bento__rank-number font-display">{{ entry.rank }}</span>
              <player-link
                :competitor="entry.competitor"
                :titles="entry.titles"
              />
              <span class="num">{{ entry.points }}</span>
            </li>
          </ol>
          <p
            v-else
            class="home-bento__none"
            data-cy="home-rank-none"
          >
            {{ rankNone }}
          </p>
          <origam-btn
            :to="ROUTES.HALL_OF_FAME"
            variant="text"
            class="home-bento__more"
            data-cy="home-rank-more"
          >
            <template #default>
              {{ rankMore }} <span aria-hidden="true">{{ arrow }}</span>
            </template>
          </origam-btn>
        </template>
      </origam-card>
      <origam-card
        :to="headToHeadTo"
        bg-color="secondary"
        rounded="xl"
        border
        elevation="md"
        hover
        class="home-bento__tile home-bento__tile--rule"
        data-cy="home-tile-head-to-head"
      >
        <template #default>
          <span class="home-bento__eyebrow">{{ headEyebrow }}</span>
          <span class="home-bento__question font-display">{{ headQuestion }}</span>
          <span class="home-bento__label">{{ headAction }} <span aria-hidden="true">{{ arrow }}</span></span>
        </template>
      </origam-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { OrigamBtn, OrigamCard, OrigamTitle } from 'origam/components'
import PlayerLink from '~/components/common/PlayerLink.vue'
import HomeCurrentEdition from '~/components/home/HomeCurrentEdition.vue'
import { useT } from '~/composables/useT'
import { BRAND_CAP_POINTS } from '~/consts/brand.const'
import { HOME_ACP_WINDOW_EDITIONS, HOME_ARROW_GLYPH, HOME_POINTS_DECIMALS } from '~/consts/home.const'
import { ROUTES } from '~/consts/routes.const'
import type { IHomeBentoProps } from '~/interfaces/home.interface'

/*********************************************************
 * Global
 *
 * @description
 * Bento de l'accueil : édition en cours, compteurs d'archive, champion·ne précédent·e, top 3 ACP et face-à-face.
 * La grille est en `grid-template-areas` ; l'ordre du DOM suit l'ordre de lecture.
 * Les compteurs d'archive viennent UNIQUEMENT de `IArchiveStats` (`GET /stats`) : jamais une somme des `matchCount` d'éditions.
 ********************************************************/
const { t } = useT()
const props = withDefaults(defineProps<IHomeBentoProps>(), {})
const emits = defineEmits<{}>()
defineSlots<{}>()
const arrow = HOME_ARROW_GLYPH
const headToHeadTo = ROUTES.HEAD_TO_HEAD
const capPoints = BRAND_CAP_POINTS
const archive = computed(() => props.overview.archive)
const champion = computed(() => props.overview.champion)

/*********************************************************
 * En-tête de section
 *
 * @description
 * Les résultats affichés sont ceux que l'organisation a validés, mis à jour au rechargement (E-f).
 ********************************************************/
const sectionTitle = computed(() => props.overview.current
  ? t('home.section.title', 'Édition {year}', { year: props.overview.current.year })
  : t('home.section.title_none', 'Les éditions'))
const introBefore = computed(() => t('home.section.intro_before', 'Résultats'))
const introStrong = computed(() => t('home.section.intro_strong', 'validés'))
const introAfter = computed(() => t('home.section.intro_after', ' par l’organisation, mis à jour au rechargement.'))

/*********************************************************
 * Compteurs d'archive
 *
 * @description
 * A16 : le libellé validé est `home.bento.matches_played` ; le nombre est affiché en grand, donc le libellé visible
 * (`matches_detail`) ne le répète pas. Le libellé complet sert de nom accessible à la tuile.
 ********************************************************/
const editionsLabel = computed(() => t('home.bento.editions_since', 'éditions depuis {first_year}', { first_year: archive.value.firstYear ?? '' }))
const playersLabel = computed(() => t('home.bento.competitors', 'compétiteurs'))
const matchesLabel = computed(() => t('home.bento.matches_detail', 'matchs joués depuis {first_year}, dont {scored} avec score', {
  first_year: archive.value.firstYear ?? '',
  scored: archive.value.scoredMatches
}))
const matchesFull = computed(() => t('home.bento.matches_played', '{matches} matchs joués depuis {first_year}, dont {scored} avec score', {
  matches: archive.value.matches,
  first_year: archive.value.firstYear ?? '',
  scored: archive.value.scoredMatches
}))

/*********************************************************
 * Champion·ne précédent·e
 *
 * @description
 * Une étoile par titre à date (RG6) : les astérisques sont décoratifs, le nombre de titres est écrit en toutes lettres.
 ********************************************************/
const championEyebrow = computed(() => champion.value
  ? t('home.bento.champion', 'Champion·ne {year}', { year: champion.value.year })
  : t('home.bento.champion_none_title', 'Champion·ne'))
const championNone = computed(() => t('home.bento.champion_none', 'Pas encore de champion·ne.'))
const championNickname = computed(() => champion.value?.competitor.nickname
  ? t('home.bento.champion_nickname', '« {nickname} » · ', { nickname: champion.value.competitor.nickname })
  : '')
const championStars = computed(() => '*'.repeat(champion.value?.titles ?? 0))
const championTitles = computed(() => champion.value?.titles === 1
  ? t('home.bento.champion_titles_one', '1 titre')
  : t('home.bento.champion_titles_other', '{count} titres', { count: champion.value?.titles ?? 0 }))

/*********************************************************
 * Classement ACP
 *
 * @description
 * Top 3 sur les dernières éditions clôturées (A8). Les points s'affichent avec deux décimales.
 ********************************************************/
const rankTitle = computed(() => t('home.rank.title', 'Classement ACP'))
const rankEyebrow = computed(() => t('home.rank.window', '{count} dernières éditions', { count: HOME_ACP_WINDOW_EDITIONS }))
const rankMore = computed(() => t('home.rank.more', 'Tout le classement'))
const rankNone = computed(() => t('home.rank.none', 'Le classement n’est pas encore établi.'))
const ranking = computed(() => props.overview.ranking.map(entry => ({ ...entry, points: entry.points.toFixed(HOME_POINTS_DECIMALS) })))
const hasRanking = computed(() => ranking.value.length > 0)

/*********************************************************
 * Face-à-face
 *
 * @description
 * Tuile d'invitation vers la comparaison de deux joueurs.
 ********************************************************/
const headEyebrow = computed(() => t('home.head_to_head.eyebrow', 'Face-à-face'))
const headQuestion = computed(() => t('home.head_to_head.question', 'Qui gagne entre vous deux ?'))
const headAction = computed(() => t('home.head_to_head.action', 'Comparer deux joueurs'))

/*********************************************************
 * Expose
 *
 * @description
 * Rien à piloter depuis l'extérieur.
 ********************************************************/
defineExpose({})
</script>

<style scoped lang="scss">
.home-bento {
  padding-block: var(--home-bento---padding-block, var(--origam-space---20) 0);

  &__head {
    display: flex;
    flex-wrap: wrap;
    align-items: end;
    justify-content: space-between;
    gap: var(--origam-space---4);
    margin-bottom: var(--origam-space---8);
  }

  &__intro {
    margin: 0;
    color: var(--origam-color__text---secondary);
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    grid-auto-rows: minmax(11rem, auto);
    gap: var(--origam-space---4);
    grid-template-areas:
      'now now editions players'
      'now now champion champion'
      'matches rank rank rule';
  }

  &__tile {
    padding: var(--home-bento---tile-padding, var(--origam-space---6));
    text-decoration: none;

    &--now { grid-area: now; }
    &--editions { grid-area: editions; }
    &--players { grid-area: players; }
    &--champion { grid-area: champion; }
    &--matches { grid-area: matches; }
    &--rank { grid-area: rank; }
    &--rule { grid-area: rule; }
  }

  &__stat {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: var(--origam-space---3);
  }

  &__number {
    font-size: var(--origam-font__size---4xl);
    line-height: 0.9;

    &--amber { color: var(--origam-color__bar---amber); }
    &--ice { color: var(--origam-color__bar---ice); }
    &--secondary { color: var(--origam-color__action--secondary---fgSubtle); }
  }

  &__label {
    color: var(--origam-color__text---secondary);
    font-weight: var(--origam-font__weight---semibold);
  }

  &__eyebrow {
    margin: 0;
    font-size: var(--origam-font__size---xs);
    font-weight: var(--origam-font__weight---bold);
    letter-spacing: var(--origam-font__letterSpacing---wider);
    text-transform: uppercase;
    color: var(--origam-color__text---tertiary);
  }

  &__tile--champion {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: var(--origam-space---2);
    overflow: hidden;
    background:
      radial-gradient(28rem 16rem at 100% 0%, color-mix(in srgb, var(--origam-color__bar---neon) 30%, transparent), transparent 70%),
      var(--origam-color__surface---raised);
  }

  &__champion-name {
    font-size: var(--origam-font__size---4xl);
    line-height: var(--origam-font__lineHeight---none);
  }

  &__champion-meta {
    color: var(--origam-color__text---secondary);
  }

  &__stars {
    color: var(--origam-color__bar---amber);
    letter-spacing: 0.08em;
    font-weight: var(--origam-font__weight---bold);
  }

  &__cap {
    position: absolute;
    right: var(--origam-space---6);
    bottom: calc(-1 * var(--origam-space---6));
    width: 7rem;
    height: auto;
    rotate: 18deg;
    opacity: 0.9;
  }

  &__cap-body {
    fill: var(--origam-color__bar---amber);
  }

  &__cap-inner {
    fill: var(--origam-color__surface---default);
  }

  &__tile--rank {
    display: flex;
    flex-direction: column;
  }

  &__rank {
    display: grid;
    gap: var(--origam-space---2);
    margin: var(--origam-space---4) 0;
    padding: 0;
    list-style: none;
  }

  &__rank-row {
    display: grid;
    grid-template-columns: var(--origam-space---10) minmax(0, 1fr) auto;
    align-items: center;
    gap: var(--origam-space---3);
    padding: var(--origam-space---2) var(--origam-space---3);
    border-radius: var(--origam-radius---lg);
    background: var(--origam-color__surface---sunken);
  }

  &__rank-number {
    font-size: var(--origam-font__size---2xl);
    color: var(--origam-color__action--secondary---fgSubtle);
  }

  &__none {
    margin: var(--origam-space---4) 0;
    color: var(--origam-color__text---secondary);
  }

  &__more {
    margin-top: auto;
    align-self: flex-start;
  }

  &__tile--rule {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: var(--origam-space---3);
    border-color: transparent;

    .home-bento__eyebrow,
    .home-bento__label {
      color: inherit;
    }
  }

  &__question {
    font-size: var(--origam-font__size---2xl);
    line-height: var(--origam-font__lineHeight---tight);
  }
}

@media (max-width: 1100px) {
  .home-bento__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-template-areas:
      'now now'
      'editions players'
      'champion champion'
      'matches rule'
      'rank rank';
  }
}

@media (max-width: 760px) {
  .home-bento {
    padding-block: var(--home-bento---padding-block-mobile, var(--origam-space---14) 0);

    &__grid {
      grid-template-columns: 1fr;
      grid-template-areas: 'now' 'editions' 'players' 'champion' 'matches' 'rank' 'rule';
    }

    &__tile {
      padding: var(--home-bento---tile-padding-mobile, var(--origam-space---5));
    }

    &__cap {
      width: 4.5rem;
      right: var(--origam-space---3);
      bottom: calc(-1 * var(--origam-space---4));
      opacity: 0.5;
    }
  }
}
</style>

<style>
:root {
  --home-bento---padding-block: var(--origam-space---20) 0;
  --home-bento---padding-block-mobile: var(--origam-space---14) 0;
  --home-bento---tile-padding: var(--origam-space---6);
  --home-bento---tile-padding-mobile: var(--origam-space---5);
}
</style>

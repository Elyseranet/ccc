<template>
  <section
    class="home-hero"
    aria-labelledby="home-hero-title"
    data-cy="home-hero"
  >
    <bubbles-backdrop />
    <div class="home-hero__grid page-wrap">
      <div class="home-hero__text">
        <p class="home-hero__kicker">
          <origam-chip
            v-if="hasEditions"
            color="primary"
            bg-color="primary"
            size="small"
            pill
            class="home-hero__chip"
            data-cy="home-hero-chip"
            :text="chipText"
          />
          <span class="home-hero__eyebrow"><abbr-text :text="eyebrow" /></span>
        </p>
        <origam-title
          id="home-hero-title"
          tag="h1"
          font-size="5xl"
          line-height="none"
          class="home-hero__title font-display neon"
          data-cy="page-title"
        >
          <template #default>
            <span>{{ titleLineOne }}</span> <span>{{ titleLineTwo }}</span>
          </template>
        </origam-title>
        <p class="home-hero__lead">
          {{ leadBefore }} <strong>{{ leadStrong }}</strong>{{ leadAfter }}
        </p>
        <div class="home-hero__cta">
          <origam-btn
            variant="flat"
            bg-color="primary"
            elevation="lg"
            :hover="buttonHover"
            size="large"
            :to="primaryTo"
            class="home-hero__button"
            data-cy="home-cta-primary"
          >
            <template #default>
              {{ primaryText }} <span
                class="home-hero__arrow"
                aria-hidden="true"
              >{{ arrow }}</span>
            </template>
          </origam-btn>
          <origam-btn
            v-if="hallOfFameTo"
            variant="outlined"
            size="large"
            :to="hallOfFameTo"
            class="home-hero__button"
            data-cy="home-cta-secondary"
            :text="secondaryText"
          />
        </div>
      </div>
      <home-pint />
    </div>
  </section>
</template>

<script setup lang="ts">
import AbbrText from '~/components/common/AbbrText.vue'
import { computed } from 'vue'
import { OrigamBtn, OrigamChip, OrigamTitle } from 'origam/components'
import BubblesBackdrop from '~/components/common/BubblesBackdrop.vue'
import HomePint from '~/components/home/HomePint.vue'
import { useT } from '~/composables/useT'
import { HOME_ARROW_GLYPH, HOME_CTA_HOVER } from '~/consts/home.const'
import { ROUTES } from '~/consts/routes.const'
import type { IHomeHeroProps } from '~/interfaces/home.interface'

/*********************************************************
 * Global
 *
 * @description
 * Hero de l'accueil : pastille du nombre d'éditions, titre display, accroche et deux appels à l'action.
 * Aucun nombre n'est écrit ici : le nombre d'éditions et l'année de départ viennent de `IArchiveStats` et des éditions publiées.
 * Le décor (canvas de bulles) est coupé sous `prefers-reduced-motion: reduce` par le composant commun.
 ********************************************************/
const { t } = useT()
const props = withDefaults(defineProps<IHomeHeroProps>(), { hallOfFameTo: undefined })
const emits = defineEmits<{}>()
defineSlots<{}>()
const arrow = HOME_ARROW_GLYPH
const buttonHover = HOME_CTA_HOVER

/*********************************************************
 * Textes
 *
 * @description
 * Le titre du document reste porté par la page. L'accroche est découpée en trois clés pour mettre le milieu en gras.
 ********************************************************/
const hasEditions = computed(() => props.archive.editions > 0)
const chipText = computed(() => t('home.hero.editions_chip', '{count} éditions', { count: props.archive.editions }))
const eyebrow = computed(() => props.archive.firstYear === null
  ? t('home.hero.eyebrow_no_year', 'ACP CCC')
  : t('home.hero.eyebrow', 'Depuis {first_year} · ACP CCC', { first_year: props.archive.firstYear }))
const titleLineOne = computed(() => t('home.hero.title_line_one', 'Championnat'))
const titleLineTwo = computed(() => t('home.hero.title_line_two', 'de Caps'))
const leadBefore = computed(() => t('home.hero.lead_before', 'Deux joueurs assis, deux bières à deux mètres, une capsule à faire tomber.'))
const leadStrong = computed(() => t('home.hero.lead_strong', 'Le tournoi annuel du CCC'))
const leadAfter = computed(() => t('home.hero.lead_after', ' : poules à 5 points, phase finale à 10, et le gagnant finit sa bière.'))

/*********************************************************
 * Appels à l'action
 *
 * @description
 * Le lien mène à l'édition en cours, construit depuis son `code` (R-9). Sans édition, il mène à la liste des éditions.
 ********************************************************/
const primaryTo = computed(() => props.target ? `${ROUTES.EDITIONS}/${encodeURIComponent(props.target.code)}` : ROUTES.EDITIONS)
const primaryText = computed(() => props.target
  ? t('home.hero.cta_edition', 'Voir l’édition {year}', { year: props.target.year })
  : t('home.hero.cta_editions', 'Voir les éditions'))
const secondaryText = computed(() => t('home.hero.cta_hall_of_fame', 'Le palmarès'))

/*********************************************************
 * Expose
 *
 * @description
 * Rien à piloter depuis l'extérieur.
 ********************************************************/
defineExpose({})
</script>

<style scoped lang="scss">
.home-hero {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  padding-block: var(--home-hero---padding-block, var(--origam-space---12) var(--origam-space---16));

  &__arrow {
    margin-inline-start: var(--origam-space---2);
  }

  &__grid {
    position: relative;
    z-index: 1;
    display: grid;
    grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr);
    align-items: center;
    gap: var(--origam-space---10);
  }

  &__kicker {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--origam-space---3);
    margin: 0;
  }

  &__chip {
    rotate: -3deg;
    font-size: var(--origam-font__size---sm);
  }

  &__eyebrow {
    font-size: var(--origam-font__size---xs);
    font-weight: var(--origam-font__weight---bold);
    letter-spacing: var(--origam-font__letterSpacing---wider);
    text-transform: uppercase;
    color: var(--origam-color__text---tertiary);
  }

  &__title {
    margin: var(--origam-space---6) 0 0;

    span {
      display: inline-block;
      animation: home-hero-rise var(--origam-motion__duration---slow) var(--origam-motion__easing---decelerate) both;
    }

    span + span {
      animation-delay: 120ms;
    }
  }

  &__lead {
    max-width: 34rem;
    margin: var(--origam-space---8) 0 0;
    font-size: var(--origam-font__size---xl);
    line-height: var(--origam-font__lineHeight---snug);
    color: var(--origam-color__text---secondary);

    strong {
      color: var(--origam-color__text---primary);
    }
  }

  &__button {
    --origam-btn---height-lg: var(--home-hero---button-height, var(--origam-space---12));
    --origam-btn---padding-lg: var(--home-hero---button-padding, var(--origam-space---6));
  }

  &__cta {
    display: flex;
    flex-wrap: wrap;
    gap: var(--origam-space---3);
    margin-top: var(--origam-space---8);
  }
}

@keyframes home-hero-rise {
  from { opacity: 0; transform: translateY(0.4em); }
}

@media (max-width: 760px) {
  .home-hero {
    padding-block: var(--home-hero---padding-block-mobile, var(--origam-space---8) var(--origam-space---10));

    &__grid {
      grid-template-columns: 1fr;
    }
  }
}

@media (prefers-reduced-motion: reduce) {
  .home-hero__title span {
    animation: none;
  }
}
</style>

<style>
:root {
  --home-hero---padding-block: var(--origam-space---12) var(--origam-space---16);
  --home-hero---padding-block-mobile: var(--origam-space---8) var(--origam-space---10);
  --home-hero---button-height: var(--origam-space---12);
  --home-hero---button-padding: var(--origam-space---6);
}
</style>

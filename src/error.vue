<template>
  <origam-app>
    <nuxt-layout name="default">
      <template #default>
        <section
          class="error-page page-wrap"
          data-cy="error-page"
        >
          <div class="error-page__in">
            <page-hero
              class="error-page__hero"
              :title="heroTitle"
              :subtitle="heroSubtitle"
            >
              <template #eyebrow>
                <p
                  v-if="hasCode"
                  class="error-page__eyebrow"
                  data-cy="error-page-code"
                >
                  {{ eyebrow }}
                </p>
              </template>
              <template #after-lead>
                <div class="error-page__actions">
                  <origam-btn
                    v-if="isGeneric"
                    variant="flat"
                    bg-color="primary"
                    elevation="lg"
                    :hover="ctaHover"
                    size="large"
                    class="error-page__button"
                    data-cy="error-page-retry"
                    :text="retryLabel"
                    @click="handleRetry"
                  />
                  <origam-btn
                    :variant="homeButton.variant"
                    :bg-color="homeButton.bgColor"
                    :elevation="homeButton.elevation"
                    :hover="homeButton.hover"
                    size="large"
                    :to="homeRoute"
                    class="error-page__button"
                    data-cy="error-page-back"
                    @click="handleBack"
                  >
                    <template #default>
                      {{ backLabel }} <span
                        class="error-page__arrow"
                        aria-hidden="true"
                      >{{ arrow }}</span>
                    </template>
                  </origam-btn>
                </div>
              </template>
            </page-hero>
            <cap-badge
              class="error-page__cap"
              :text="code"
              :text-y="capTextY"
            />
          </div>
        </section>
      </template>
    </nuxt-layout>
  </origam-app>
</template>

<script setup lang="ts">
import { OrigamApp, OrigamBtn } from 'origam/components'
import CapBadge from '~/components/common/CapBadge.vue'
import PageHero from '~/components/common/PageHero.vue'
import { useErrorPage } from '~/composables/useErrorPage'
import { ERROR_PAGE_CAP_TEXT_Y } from '~/consts/error-page.const'
import { HOME_ARROW_GLYPH, HOME_CTA_HOVER } from '~/consts/home.const'
import { ROUTES } from '~/consts/routes.const'
import type { IErrorPageProps } from '~/interfaces/error-page.interface'

/*********************************************************
 * Page d'erreur
 *
 * @description
 * Remplace la page d'erreur par défaut de Nuxt : elle garde le layout public (en-tête, pied de page et liens légaux).
 * Nuxt la rend à la place de `app.vue`, d'où son propre `origam-app`. Structure de `erreur.html` (ui) : `PageHero`
 * (code en eyebrow, titre, chapô), bouton d'accueil de la même recette que le CTA de l'accueil, et une capsule
 * décorative qui porte le code.
 ********************************************************/
const props = withDefaults(defineProps<IErrorPageProps>(), {})
const emits = defineEmits<{}>()
defineSlots<{}>()
const { heroTitle, heroSubtitle, eyebrow, hasCode, code, isGeneric, backLabel, retryLabel, documentTitle, homeButton, backHome, retry } = useErrorPage(() => props.error)
const ctaHover = HOME_CTA_HOVER
const arrow = HOME_ARROW_GLYPH
const homeRoute = ROUTES.HOME
const capTextY = ERROR_PAGE_CAP_TEXT_Y
useHead({ title: documentTitle })

/*********************************************************
 * Retour à l'accueil
 *
 * @description
 * Efface l'erreur puis navigue vers l'accueil : un lien simple laisserait la page d'erreur affichée. Le bouton garde
 * son `to` (lien réel, clic droit et nouvel onglet) ; le clic est pris en charge ici.
 ********************************************************/
const handleBack = (event: Event) => {
  event.preventDefault()
  backHome()
}

/*********************************************************
 * Réessayer
 *
 * @description
 * Erreur autre que 404 : efface l'erreur et recharge la route courante.
 ********************************************************/
const handleRetry = () => {
  retry()
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
.error-page {
  display: flex;
  align-items: center;
  min-height: var(--error-page---min-height, 50vh);

  &__in {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: var(--error-page---gap, var(--origam-space---10));
    width: 100%;
  }

  &__hero {
    width: auto;
    margin-inline: 0;
  }

  &__eyebrow {
    margin: 0;
    font-size: var(--origam-font__size---xs);
    font-weight: var(--origam-font__weight---bold);
    letter-spacing: var(--origam-font__letterSpacing---wider);
    text-transform: uppercase;
    color: var(--origam-color__text---tertiary);
  }

  &__actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--origam-space---3);
    margin-top: var(--error-page__actions---margin-top, var(--origam-space---8));
  }

  &__button {
    --origam-btn---height-lg: var(--error-page__button---height, var(--origam-space---12));
    --origam-btn---padding-lg: var(--error-page__button---padding, var(--origam-space---6));
  }

  &__arrow {
    margin-inline-start: var(--origam-space---2);
  }

  &__cap {
    width: var(--error-page__cap---width, clamp(8rem, 18vw, 14rem));
    rotate: -12deg;
  }
}

@media (max-width: 760px) {
  .error-page {
    &__in {
      grid-template-columns: minmax(0, 1fr);
      gap: var(--origam-space---6);
    }

    &__cap {
      order: -1;
      width: var(--error-page__cap---width-small, 7rem);
    }
  }
}
</style>

<style>
:root {
  --error-page---gap: var(--origam-space---10);
  --error-page__actions---margin-top: var(--origam-space---8);
}
</style>

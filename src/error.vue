<template>
  <origam-app>
    <nuxt-layout name="default">
      <template #default>
        <div
          class="error-page"
          data-cy="error-page"
        >
          <page-hero
            :title="heroTitle"
            :subtitle="heroSubtitle"
          >
            <template #eyebrow>
              <p
                class="error-page__eyebrow"
                data-cy="error-page-code"
              >
                {{ eyebrow }}
              </p>
            </template>
            <template #after-lead>
              <origam-btn
                variant="flat"
                bg-color="primary"
                elevation="lg"
                size="large"
                class="error-page__back"
                data-cy="error-page-back"
                :text="backLabel"
                @click="handleBack"
              />
            </template>
          </page-hero>
        </div>
      </template>
    </nuxt-layout>
  </origam-app>
</template>

<script setup lang="ts">
import { OrigamApp, OrigamBtn } from 'origam/components'
import PageHero from '~/components/common/PageHero.vue'
import { useErrorPage } from '~/composables/useErrorPage'
import type { IErrorPageProps } from '~/interfaces/error-page.interface'

/*********************************************************
 * Page d'erreur
 *
 * @description
 * Remplace la page d'erreur par défaut de Nuxt : elle garde le layout public (en-tête, pied de page et liens légaux).
 * Nuxt la rend à la place de `app.vue`, d'où son propre `origam-app`. Le visuel attend la maquette de ui : seule la
 * structure est posée, avec les composants communs (`PageHero`).
 ********************************************************/
const props = withDefaults(defineProps<IErrorPageProps>(), {})
const emits = defineEmits<{}>()
defineSlots<{}>()
const { heroTitle, heroSubtitle, eyebrow, backLabel, documentTitle, backHome } = useErrorPage(() => props.error)
useHead({ title: documentTitle })

/*********************************************************
 * Retour à l'accueil
 *
 * @description
 * Efface l'erreur puis navigue vers l'accueil : un lien simple laisserait la page d'erreur affichée.
 ********************************************************/
const handleBack = () => {
  backHome()
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
  padding-bottom: var(--error-page---padding-bottom, var(--origam-space---16));

  &__eyebrow {
    margin: 0;
    font-size: var(--origam-font__size---xs);
    font-weight: var(--origam-font__weight---bold);
    letter-spacing: var(--origam-font__letterSpacing---wider);
    text-transform: uppercase;
    color: var(--origam-color__text---tertiary);
  }

  &__back {
    margin-top: var(--error-page__back---margin-top, var(--origam-space---6));
  }
}
</style>

<style>
:root {
  --error-page---padding-bottom: var(--origam-space---16);
  --error-page__back---margin-top: var(--origam-space---6);
}
</style>

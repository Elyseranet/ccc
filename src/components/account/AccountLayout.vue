<template>
  <div
    class="account-layout"
    data-cy="account-layout"
  >
    <page-hero :title="heroTitle">
      <template #eyebrow>
        <p class="account-layout__eyebrow">
          {{ eyebrow }}
        </p>
      </template>
    </page-hero>
    <div
      class="page-wrap account-layout__grid"
      :class="gridClass"
    >
      <slot name="main" />
      <slot name="side" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import PageHero from '~/components/common/PageHero.vue'
import { useT } from '~/composables/useT'
import type { IAccountLayoutProps, IAccountLayoutSlots } from '~/interfaces/account.interface'
import type { ITranslatableText } from '~/interfaces/common-components.interface'

/*********************************************************
 * Global
 *
 * @description
 * La page des trois écrans du compte (première connexion, connexion, profil) : le titre « Mon compte » avec son chapeau, puis
 * deux colonnes, la carte de l'écran à gauche (`main`) et une carte ou un texte d'accompagnement à droite (`side`). Sous
 * 760 px, les deux se superposent. `narrow` donne à la carte principale la largeur de la colonne d'accompagnement : c'est celle des cartes d'état (lien expiré, compte activé). Le chapeau explicatif de la maquette décrit les trois écrans de la maquette, pas la page :
 * il n'est pas repris.
 ********************************************************/
const { t } = useT()
const props = withDefaults(defineProps<IAccountLayoutProps>(), {
  narrow: false
})
const emits = defineEmits<{}>()
defineSlots<IAccountLayoutSlots>()
const heroTitle: ITranslatableText = { key: 'account.hero.title', fallback: 'Mon compte' }
const gridClass = computed(() => ({ 'account-layout__grid--narrow': props.narrow }))
const eyebrow = computed(() => t('account.hero.eyebrow', 'Compte participant'))

/*********************************************************
 * Expose
 *
 * @description
 * Rien à piloter depuis l'extérieur.
 ********************************************************/
defineExpose({})
</script>

<style scoped lang="scss">
.account-layout {
  &__eyebrow {
    margin: 0;
    font-size: var(--origam-font__size---xs);
    font-weight: var(--origam-font__weight---bold);
    letter-spacing: var(--origam-font__letterSpacing---wider);
    text-transform: uppercase;
    color: var(--origam-color__text---tertiary);
  }

  &__grid {
    display: grid;
    grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr);
    gap: var(--account-layout---gap, var(--origam-space---5));
    align-items: start;
    padding-bottom: var(--account-layout---padding-bottom, var(--origam-space---12));
  }

  &__grid--narrow {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.5fr);
  }

  @media (max-width: 760px) {
    &__grid,
    &__grid--narrow {
      grid-template-columns: 1fr;
    }
  }
}
</style>

<style>
:root {
  --account-layout---gap: var(--origam-space---5);
  --account-layout---padding-bottom: var(--origam-space---12);
}
</style>

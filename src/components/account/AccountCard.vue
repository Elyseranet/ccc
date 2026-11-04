<template>
  <origam-card
    tag="section"
    rounded="xl"
    border
    elevation="md"
    class="account-card"
    :aria-labelledby="labelledby"
  >
    <template #default>
      <div class="account-card__body">
        <slot name="default" />
      </div>
    </template>
  </origam-card>
</template>

<script setup lang="ts">
import { OrigamCard } from 'origam/components'
import type { IAccountCardProps, IAccountCardSlots } from '~/interfaces/account.interface'

/*********************************************************
 * Global
 *
 * @description
 * La carte d'un écran du compte (connexion, première connexion, profil) : section nommée par son titre, grille d'espacement
 * constant. Le slot d'`origam-card` est enveloppé par Origam dans `.origam-card__content` : la grille vit dans notre propre
 * `div`, pas dans un `:deep`.
 ********************************************************/
const props = withDefaults(defineProps<IAccountCardProps>(), {})
const emits = defineEmits<{}>()
defineSlots<IAccountCardSlots>()

/*********************************************************
 * Expose
 *
 * @description
 * Rien à piloter depuis l'extérieur.
 ********************************************************/
defineExpose({})
</script>

<style scoped lang="scss">
.account-card {
  padding: var(--account-card---padding, var(--origam-space---8));

  &__body {
    display: grid;
    gap: var(--account-card---gap, var(--origam-space---4));
  }

  @media (max-width: 760px) {
    padding: var(--account-card---padding-mobile, var(--origam-space---5));
  }
}
</style>

<style>
:root {
  --account-card---gap: var(--origam-space---4);
  --account-card---padding: var(--origam-space---8);
  --account-card---padding-mobile: var(--origam-space---5);
}
</style>

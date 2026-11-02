<template>
  <origam-card
    tag="aside"
    rounded="xl"
    border
    border-style="dashed"
    elevation="md"
    class="account-state"
    :class="toneClass"
    :aria-labelledby="titleId"
    data-cy="account-state"
  >
    <template #default>
      <div class="account-state__body">
        <span
          class="account-state__icon font-display"
          aria-hidden="true"
        >{{ glyph }}</span>
        <origam-title
          :id="titleId"
          tag="h3"
          font-size="xl"
          font-weight="bold"
          line-height="tight"
          letter-spacing="normal"
          :text="title"
        />
        <p class="account-state__text">
          {{ text }}
        </p>
        <slot name="default" />
      </div>
    </template>
  </origam-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { OrigamCard, OrigamTitle } from 'origam/components'
import { ACCOUNT_STATE_GLYPHS } from '~/consts/account.const'
import { ACCOUNT_STATE_TONE } from '~/enums/account.enum'
import type { IAccountStateProps, IAccountStateSlots } from '~/interfaces/account.interface'

/*********************************************************
 * Global
 *
 * @description
 * Carte d'état du compte, en pointillé : lien expiré, invitation inconnue, compte activé, profil enregistré. L'icône est un glyphe
 * décoratif ; la teinte (rouge ou verte) ne porte jamais seule le sens, le titre et le texte le disent. Les actions de la carte
 * (retour, réessayer) arrivent par le slot.
 ********************************************************/
const props = withDefaults(defineProps<IAccountStateProps>(), {})
const emits = defineEmits<{}>()
defineSlots<IAccountStateSlots>()
const glyph = computed(() => ACCOUNT_STATE_GLYPHS[props.tone])
const toneClass = computed(() => ({ 'account-state--success': props.tone === ACCOUNT_STATE_TONE.SUCCESS }))

/*********************************************************
 * Expose
 *
 * @description
 * Rien à piloter depuis l'extérieur.
 ********************************************************/
defineExpose({})
</script>

<style scoped lang="scss">
.account-state {
  padding: var(--account-state---padding, var(--origam-space---6));

  @media (max-width: 760px) {
    padding: var(--account-state---padding-mobile, var(--origam-space---5));
  }

  &__body {
    display: grid;
    justify-items: start;
    gap: var(--account-state---gap, var(--origam-space---3));
  }

  &__icon {
    display: grid;
    place-items: center;
    width: var(--origam-space---12);
    aspect-ratio: 1;
    border-radius: var(--origam-radius---full);
    background: var(--account-state__icon---background, var(--origam-color__feedback--danger---bgSubtle));
    color: var(--account-state__icon---color, var(--origam-color__feedback--danger---fgSubtle));
    font-size: var(--origam-font__size---xl);
  }

  &--success &__icon {
    background: var(--account-state--success__icon---background, var(--origam-color__feedback--success---bgSubtle));
    color: var(--account-state--success__icon---color, var(--origam-color__feedback--success---fgSubtle));
  }

  &__text {
    margin: 0;
    color: var(--origam-color__text---secondary);
  }
}
</style>

<style>
:root {
  --account-state---gap: var(--origam-space---3);
  --account-state---padding: var(--origam-space---6);
  --account-state---padding-mobile: var(--origam-space---5);
}
</style>

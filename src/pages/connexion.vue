<template>
  <account-layout>
    <template #main>
      <login-form
        :pending="pending"
        :error="error"
        @submit="handleSubmit"
      />
    </template>
    <template #side>
      <aside
        class="login-page__aside"
        data-cy="login-aside"
      >
        <p class="login-page__big font-display neon">
          {{ asideBig }}
        </p>
        <p class="login-page__text">
          {{ asideText }}
        </p>
      </aside>
    </template>
  </account-layout>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import AccountLayout from '~/components/account/AccountLayout.vue'
import LoginForm from '~/components/account/LoginForm.vue'
import { useLogin } from '~/composables/useLogin'
import { useT } from '~/composables/useT'
import type { ILoginRequest } from '~/interfaces/auth.interface'

/*********************************************************
 * Page
 *
 * @description
 * Connexion (F-10) : toute la logique est dans `useLogin`. Un administrateur arrive sur son espace, un participant sur son profil.
 ********************************************************/
definePageMeta({ layout: 'default' })
const { t } = useT()
const props = withDefaults(defineProps<{}>(), {})
const emits = defineEmits<{}>()
defineSlots<{}>()
const title = computed(() => t('pages.login.title', 'Connexion'))
useHead({ title })
const asideBig = computed(() => t('account.login.aside_big', 'Santé !'))
const asideText = computed(() => t('account.login.aside_text', 'Après connexion : un participant arrive sur son profil, l’organisation sur son espace.'))

/*********************************************************
 * Connexion
 *
 * @description
 * La page branche le composable sur le formulaire.
 ********************************************************/
const { login, pending, error } = useLogin()
const handleSubmit = (credentials: ILoginRequest) => {
  login(credentials)
}

/*********************************************************
 * Expose
 *
 * @description
 * Une page n'expose rien à un parent.
 ********************************************************/
defineExpose({})
</script>

<style scoped lang="scss">
.login-page {
  &__aside {
    display: grid;
    gap: var(--login-page---gap, var(--origam-space---4));
    align-self: center;
  }

  &__big {
    margin: 0;
    font-size: var(--origam-font__size---5xl);
    line-height: var(--origam-font__lineHeight---none);
  }

  &__text {
    margin: 0;
    color: var(--origam-color__text---secondary);
  }
}
</style>

<style>
:root {
  --login-page---gap: var(--origam-space---4);
}
</style>

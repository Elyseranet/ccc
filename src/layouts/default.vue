<template>
  <div class="public-shell">
    <skip-link />
    <div class="public-shell__header">
      <div class="page-wrap">
        <origam-toolbar
          tag="header"
          height="auto"
          flat
          rounded="full"
          border
          border-color="var(--origam-color__border---default)"
          class="public-header"
        >
          <template #default>
            <nuxt-link
              :to="ROUTES.HOME"
              class="public-header__brand font-display"
              data-cy="brand-link"
              :aria-label="brandLabel"
            >
              <brand-mark />
              <span>{{ brandName }}</span>
            </nuxt-link>
            <nav
              class="public-header__nav"
              :aria-label="navLabel"
            >
              <ul class="public-header__list">
                <li
                  v-for="item in navigation"
                  :key="item.to"
                >
                  <origam-btn
                    :to="item.to"
                    :variant="item.variant"
                    :bg-color="item.color"
                    :color="item.color"
                    rounded="full"
                    font-weight="semibold"
                    class="public-header__link"
                    :class="item.linkClass"
                    :aria-current="item.current"
                    :data-cy="`nav-${item.to}`"
                    :text="item.text"
                  />
                </li>
              </ul>
            </nav>
            <origam-btn
              v-if="accountLink"
              :to="accountLink.to"
              variant="outlined"
              size="small"
              rounded="full"
              class="public-header__account"
              data-cy="account-link"
              :text="accountLink.text"
            />
            <span
              v-else
              class="public-header__end"
              aria-hidden="true"
            />
          </template>
        </origam-toolbar>
      </div>
    </div>
    <origam-main
      id="contenu"
      tabindex="-1"
      class="public-main"
    >
      <template #default>
        <slot name="default" />
      </template>
    </origam-main>
    <footer class="public-footer">
      <div class="public-footer__inner page-wrap">
        <p class="public-footer__brand font-display neon--sm">
          {{ brandName }}
        </p>
        <nav :aria-label="footerLabel">
          <ul class="public-footer__list">
            <li
              v-for="item in footerNavigation"
              :key="item.to"
            >
              <origam-btn
                :to="item.to"
                variant="text"
                rounded="full"
                font-weight="semibold"
                class="public-footer__link"
                :data-cy="`footer-${item.to}`"
                :text="item.text"
              />
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { OrigamBtn, OrigamMain, OrigamToolbar } from 'origam/components'
import BrandMark from '~/components/common/BrandMark.vue'
import SkipLink from '~/components/common/SkipLink.vue'
import { useNavigationState } from '~/composables/useNavigationState'
import { useT } from '~/composables/useT'
import { INTENT, VARIANT } from 'origam/enums'
import { ROUTES } from '~/consts/routes.const'
import { FOOTER_NAVIGATION, PUBLIC_NAVIGATION } from '~/consts/public-navigation.const'
import { useAuthStore } from '~/composables/useAuthStore'

/*********************************************************
 * Global
 *
 * @description
 * Layout public : en-tête flottant, contenu principal (#contenu) et pied de page.
 * La navigation est une liste de liens de document (`nav > ul`), pas une listbox applicative.
 *
 * @description
 * Contournement Origam #1222 : la variante `text` impose un fond transparent ; l'entrée active passe en `flat` + `secondary`.
 * Le surlignage actif d'Origam (overlay noir de 20 %) est neutralisé par `--origam-btn---overlay-opacity-active`.
 ********************************************************/
const { t } = useT()
const auth = useAuthStore()
const { isActive, ariaCurrent } = useNavigationState()
const props = withDefaults(defineProps<{}>(), {})
const emits = defineEmits<{}>()
defineSlots<{ default(): unknown }>()

/*********************************************************
 * Libellés
 *
 * @description
 * Tout texte passe par `t()` ; les listes de navigation portent des clés.
 ********************************************************/
const brandName = computed(() => t('layout.brand_name', 'CCC'))
const brandLabel = computed(() => t('layout.header.brand_label', 'CCC, accueil'))
const navLabel = computed(() => t('layout.header.nav_label', 'Navigation principale'))
const footerLabel = computed(() => t('layout.footer.nav_label', 'Pied de page'))
const footerNavigation = computed(() => FOOTER_NAVIGATION.map(item => ({ to: item.to, text: t(item.key, item.label) })))

/*********************************************************
 * Navigation
 *
 * @description
 * L'entrée active passe de `text` à `flat` + `secondary` : la variante `text` d'Origam impose un fond transparent.
 ********************************************************/
const navigation = computed(() => PUBLIC_NAVIGATION.map((item) => {
  const active = isActive(item.to, item.exact)
  return {
    to: item.to,
    text: t(item.key, item.label),
    active,
    variant: active ? VARIANT.FLAT : VARIANT.TEXT,
    color: active ? INTENT.SECONDARY : undefined,
    linkClass: active ? undefined : 'public-header__link--rest',
    current: ariaCurrent(item.to, item.exact)
  }
}))

/*********************************************************
 * Compte
 *
 * @description
 * Pas d'avatar ni de « Connexion » en en-tête (A3, E-d) : seul un utilisateur connecté voit un lien,
 * « Espace organisateur » pour un administrateur, « Mon profil » pour un participant.
 ********************************************************/
const accountLink = computed(() => {
  if (auth.isAdmin) {
    return { to: ROUTES.ADMIN, text: t('layout.header.organizer_space', 'Espace organisateur') }
  }
  if (auth.isAuthenticated) {
    return { to: ROUTES.PROFILE, text: t('layout.header.my_profile', 'Mon profil') }
  }
  return null
})

/*********************************************************
 * Expose
 *
 * @description
 * Le layout n'expose rien à un parent.
 ********************************************************/
defineExpose({})
</script>

<style scoped lang="scss">
.public-shell {
  position: relative;
  min-height: 100vh;
  isolation: isolate;

  &::before {
    content: '';
    position: fixed;
    inset: 0;
    z-index: -1;
    pointer-events: none;
    background:
      radial-gradient(var(--public-shell---halo-neon-size, 60rem 40rem) at 85% -10%, color-mix(in srgb, var(--origam-color__bar---neon) 22%, transparent), transparent 70%),
      radial-gradient(var(--public-shell---halo-glow-size, 50rem 36rem) at -10% 30%, color-mix(in srgb, var(--origam-color__bar---glow) 90%, transparent), transparent 70%),
      var(--origam-color__surface---default);
  }

  &__header {
    position: sticky;
    top: 0;
    z-index: 30;
    padding-top: var(--origam-space---3);
  }
}

.public-header {
  display: flex;
  align-items: center;
  gap: var(--origam-space---5);
  min-height: var(--origam-space---16);
  padding-inline: var(--origam-space---5) var(--origam-space---3);
  background: color-mix(in srgb, var(--origam-color__surface---overlay) 82%, transparent);
  backdrop-filter: blur(var(--public-header---blur, 16px)) saturate(140%);
  box-shadow: var(--origam-shadow---md);

  &__brand {
    display: inline-flex;
    align-items: center;
    min-height: var(--origam-space---11);
    gap: var(--origam-space---2);
    font-size: var(--origam-font__size---2xl);
    line-height: 1;
    text-decoration: none;
  }

  &__nav {
    flex: 1;
    min-width: 0;
    overflow-x: auto;
    scrollbar-width: none;
  }

  &__list {
    display: flex;
    justify-content: center;
    gap: var(--origam-space---1);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  &__link {
    --origam-btn---padding-lg: var(--origam-space---4);
    --origam-btn---min-width: 0;
  }

  &__link--rest {
    color: var(--origam-color__text---secondary);
  }

  &__end {
    width: var(--origam-space---11);
    flex: none;
  }

  &__account {
    flex: none;
  }
}

.public-main {
  background: transparent;
  min-height: calc(100vh - var(--public-main---reserved-height, 20rem));
}

.public-footer {
  margin-top: var(--origam-space---20);
  padding-block: var(--origam-space---10) var(--origam-space---8);
  border-top: var(--origam-border__width---thin) solid var(--origam-color__border---default);
  background: var(--origam-color__surface---sunken);

  &__inner {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--origam-space---5);
  }

  &__brand {
    margin: 0;
    font-size: var(--origam-font__size---3xl);
    line-height: 1;
  }

  &__list {
    display: flex;
    flex-wrap: wrap;
    gap: var(--origam-space---2);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  &__link {
    --origam-btn---padding-lg: var(--origam-space---3);
    --origam-btn---min-width: 0;

    color: var(--origam-color__text---secondary);
    text-decoration: underline;
  }
}

@media (max-width: 760px) {
  .public-header {
    flex-wrap: wrap;
    gap: 0;
    padding: var(--origam-space---1) var(--origam-space---2) var(--origam-space---1) var(--origam-space---4);
    border-radius: var(--origam-radius---xl);

    &__nav {
      order: 3;
      flex-basis: 100%;
    }

    &__list {
      justify-content: flex-start;
      gap: 0;
    }

    &__link {
      --origam-btn---font-size: var(--origam-font__size---sm);
      --origam-btn---padding-lg: var(--origam-space---3);
    }

    &__end,
    &__account {
      margin-left: auto;
    }
  }
}
</style>

<style>
:root {
  --public-header---blur: 16px;
  --public-main---reserved-height: 20rem;
}
</style>

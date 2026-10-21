<template>
  <div class="admin-shell">
    <skip-link />
    <aside
      class="admin-drawer"
      :aria-label="asideLabel"
    >
      <nuxt-link
        :to="ROUTES.ADMIN"
        class="admin-drawer__brand font-display"
        data-cy="admin-brand-link"
        :aria-label="brandLabel"
      >
        <brand-mark />
        <span>{{ brandName }}</span>
      </nuxt-link>
      <template
        v-for="group in groups"
        :key="group.key"
      >
        <p
          :id="`${group.key}-title`"
          class="admin-drawer__title"
        >
          {{ group.label }}
        </p>
        <nav :aria-labelledby="`${group.key}-title`">
          <ul class="admin-drawer__list">
            <li
              v-for="item in group.items"
              :key="item.to"
            >
              <origam-btn
                :to="item.to"
                :variant="item.variant"
                :bg-color="item.color"
                :color="item.color"
                :prepend-icon="item.icon"
                rounded="full"
                block
                font-weight="semibold"
                :class="item.linkClass"
                :aria-current="item.current"
                :data-cy="`admin-nav-${item.to}`"
                :text="item.text"
              />
            </li>
          </ul>
        </nav>
      </template>
      <origam-btn
        :to="ROUTES.HOME"
        :variant="VARIANT.OUTLINED"
        font-size="sm"
        font-weight="bold"
        class="admin-drawer__public"
        :text="publicSiteLabel"
      />
    </aside>
    <div class="admin-column">
      <origam-toolbar
        tag="header"
        height="auto"
        flat
        class="admin-top"
      >
        <template #default>
          <div class="admin-top__edition">
            <span
              class="admin-top__eyebrow"
            >{{ editionLabel }}</span>
            <admin-edition-select
              :label="editionLabel"
              data-cy="admin-edition-select"
            />
          </div>
          <span
            v-if="initials"
            class="admin-top__avatar"
            role="img"
            :aria-label="avatarLabel"
            data-cy="admin-avatar"
          >{{ initials }}</span>
        </template>
      </origam-toolbar>
      <origam-main
        id="contenu"
        tabindex="-1"
        class="admin-main"
      >
        <template #default>
          <div class="admin-content">
            <slot name="default" />
          </div>
        </template>
      </origam-main>
    </div>
    <origam-bottom-nav
      :items="bottomItems"
      grow
      elevation="md"
      mandatory
      :height="75"
      class="admin-bottom"
      :aria-label="bottomLabel"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { OrigamBottomNav, OrigamBtn, OrigamMain, OrigamToolbar } from 'origam/components'
import { INTENT, VARIANT } from 'origam/enums'
import BrandMark from '~/components/common/BrandMark.vue'
import AdminEditionSelect from '~/components/admin/AdminEditionSelect.vue'
import SkipLink from '~/components/common/SkipLink.vue'
import { useNavigationState } from '~/composables/useNavigationState'
import { useT } from '~/composables/useT'
import { ADMIN_BOTTOM_NAVIGATION, ADMIN_NAVIGATION } from '~/consts/admin-navigation.const'
import { ROUTES } from '~/consts/routes.const'
import { useAuthStore } from '~/stores/auth.store'

/*********************************************************
 * Global
 *
 * @description
 * Coque admin : tiroir fixe à partir de 1000 px, barre basse en dessous (A7).
 * L'édition active est un contexte global porté par le store `admin-edition`.
 *
 * @description
 * Contournement Origam #1223 : `origam-drawer` téléporte son contenu dans le layout, ce que le rendu serveur ne sait pas
 * hydrater (page 500 mesurée). Le tiroir est donc un `aside` en CSS, dont les entrées sont des `origam-btn`.
 * Contournement Origam #1222 : la variante `text` impose un fond transparent ; l'entrée active passe en `flat` + `secondary`.
 ********************************************************/
const { t } = useT()
const { isActive, ariaCurrent } = useNavigationState()
const auth = useAuthStore()
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
const brandLabel = computed(() => t('layout.admin.brand_label', 'CCC, tableau de bord'))
const asideLabel = computed(() => t('layout.admin.aside_label', 'Organisation'))
const bottomLabel = computed(() => t('layout.admin.bottom_label', 'Administration (mobile)'))
const editionLabel = computed(() => t('layout.admin.active_edition', 'Édition active'))
const publicSiteLabel = computed(() => t('layout.admin.public_site', 'Voir le site public ↗'))
const avatarLabel = computed(() => t('layout.admin.avatar_label', 'Administrateur'))
const initials = computed(() => auth.initials)

/*********************************************************
 * Navigation
 *
 * @description
 * L'entrée active passe de `text` à `flat` ; le surlignage actif d'Origam (30 % de noir, overlay) est neutralisé en CSS.
 ********************************************************/
const groups = computed(() => ADMIN_NAVIGATION.map(group => ({
  key: group.key,
  label: t(group.key, group.label),
  items: group.items.map((item) => {
    const active = isActive(item.to, item.exact)
    return {
      to: item.to,
      text: t(item.key, item.label),
      icon: item.icon,
      current: ariaCurrent(item.to, item.exact),
      variant: active ? VARIANT.FLAT : VARIANT.TEXT,
      color: active ? INTENT.SECONDARY : undefined,
      linkClass: active ? 'admin-drawer__link' : 'admin-drawer__link admin-drawer__link--rest'
    }
  })
})))
const bottomItems = computed(() => ADMIN_BOTTOM_NAVIGATION.map((item) => {
  const active = isActive(item.to, item.exact)
  return {
    to: item.to,
    text: t(item.key, item.label),
    prependIcon: item.icon,
    stacked: true,
    rounded: 'lg' as const,
    fontSize: 'xs' as const,
    fontWeight: 'bold' as const,
    variant: active ? VARIANT.FLAT : VARIANT.TEXT,
    bgColor: active ? INTENT.SECONDARY : undefined,
    color: active ? INTENT.SECONDARY : undefined,
    class: active ? 'admin-bottom__item' : 'admin-bottom__item admin-bottom__item--rest',
    'aria-current': ariaCurrent(item.to, item.exact)
  }
}))

/*********************************************************
 * Expose
 *
 * @description
 * Le layout n'expose rien à un parent.
 ********************************************************/
defineExpose({})
</script>

<style scoped lang="scss">
.admin-shell {
  position: relative;
  display: grid;
  grid-template-columns: var(--admin-drawer---width, 17rem) minmax(0, 1fr);
  min-height: 100vh;
  background:
    radial-gradient(var(--admin-shell---halo-size, 50rem 30rem) at 100% 0%, color-mix(in srgb, var(--origam-color__bar---neon) 14%, transparent), transparent 70%),
    var(--origam-color__surface---default);
  background-attachment: fixed;
}

.admin-drawer {
  position: sticky;
  top: 0;
  display: flex;
  flex-direction: column;
  gap: var(--origam-space---2);
  height: 100vh;
  padding: var(--origam-space---6) var(--origam-space---4);
  overflow-y: auto;
  border-right: var(--origam-border__width---thin) solid var(--origam-color__border---default);
  background: var(--origam-color__surface---sunken);

  &__brand {
    display: inline-flex;
    align-items: center;
    align-self: flex-start;
    gap: var(--origam-space---2);
    margin: 0 0 var(--origam-space---4);
    padding-inline: var(--origam-space---2);
    min-height: var(--origam-space---11);
    font-size: var(--origam-font__size---2xl);
    line-height: 1;
    text-decoration: none;
  }

  &__title {
    margin: var(--origam-space---4) var(--origam-space---3) var(--origam-space---1);
    font-size: var(--origam-font__size---xs);
    font-weight: var(--origam-font__weight---bold);
    letter-spacing: var(--origam-font__letterSpacing---wider);
    text-transform: uppercase;
    color: var(--origam-color__text---tertiary);
  }

  &__list {
    display: grid;
    gap: var(--origam-space---1);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  &__link {
    --origam-btn---overlay-opacity-active: 0;
    --origam-btn---overlay-opacity-active-hover: 0;

    --origam-btn---padding-lg: var(--origam-space---3);

    --origam-btn__prepend---margin-inline-start: 0;
    --origam-btn__prepend---margin-inline-end: var(--origam-space---3);

    justify-content: flex-start;

    :deep(.origam-btn__loader) {
      justify-content: flex-start;
    }
  }

  &__link--rest {
    color: var(--origam-color__text---secondary);
  }

  &__public {
    --origam-btn---color: var(--origam-color__text---primary);
    --origam-btn---border-color: var(--origam-color__border---strong);
    --origam-btn---border-width-outlined: var(--origam-border__width---2);
    --origam-btn---padding-lg: var(--origam-space---4);

    margin-top: auto;
  }
}

.admin-column {
  min-width: 0;
}

.admin-top {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--origam-space---4);
  padding: var(--origam-space---3) var(--origam-space---8);
  border-bottom: var(--origam-border__width---thin) solid var(--origam-color__border---subtle);
  background: color-mix(in srgb, var(--origam-color__surface---default) 85%, transparent);
  backdrop-filter: blur(var(--admin-top---blur, 14px));

  &__edition {
    display: grid;
    gap: var(--origam-space---1);
    width: var(--admin-top---edition-width, 18rem);
  }

  &__eyebrow {
    font-size: var(--origam-font__size---xs);
    font-weight: var(--origam-font__weight---bold);
    letter-spacing: var(--origam-font__letterSpacing---wide);
    text-transform: uppercase;
    color: var(--origam-color__text---tertiary);
  }

  &__avatar {
    display: inline-grid;
    flex: none;
    place-items: center;
    width: var(--origam-space---10);
    aspect-ratio: 1;
    border-radius: var(--origam-radius---full);
    background: var(--origam-color__surface---overlay);
    box-shadow: inset 0 0 0 var(--origam-border__width---medium, 2px) var(--origam-color__border---default);
    font-size: var(--origam-font__size---sm);
    font-weight: var(--origam-font__weight---bold);
  }
}

.admin-content {
  max-width: 80rem;
  padding: var(--origam-space---8);
}

.admin-bottom {
  --origam-btn---overlay-opacity-active: 0;
  --origam-btn---overlay-opacity-active-hover: 0;

  display: none;
  padding: var(--origam-space---2) var(--origam-space---3) calc(var(--origam-space---2) + env(safe-area-inset-bottom));
  border-top: var(--origam-border__width---thin) solid var(--origam-color__border---default);
  background: color-mix(in srgb, var(--origam-color__surface---overlay) 92%, transparent);
  backdrop-filter: blur(var(--admin-bottom---blur, 16px));

  :deep(.origam-bottom-nav__content) {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: var(--origam-space---1);
    width: 100%;
  }

  :deep(.admin-bottom__item) {
    --origam-btn---font-size: var(--origam-font__size---xs);
    --origam-btn---min-width: 0;
    --origam-btn---padding-lg: 0;

    --origam-btn---padding-block: var(--origam-space---2);
    --origam-btn---line-height: var(--origam-font__lineHeight---normal);

    --origam-btn---height: auto;

    height: auto;
    min-height: 3.5rem;
    gap: 2px;
    font-size: var(--origam-font__size---xs);
    line-height: var(--origam-font__lineHeight---normal);
  }

  :deep(.admin-bottom__item .origam-btn__prepend) {
    margin-bottom: calc(var(--origam-space---1) / 2);
  }

  :deep(.admin-bottom__item .origam-btn__content) {
    line-height: var(--origam-font__lineHeight---normal);
  }

  :deep(.admin-bottom__item--rest) {
    color: var(--origam-color__text---secondary);
  }
}

@media (max-width: 1000px) {
  .admin-shell {
    grid-template-columns: minmax(0, 1fr);
  }

  .admin-drawer {
    display: none;
  }

  .admin-bottom {
    display: flex;
  }

  .admin-top {
    padding: var(--origam-space---3) var(--origam-space---4);

    &__edition {
      flex: 1;
      width: auto;
    }
  }

  .admin-content {
    padding: var(--origam-space---5) var(--origam-space---4) var(--admin-content---bottom-space, 6rem);
  }
}
</style>

<style>
:root {
  --admin-drawer---width: 17rem;
  --admin-shell---halo-size: 50rem 30rem;
  --admin-top---blur: 14px;
  --admin-top---edition-width: 18rem;
  --admin-content---bottom-space: 6rem;
  --admin-bottom---blur: 16px;
}
</style>

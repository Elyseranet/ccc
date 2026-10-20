<template>
  <div class="public-shell">
    <origam-toolbar tag="header" height="auto" class="topbar">
      <div class="topbar__inner page-wrap">
        <origam-btn class="brand" to="/" variant="plain" :aria-label="t('nav_home', 'Accueil CCC')">
          <span class="brand__mark"><span /></span>
          <span class="brand__name">{{ t('brand_name', 'CCC') }}</span>
        </origam-btn>
        <origam-toolbar tag="nav" height="auto" class="public-nav" :aria-label="t('main_navigation', 'Navigation principale')">
          <origam-btn v-for="item in links" :key="item.key" :to="item.to" variant="plain" class="public-nav__link" active-class="public-nav__link--active">{{ t(item.key, item.label) }}</origam-btn>
        </origam-toolbar>
        <origam-btn class="topbar__login" to="/admin" variant="plain" color="secondary" :aria-label="t('user_login', 'Connexion')">
          <span>{{ t('user_login', 'Connexion') }}</span>
          <origam-avatar class="topbar__avatar" :text="USER_AVATAR_INITIALS" aria-hidden="true" />
        </origam-btn>
      </div>
    </origam-toolbar>
    <origam-main id="contenu" class="public-main">
      <slot name="default" />
    </origam-main>
    <footer class="site-footer">
      <div class="page-wrap site-footer__inner">
        <span class="brand__name">{{ t('brand_name', 'CCC') }}</span>
        <span class="site-footer__note">{{ t('footer_note', 'Championnat de Caps · CCC') }}</span>
        <origam-btn to="/rules" variant="plain">{{ t('rules', 'Règlement') }} <span aria-hidden="true">↗</span></origam-btn>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { useT } from '~/composables/useT'
import { OrigamAvatar, OrigamBtn, OrigamMain, OrigamToolbar } from 'origam/components'
import { PUBLIC_NAVIGATION } from '~/consts/public-navigation.const'
import { USER_AVATAR_INITIALS } from '~/consts/user-account.const'

/*********************************************************
 * Public navigation
 *
 * @description
 * Keeps the public destinations in one place for consistent navigation.
 ********************************************************/
const { t } = useT()
const props = withDefaults(defineProps<{}>(), {})
const emits = defineEmits<{}>()
defineSlots<{ default(): unknown }>()
const links = PUBLIC_NAVIGATION

/*********************************************************
 * Expose
 *
 * @description
 * The public shell has no parent-facing controls.
 ********************************************************/
defineExpose({})
</script>

<style scoped lang="scss">
.public-shell { min-height: 100vh; background: var(--bg); }
.topbar { position: sticky; z-index: 10; top: 0; border-bottom: 1px solid var(--border); background: color-mix(in srgb, var(--surface) 94%, transparent); backdrop-filter: blur(18px); }
.topbar__inner { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; min-height: 68px; gap: 32px; }
.brand { display: inline-flex; align-items: center; justify-self: start; flex: none; gap: 10px; }
.brand__mark { display: grid; width: 30px; height: 30px; place-items: center; border: 2px solid var(--accent); border-radius: 50%; }
.brand__mark span { width: 8px; height: 8px; border-radius: 50%; background: var(--accent); }
.brand__name { font-size: 15px; font-weight: 800; letter-spacing: .04em; }
.brand__name span { color: var(--accent); }
.public-nav { display: flex; grid-column: 2; min-width: 0; align-self: stretch; align-items: stretch; gap: 4px; overflow-x: auto; }
.public-nav__link { display: inline-flex; align-items: center; flex: none; padding: 0 13px; border-bottom: 2px solid transparent; color: var(--muted); font-size: 13px; font-weight: 600; transition: color .2s ease; }
.public-nav__link:hover, .public-nav__link--active { color: var(--text); border-bottom-color: var(--accent); }
.topbar__login { display: flex; grid-column: 3; align-items: center; justify-self: end; gap: 8px; }
.topbar__avatar { width: 34px; height: 34px; }
.site-footer a span { color: var(--accent); }
.public-main { min-height: calc(100vh - 140px); }
.site-footer { border-top: 1px solid var(--border); background: #0a0b0d; }
.site-footer__inner { display: flex; min-height: 72px; align-items: center; justify-content: space-between; gap: 18px; }
.site-footer__note { color: var(--faint); font-size: 12px; }
.site-footer a { color: var(--muted); font-size: 12px; }
@media (max-width: 850px) { .topbar__inner { grid-template-columns: minmax(0, 1fr) auto; grid-template-areas: 'brand login' 'nav nav'; gap: 0 18px; padding-top: 13px; } .brand { grid-area: brand; } .public-nav { grid-area: nav; width: 100%; min-height: 42px; } .public-nav__link { padding-inline: 10px; } .topbar__login { grid-area: login; grid-column: auto; position: static; justify-self: end; } }
@media (max-width: 550px) { .site-footer__inner { align-items: flex-start; flex-direction: column; justify-content: center; padding-block: 18px; } .site-footer__note { order: 3; } }
</style>

<style>
:root { --public-shell---background: #0e0f12; }
</style>

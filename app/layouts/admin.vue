<template>
  <div class="admin-shell">
    <aside class="sidebar">
      <origam-btn class="sidebar__brand" to="/" variant="plain">
        <span class="brand__mark"><span /></span>
        <span><strong>{{ t('brand_name', 'CCC') }}</strong><small>{{ t('admin_brand_caption', 'CHAMPIONNAT DE CAPS') }}</small></span>
      </origam-btn>
      <origam-toolbar tag="nav" height="auto" class="sidebar__nav" :aria-label="t('admin_navigation', 'Navigation administration')">
        <p class="sidebar__group">{{ t('admin_tournament', 'TOURNOI') }}</p>
        <origam-btn v-for="item in navigation" :key="item.to" :to="item.to" variant="plain" class="sidebar__link" active-class="sidebar__link--active" exact-active-class="sidebar__link--active"><span class="sidebar__icon" aria-hidden="true" />{{ t(item.key, item.label) }}</origam-btn>
      </origam-toolbar>
      <div class="sidebar__bottom">
        <span class="admin-avatar" aria-hidden="true">A</span>
        <span><strong>{{ t('administrator', 'Administrateur') }}</strong><small>{{ t('admin_role', 'Gestion du tournoi') }}</small></span>
      </div>
    </aside>
    <origam-main class="admin-main">
      <origam-toolbar tag="header" height="auto" class="admin-topbar">
        <origam-btn class="mobile-brand" to="/" variant="plain">{{ t('brand_name', 'CCC') }}</origam-btn>
        <span class="eyebrow">{{ t('admin_workspace', 'ESPACE ADMINISTRATEUR') }}</span>
        <origam-btn class="button admin-topbar__public" to="/" variant="outlined">{{ t('public_site', 'Voir le site public') }} <span aria-hidden="true">↗</span></origam-btn>
      </origam-toolbar>
      <section class="admin-content"><slot name="default" /></section>
    </origam-main>
  </div>
</template>

<script setup lang="ts">
import { useT } from '~/composables/useT'
import { OrigamBtn, OrigamMain, OrigamToolbar } from 'origam/components'
import { ADMIN_NAVIGATION } from '~/consts/admin-navigation.const'

/*********************************************************
 * Admin navigation shell
 *
 * @description
 * Provides the tournament back-office frame and links to its main workflows.
 ********************************************************/
const { t } = useT()
const props = withDefaults(defineProps<{}>(), {})
const emits = defineEmits<{}>()
defineSlots<{ default(): unknown }>()
const navigation = ADMIN_NAVIGATION

/*********************************************************
 * Expose
 *
 * @description
 * The shell has no parent-facing controls.
 ********************************************************/
defineExpose({})
</script>

<style scoped lang="scss">
.admin-shell { display: flex; min-height: 100vh; background: var(--bg); }
.sidebar { position: sticky; top: 0; display: flex; width: 252px; height: 100vh; flex: none; flex-direction: column; padding: 22px 15px 14px; border-right: 1px solid var(--border); background: var(--surface); }
.sidebar__brand { display: flex; align-items: center; gap: 11px; padding: 0 8px 26px; }
.brand__mark { display: grid; width: 34px; height: 34px; flex: none; place-items: center; border: 2px solid var(--accent); border-radius: 50%; }
.brand__mark span { width: 9px; height: 9px; border-radius: 50%; background: var(--accent); }
.sidebar__brand strong { display: block; font-size: 15px; letter-spacing: .03em; }
.sidebar__brand small { display: block; margin-top: 3px; color: var(--faint); font: 9px 'JetBrains Mono', monospace; letter-spacing: .16em; }
.sidebar__nav { display: flex; flex: 1; flex-direction: column; gap: 3px; overflow-y: auto; }
.sidebar__group { margin: 16px 10px 9px; color: var(--faint); font: 10px 'JetBrains Mono', monospace; letter-spacing: .16em; }
.sidebar__link { display: flex; min-height: 42px; align-items: center; gap: 12px; padding: 0 12px; border-radius: 8px; color: var(--muted); font-size: 13px; transition: color .16s ease, background .16s ease; }
.sidebar__link:hover { color: var(--text); background: rgba(255, 255, 255, .035); }
.sidebar__link--active { color: var(--text); background: var(--surface-raised); box-shadow: inset 3px 0 0 var(--accent); }
.sidebar__icon { width: 7px; height: 7px; flex: none; border-radius: 2px; background: currentColor; opacity: .5; }
.sidebar__link--active .sidebar__icon { background: var(--accent); opacity: 1; }
.sidebar__bottom { display: flex; align-items: center; gap: 10px; padding: 16px 5px 1px; border-top: 1px solid var(--border); }
.admin-avatar { display: grid; width: 34px; height: 34px; place-items: center; border: 1px solid var(--border-strong); border-radius: 50%; color: var(--muted); font-size: 12px; font-weight: 700; }
.sidebar__bottom strong, .sidebar__bottom small { display: block; }
.sidebar__bottom strong { font-size: 12px; }
.sidebar__bottom small { margin-top: 3px; color: var(--muted); font: 10px 'JetBrains Mono', monospace; }
.admin-main { min-width: 0; flex: 1; }
.admin-topbar { display: flex; min-height: 70px; align-items: center; justify-content: space-between; gap: 18px; padding: 0 clamp(22px, 4vw, 50px); border-bottom: 1px solid var(--border); background: var(--surface); }
.admin-topbar__public { min-height: 38px; padding-inline: 13px; font-size: 12px; }
.admin-topbar__public span { color: var(--accent); }
.mobile-brand { display: none; font-size: 14px; font-weight: 800; }
.admin-content { width: min(1120px, calc(100% - 64px)); margin: 0 auto; padding-block: 38px 70px; }
@media (max-width: 780px) { .sidebar { width: 72px; padding-inline: 10px; } .sidebar__brand { justify-content: center; padding-inline: 0; } .sidebar__brand > span:last-child, .sidebar__group, .sidebar__link:not(.sidebar__link--active)::after, .sidebar__link { font-size: 0; } .sidebar__link { justify-content: center; padding: 0; } .sidebar__icon { width: 9px; height: 9px; } .sidebar__bottom { justify-content: center; } .sidebar__bottom > span:last-child { display: none; } .admin-content { width: min(100% - 36px, 1120px); } }
@media (max-width: 520px) { .admin-topbar { min-height: 62px; padding-inline: 16px; } .admin-topbar .eyebrow { display: none; } .mobile-brand { display: inline; } .admin-topbar__public { min-height: 34px; padding-inline: 10px; font-size: 11px; } .admin-content { padding-top: 28px; } }
</style>

<style>
:root { --admin-sidebar---width: 252px; --admin-shell---background: #0e0f12; }
</style>

<template>
  <div class="admin-dashboard">
    <origam-toolbar tag="header" height="auto" class="dashboard-head"><div><p class="eyebrow">{{ t('admin_center', 'PILOTAGE · CCC') }}</p><origam-title tag="h1" class="page-heading" font-size="5xl">{{ t('admin_dashboard_title', 'Centre de contrôle') }}</origam-title></div><span class="prototype-badge mono">{{ t('prototype_badge', 'PROTOTYPE · NON CONNECTÉ') }}</span></origam-toolbar>
    <section class="dashboard-banner surface"><div class="edition-symbol" aria-hidden="true">✳</div><div><p class="eyebrow">{{ t('edition_status', 'ÉDITION') }}</p><origam-title tag="h2">{{ t('no_edition_configured', 'Aucune édition configurée') }}</origam-title><p>{{ t('admin_setup_intro', 'Le back-office est prêt à accueillir les éditions après la mise en place des règles et l’import des archives.') }}</p></div><origam-btn class="button" to="/admin/editions" variant="flat">{{ t('configure_editions', 'Voir les éditions') }} <span aria-hidden="true">→</span></origam-btn></section>
    <section class="stats-grid" :aria-label="t('archive_baseline', 'Référence des archives')">
      <article v-for="item in stats" :key="item.key" class="stat-card surface"><p class="eyebrow">{{ t(item.key, item.label) }}</p><strong>{{ item.value }}</strong><span class="stat-card__caption">{{ t(item.captionKey, item.caption) }}</span></article>
    </section>
    <section class="dashboard-lower">
      <article class="workflow-card surface"><origam-toolbar tag="header" height="auto"><div><p class="eyebrow">{{ t('tournament_workflow', 'PARCOURS DU TOURNOI') }}</p><origam-title tag="h2">{{ t('workflow_title', 'Mise en place') }}</origam-title></div><span class="workflow-card__count mono">{{ t('step_count', '01 — 05') }}</span></origam-toolbar><ol class="workflow-list"><li v-for="(item, index) in workflow" :key="item.key"><span class="workflow-list__index mono">0{{ index + 1 }}</span><div><strong>{{ t(item.key, item.label) }}</strong><p>{{ t(item.descriptionKey, item.description) }}</p></div><span class="workflow-list__state">{{ t('pending', 'À FAIRE') }}</span></li></ol></article>
      <article class="quick-links surface"><p class="eyebrow">{{ t('quick_access', 'ACCÈS RAPIDE') }}</p><origam-title tag="h2">{{ t('admin_modules', 'Modules') }}</origam-title><origam-toolbar tag="nav" height="auto" :aria-label="t('admin_modules', 'Modules')"><origam-btn v-for="item in quickLinks" :key="item.key" :to="item.to" variant="plain"><span>{{ t(item.key, item.label) }}</span><span aria-hidden="true">↗</span></origam-btn></origam-toolbar></article>
    </section>
    <p class="prototype-note">{{ t('prototype_security_note', 'Prototype de présentation : les contrôles d’accès et la persistance des actions ne sont pas encore configurés.') }}</p>
  </div>
</template>

<script setup lang="ts">
import { useT } from '~/composables/useT'
import { OrigamBtn, OrigamTitle, OrigamToolbar } from 'origam/components'
import { ADMIN_QUICK_LINKS, ADMIN_STATS, ADMIN_WORKFLOW } from '~/consts/admin-dashboard.const'

/*********************************************************
 * Admin dashboard
 *
 * @description
 * Exposes the main tournament workflow and archive baseline without fake edition state.
 ********************************************************/
definePageMeta({ layout: 'admin' })
const { t } = useT()
const props = withDefaults(defineProps<{}>(), {})
const emits = defineEmits<{}>()
defineSlots<{}>()
const stats = ADMIN_STATS
const workflow = ADMIN_WORKFLOW
const quickLinks = ADMIN_QUICK_LINKS
useHead({ title: t('admin_document_title', 'Administration · CCC') })

/*********************************************************
 * Expose
 *
 * @description
 * This page has no parent-facing controls.
 ********************************************************/
defineExpose({})
</script>

<style scoped lang="scss">
.dashboard-head { display: flex; align-items: end; justify-content: space-between; gap: 20px; }
.dashboard-head .eyebrow { margin: 0 0 13px; }
.prototype-badge { padding: 9px 11px; border: 1px solid rgba(226, 182, 90, .3); border-radius: 7px; color: var(--warning); font-size: 9px; letter-spacing: .08em; }
.dashboard-banner { display: flex; align-items: center; gap: 19px; margin-top: 27px; padding: 23px; background: linear-gradient(110deg, rgba(87, 242, 0, .055), var(--surface) 70%); }
.edition-symbol { display: grid; width: 47px; height: 47px; flex: none; place-items: center; border: 1px solid rgba(87, 242, 0, .5); border-radius: 12px; color: var(--accent); font-size: 22px; }
.dashboard-banner > div:nth-child(2) { flex: 1; }
.dashboard-banner .eyebrow { margin: 0; }
.dashboard-banner h2 { margin: 7px 0 0; font-size: 19px; }
.dashboard-banner p:last-child { margin: 7px 0 0; color: var(--muted); font-size: 12px; line-height: 1.55; }
.dashboard-banner .button { flex: none; }
.stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 14px; }
.stat-card { display: flex; min-height: 130px; flex-direction: column; justify-content: center; padding: 20px; }
.stat-card .eyebrow { margin: 0; }
.stat-card strong { margin-top: 12px; font-size: 36px; letter-spacing: -.06em; }
.stat-card__caption { margin-top: 4px; color: var(--muted); font-size: 11px; }
.dashboard-lower { display: grid; grid-template-columns: 1.45fr .8fr; gap: 13px; margin-top: 14px; }
.workflow-card, .quick-links { padding: 21px; }
.workflow-card header { display: flex; justify-content: space-between; gap: 15px; }
.workflow-card header .eyebrow, .quick-links .eyebrow { margin: 0; }
.workflow-card h2, .quick-links h2 { margin: 9px 0 0; font-size: 20px; }
.workflow-card__count { color: var(--faint); font-size: 9px; }
.workflow-list { display: flex; flex-direction: column; gap: 0; margin: 18px 0 0; padding: 0; list-style: none; }
.workflow-list li { display: flex; align-items: center; gap: 12px; padding: 13px 0; border-top: 1px solid var(--border); }
.workflow-list__index { color: var(--accent); font-size: 9px; }
.workflow-list li > div { flex: 1; }
.workflow-list strong { font-size: 12px; }
.workflow-list p { margin: 4px 0 0; color: var(--muted); font-size: 10px; line-height: 1.4; }
.workflow-list__state { color: var(--faint); font: 8px 'JetBrains Mono', monospace; }
.quick-links nav { margin-top: 18px; }
.quick-links nav a { display: flex; justify-content: space-between; gap: 12px; padding: 13px 0; border-top: 1px solid var(--border); color: var(--muted); font-size: 12px; }
.quick-links nav a:hover { color: var(--text); }
.quick-links nav a span:last-child { color: var(--accent); }
.prototype-note { margin: 14px 0 0; color: var(--faint); font-size: 10px; line-height: 1.55; }
@media (max-width: 860px) { .dashboard-lower { grid-template-columns: 1fr; } }
@media (max-width: 620px) { .dashboard-head { align-items: flex-start; flex-direction: column; } .dashboard-banner { align-items: flex-start; flex-wrap: wrap; } .dashboard-banner > div:nth-child(2) { min-width: calc(100% - 70px); } .stats-grid { grid-template-columns: 1fr; } .stat-card { min-height: 102px; } }
</style>

<style>
:root { --admin-dashboard---card-gap: 13px; }
</style>

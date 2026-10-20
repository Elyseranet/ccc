<template>
  <div class="admin-section-page">
    <origam-toolbar tag="header" height="auto" class="section-heading-row"><div><p class="eyebrow">{{ t(section.kickerKey, section.kicker) }}</p><origam-title tag="h1" class="page-heading" font-size="5xl">{{ t(section.titleKey, section.title) }}</origam-title></div><span class="section-state mono">{{ t(section.statusKey, section.status) }}</span></origam-toolbar>
    <section class="section-intro surface"><span class="intro-icon" aria-hidden="true">✳</span><div><origam-title tag="h2">{{ t('module_overview', 'À propos de ce module') }}</origam-title><p>{{ t(section.descriptionKey, section.description) }}</p></div></section>
    <div class="section-columns">
      <section class="setup-panel surface"><origam-toolbar tag="header" height="auto"><div><p class="eyebrow">{{ t('required_before_action', 'PRÉREQUIS') }}</p><origam-title tag="h2">{{ t('prepare_module', 'Préparer ce module') }}</origam-title></div><span class="mono">01 / 03</span></origam-toolbar><ol><li><span>01</span>{{ t(guidance.firstKey, guidance.firstLabel) }}</li><li><span>02</span>{{ t(guidance.secondKey, guidance.secondLabel) }}</li><li><span>03</span>{{ t(guidance.thirdKey, guidance.thirdLabel) }}</li></ol><p class="setup-panel__note">{{ t('actions_not_enabled', 'Les actions d’écriture seront disponibles une fois l’API, les droits d’accès et la persistance configurés.') }}</p></section>
      <aside class="section-next surface"><p class="eyebrow">{{ t('next_step', 'ÉTAPE SUIVANTE') }}</p><origam-title tag="h2">{{ t(nextSection.titleKey, nextSection.title) }}</origam-title><p>{{ t(nextSection.descriptionKey, nextSection.description) }}</p><origam-btn class="button" :to="guidance.target" density="compact" variant="outlined">{{ t('open_module', 'Ouvrir le module') }} <span aria-hidden="true">→</span></origam-btn></aside>
    </div>
    <p class="section-warning">{{ t('prototype_security_note', 'Prototype de présentation : les contrôles d’accès et la persistance des actions ne sont pas encore configurés.') }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { OrigamBtn, OrigamTitle, OrigamToolbar } from 'origam/components'
import { useRoute } from 'vue-router'
import { useT } from '~/composables/useT'
import { ADMIN_GUIDANCE } from '~/consts/admin-guidance.const'
import { ADMIN_SECTIONS } from '~/consts/admin-sections.const'

/*********************************************************
 * Admin section pages
 *
 * @description
 * Uses one layout for archive, participant, draw, match, bracket and score workflows.
 ********************************************************/
definePageMeta({ layout: 'admin' })
const { t } = useT()
const props = withDefaults(defineProps<{}>(), {})
const emits = defineEmits<{}>()
defineSlots<{}>()
const route = useRoute()
const sectionKey = computed(() => String(route.params.section))
const section = computed(() => ADMIN_SECTIONS[sectionKey.value] ?? ADMIN_SECTIONS.competitors)
const guidance = computed(() => ADMIN_GUIDANCE[sectionKey.value] ?? ADMIN_GUIDANCE.competitors)
const nextSection = computed(() => ADMIN_SECTIONS[guidance.value.target.split('/').at(-1) ?? ''] ?? ADMIN_SECTIONS.participants)
useHead({ title: computed(() => `${section.value.title} · Administration CCC`) })

/*********************************************************
 * Expose
 *
 * @description
 * This page has no parent-facing controls.
 ********************************************************/
defineExpose({})
</script>

<style scoped lang="scss">
.section-heading-row { display: flex; align-items: end; justify-content: space-between; gap: 20px; }
.section-heading-row .eyebrow { margin: 0 0 13px; }
.section-state { padding: 9px 11px; border: 1px solid rgba(226, 182, 90, .3); border-radius: 7px; color: var(--warning); font-size: 9px; letter-spacing: .08em; }
.section-intro { display: flex; align-items: center; gap: 16px; margin-top: 27px; padding: 21px; }
.intro-icon { display: grid; width: 42px; height: 42px; flex: none; place-items: center; border: 1px solid rgba(87, 242, 0, .48); border-radius: 11px; color: var(--accent); }
.section-intro h2 { margin: 0; font-size: 16px; }
.section-intro p { margin: 6px 0 0; color: var(--muted); font-size: 12px; line-height: 1.55; }
.section-columns { display: grid; grid-template-columns: 1.35fr .8fr; gap: 13px; margin-top: 13px; }
.setup-panel, .section-next { padding: 22px; }
.setup-panel header { display: flex; align-items: start; justify-content: space-between; gap: 14px; }
.setup-panel header .eyebrow, .section-next .eyebrow { margin: 0; }
.setup-panel h2, .section-next h2 { margin: 8px 0 0; font-size: 19px; }
.setup-panel header > span { color: var(--faint); font-size: 9px; }
.setup-panel ol { display: flex; flex-direction: column; gap: 0; margin: 17px 0 0; padding: 0; list-style: none; }
.setup-panel li { display: flex; align-items: center; gap: 13px; padding: 15px 0; border-top: 1px solid var(--border); color: var(--muted); font-size: 12px; line-height: 1.5; }
.setup-panel li span { color: var(--accent); font: 10px 'JetBrains Mono', monospace; }
.setup-panel__note { margin: 5px 0 0; padding-top: 13px; border-top: 1px solid var(--border); color: var(--faint); font-size: 10px; line-height: 1.55; }
.section-next { background: linear-gradient(145deg, rgba(87, 242, 0, .04), var(--surface)); }
.section-next p:not(.eyebrow) { margin: 9px 0 20px; color: var(--muted); font-size: 12px; line-height: 1.55; }
.section-warning { margin: 14px 0; color: var(--faint); font-size: 10px; line-height: 1.5; }
@media (max-width: 760px) { .section-columns { grid-template-columns: 1fr; } }
@media (max-width: 550px) { .section-heading-row { align-items: flex-start; flex-direction: column; } }
</style>

<style>
:root { --admin-section---column-gap: 13px; }
</style>

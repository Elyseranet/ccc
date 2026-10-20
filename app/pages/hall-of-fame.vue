<template>
  <div class="page-wrap hof-page">
    <origam-toolbar tag="header" height="auto" class="hof-hero"><p class="eyebrow">{{ t('hall_kicker', 'PALMARÈS HISTORIQUE') }}</p><origam-title tag="h1" class="page-heading" font-size="5xl">{{ t('hall_title', 'Hall of Fame') }}</origam-title><p>{{ t('hall_intro', 'Les distinctions sont calculées automatiquement à partir des résultats validés.') }}</p></origam-toolbar>
    <section class="hof-grid">
      <article v-for="category in categories" :key="category.key" class="hof-card surface"><span class="hof-card__index mono">{{ category.number }}</span><div><p class="eyebrow">{{ t(category.key, category.label) }}</p><origam-title tag="h2">{{ t('hall_pending', 'En attente des archives') }}</origam-title><p>{{ t(category.descriptionKey, category.description) }}</p></div><span class="hof-card__mark" aria-hidden="true">✳</span></article>
    </section>
    <aside class="hof-note"><span class="eyebrow">{{ t('historical_import', 'REPRISE HISTORIQUE') }}</span><p>{{ t('hof_data_note', 'Les éditions et résultats doivent être importés et rapprochés avant de calculer ou publier les distinctions.') }}</p></aside>
  </div>
</template>

<script setup lang="ts">
import { useT } from '~/composables/useT'
import { OrigamTitle, OrigamToolbar } from 'origam/components'
import { HALL_CATEGORIES } from '~/consts/hall-categories.const'

/*********************************************************
 * Historical honors
 *
 * @description
 * Displays the award categories from the design and keeps results empty until import.
 ********************************************************/
const { t } = useT()
const props = withDefaults(defineProps<{}>(), {})
const emits = defineEmits<{}>()
defineSlots<{}>()
const categories = HALL_CATEGORIES
useHead({ title: t('hall_document_title', 'Hall of Fame · Championnat de Caps') })

/*********************************************************
 * Expose
 *
 * @description
 * This page has no parent-facing controls.
 ********************************************************/
defineExpose({})
</script>

<style scoped lang="scss">
.hof-page { padding-block: 64px 82px; }
.hof-hero { max-width: 720px; }
.hof-hero .eyebrow { margin: 0 0 16px; }
.hof-hero > p:last-child { margin: 17px 0 0; color: var(--muted); font-size: 15px; line-height: 1.6; }
.hof-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-top: 36px; }
.hof-card { position: relative; display: flex; min-height: 153px; gap: 18px; padding: 21px; overflow: hidden; }
.hof-card__index { color: var(--accent); font-size: 11px; }
.hof-card .eyebrow { margin: 0; }
.hof-card h2 { margin: 15px 0 0; font-size: 17px; }
.hof-card p:last-child { margin: 6px 0 0; color: var(--muted); font-size: 11px; }
.hof-card__mark { position: absolute; right: 20px; bottom: 12px; color: var(--accent); opacity: .13; font-size: 52px; }
.hof-note { margin-top: 18px; padding: 18px 20px; border: 1px solid var(--border); border-radius: 10px; background: var(--surface); }
.hof-note .eyebrow { margin: 0; }
.hof-note p { margin: 8px 0 0; color: var(--muted); font-size: 12px; line-height: 1.6; }
@media (max-width: 620px) { .hof-grid { grid-template-columns: 1fr; } }
</style>

<style>
:root { --hof-card---minimum-height: 153px; }
</style>

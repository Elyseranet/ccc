<template>
  <div class="page-wrap variants-page">
    <origam-toolbar tag="header" height="auto" class="variants-hero"><p class="eyebrow">{{ t('game_modes', 'MODES DE JEU') }}</p><origam-title tag="h1" class="page-heading" font-size="5xl">{{ t('variants_title', 'Les variantes') }}</origam-title><p>{{ t('variants_intro', 'Les règles principales restent identiques ; seule la disposition des bières change.') }}</p></origam-toolbar>
    <section class="variant-grid">
      <article class="variant-card surface"><origam-toolbar tag="header" height="auto"><span class="eyebrow">{{ t('variant_one', 'VARIANTE 01') }}</span><span class="variant-card__number">01</span></origam-toolbar><figure class="pyramid"><figcaption>{{ t('top_view', 'VUE DU DESSUS') }}</figcaption><span /><span /><span /></figure><origam-title tag="h2">{{ t('variant_pyramid', 'La Pyramide') }}</origam-title><p>{{ t('pyramid_description', '3 bières disposées en triangle.') }}</p></article>
      <article class="variant-card surface"><origam-toolbar tag="header" height="auto"><span class="eyebrow">{{ t('variant_two', 'VARIANTE 02') }}</span><span class="variant-card__number">02</span></origam-toolbar><figure class="bowling"><figcaption>{{ t('top_view', 'VUE DU DESSUS') }}</figcaption><span v-for="pin in pins" :key="pin" /></figure><origam-title tag="h2">{{ t('variant_bowling', 'Le Bowling') }}</origam-title><p>{{ t('bowling_description', '10 bières disposées en triangle, façon quilles de bowling.') }}</p></article>
      <article class="variant-card surface"><origam-toolbar tag="header" height="auto"><span class="eyebrow">{{ t('variant_three', 'VARIANTE 03') }}</span><span class="variant-card__number">03</span></origam-toolbar><figure class="podium"><figcaption>{{ t('side_view', 'VUE DE FACE') }}</figcaption><span>{{ t('podium_left', 'G') }}</span><span>{{ t('podium_center', 'C') }}</span><span>{{ t('podium_right', 'D') }}</span></figure><origam-title tag="h2">{{ t('variant_podium', 'Le Podium') }}</origam-title><p>{{ t('podium_description', '3 hauteurs : haute au centre, moyenne à gauche, basse à droite.') }}</p></article>
    </section>
    <aside class="variants-note"><span aria-hidden="true">✳</span><p>{{ t('variants_common_rules', 'Quelle que soit la variante, les règles principales (touche, contre-caps, bûcheron, finir sa bière) restent identiques.') }}</p></aside>
  </div>
</template>

<script setup lang="ts">
import { useT } from '~/composables/useT'
import { OrigamTitle, OrigamToolbar } from 'origam/components'
import { BOWLING_PINS } from '~/consts/variants.const'

/*********************************************************
 * Public variants
 *
 * @description
 * Shows the three beer arrangements present in the design reference.
 ********************************************************/
const { t } = useT()
const props = withDefaults(defineProps<{}>(), {})
const emits = defineEmits<{}>()
defineSlots<{}>()
const pins = BOWLING_PINS
useHead({ title: t('variants_document_title', 'Variantes · Championnat de Caps') })

/*********************************************************
 * Expose
 *
 * @description
 * This page has no parent-facing controls.
 ********************************************************/
defineExpose({})
</script>

<style scoped lang="scss">
.variants-page { padding-block: 64px 82px; }
.variants-hero { max-width: 700px; }
.variants-hero .eyebrow { margin: 0 0 17px; }
.variants-hero > p:last-child { margin: 18px 0 0; color: var(--muted); font-size: 16px; line-height: 1.6; }
.variant-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-top: 37px; }
.variant-card { padding: 20px; overflow: hidden; }
.variant-card header { display: flex; align-items: center; justify-content: space-between; }
.variant-card header .eyebrow { margin: 0; }
.variant-card__number { color: var(--faint); font: 10px 'JetBrains Mono', monospace; }
.variant-card h2 { margin: 17px 0 0; font-size: 21px; }
.variant-card > p { min-height: 39px; margin: 7px 0 0; color: var(--muted); font-size: 13px; line-height: 1.5; }
.variant-card figure { position: relative; display: flex; height: 180px; align-items: center; justify-content: center; margin: 18px 0 0; border: 1px solid var(--border); border-radius: 10px; background: radial-gradient(circle at center, rgba(87, 242, 0, .055), transparent 70%); }
.variant-card figcaption { position: absolute; top: 12px; left: 13px; color: var(--faint); font: 8px 'JetBrains Mono', monospace; letter-spacing: .12em; }
.pyramid span, .bowling span { position: absolute; width: 30px; height: 30px; border: 1px solid rgba(87, 242, 0, .65); border-radius: 50%; background: var(--accent-soft); box-shadow: 0 0 20px rgba(87, 242, 0, .06); }
.pyramid span:nth-of-type(1) { top: 57px; }
.pyramid span:nth-of-type(2) { top: 105px; left: calc(50% - 31px); }
.pyramid span:nth-of-type(3) { top: 105px; left: calc(50% + 1px); }
.bowling span { width: 19px; height: 19px; }
.bowling span:nth-of-type(1) { top: 51px; }
.bowling span:nth-of-type(2) { top: 76px; left: calc(50% - 13px); }
.bowling span:nth-of-type(3) { top: 76px; left: calc(50% + 13px); }
.bowling span:nth-of-type(4) { top: 101px; left: calc(50% - 39px); }
.bowling span:nth-of-type(5) { top: 101px; left: calc(50% - 13px); }
.bowling span:nth-of-type(6) { top: 101px; left: calc(50% + 13px); }
.bowling span:nth-of-type(7) { top: 101px; left: calc(50% + 39px); }
.bowling span:nth-of-type(8) { top: 126px; left: calc(50% - 39px); }
.bowling span:nth-of-type(9) { top: 126px; left: calc(50% - 13px); }
.bowling span:nth-of-type(10) { top: 126px; left: calc(50% + 13px); }
.podium { gap: 14px; align-items: end !important; padding-bottom: 31px; }
.podium span { display: grid; width: 44px; height: 50px; place-items: center; border: 1px solid rgba(87, 242, 0, .7); border-radius: 7px 7px 2px 2px; color: var(--accent); font: 12px 'JetBrains Mono', monospace; background: var(--accent-soft); }
.podium span:nth-of-type(2) { height: 82px; }
.podium span:nth-of-type(3) { height: 35px; }
.variants-note { display: flex; gap: 12px; margin-top: 18px; padding: 16px 19px; border: 1px solid var(--border); border-radius: 10px; color: var(--muted); }
.variants-note span { color: var(--accent); }
.variants-note p { margin: 0; font-size: 12px; line-height: 1.55; }
@media (max-width: 760px) { .variant-grid { grid-template-columns: 1fr; } }
</style>

<style>
:root { --variants-card---diagram-height: 180px; }
</style>

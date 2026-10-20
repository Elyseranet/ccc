<template>
  <div class="page-wrap rules-page">
    <origam-toolbar tag="header" height="auto" class="rules-hero"><p class="eyebrow">{{ t('official_rules', 'RÈGLEMENT OFFICIEL') }}</p><origam-title tag="h1" class="page-heading" font-size="5xl">{{ t('rules_page_title', 'Les règles du Caps') }}</origam-title><p>{{ t('rules_page_intro', 'Un jeu d’adresse : faire tomber la capsule posée sur la bière adverse. Voici le déroulé d’un point et le fonctionnement du tournoi.') }}</p></origam-toolbar>
    <section class="rules-principle surface"><div><p class="eyebrow">{{ t('principle', 'LE PRINCIPE') }}</p><origam-title tag="h2">{{ t('principle_title', 'Deux joueurs. Une cible. Un point à la fois.') }}</origam-title><p>{{ t('principle_description', 'Les joueurs lancent leur capsule chacun leur tour. Une touche est suivie de la réplique adverse ; le point est marqué si l’adversaire ne touche pas à son tour.') }}</p></div><dl class="rule-facts"><div><dt>{{ t('players', 'JOUEURS') }}</dt><dd>2</dd></div><div><dt>{{ t('distance', 'DISTANCE') }}</dt><dd>2 m</dd></div><div><dt>{{ t('score_targets', 'FORMAT') }}</dt><dd>5 / 10</dd></div></dl></section>
    <section class="rules-section"><p class="eyebrow">{{ t('point_sequence', 'LE DÉROULÉ D’UN POINT') }}</p><ol class="rule-steps"><li><span class="rule-steps__num">01</span><div><origam-title tag="h2">{{ t('throw_title', 'Le lancer') }}</origam-title><p>{{ t('throw_description', 'Le joueur lance sa capsule vers la capsule posée sur la bière adverse.') }}</p></div></li><li><span class="rule-steps__num">02</span><div><origam-title tag="h2">{{ t('reply_title', 'La réplique') }}</origam-title><p>{{ t('reply_description', 'Après une touche, l’adversaire joue à son tour.') }}</p></div></li><li><span class="rule-steps__num">03</span><div><origam-title tag="h2">{{ t('point_title', 'Le point') }}</origam-title><p>{{ t('point_description', 'Si l’adversaire ne touche pas la capsule, le lanceur marque un point.') }}</p></div></li><li><span class="rule-steps__num">04</span><div><origam-title tag="h2">{{ t('counter_title', 'Le contre-caps') }}</origam-title><p>{{ t('counter_description', 'Si l’adversaire touche lui aussi, personne ne marque.') }}</p></div></li></ol></section>
    <section class="score-formats"><article class="surface"><p class="eyebrow">{{ t('group_stage', 'PHASE DE POULES') }}</p><strong>5</strong><origam-title tag="h2">{{ t('points', 'points') }}</origam-title><p>{{ t('groups_score_note', 'Les matchs de poule se jouent en 5 points.') }}</p></article><article class="surface"><p class="eyebrow">{{ t('final_stage', 'PHASE FINALE') }}</p><strong>10</strong><origam-title tag="h2">{{ t('points', 'points') }}</origam-title><p>{{ t('final_score_note', 'Les matchs du bracket se jouent en 10 points.') }}</p></article></section>
    <aside class="rules-callout"><span aria-hidden="true">!</span><p>{{ t('woodcutter_note', 'Le bûcheron ne compte pas : toucher la bière sans faire tomber la capsule posée dessus ne rapporte pas de point.') }}</p></aside>
  </div>
</template>

<script setup lang="ts">
import { useT } from '~/composables/useT'
import { OrigamTitle, OrigamToolbar } from 'origam/components'

/*********************************************************
 * Public rules
 *
 * @description
 * Presents the gameplay and scoring formats shown in the design reference.
 ********************************************************/
const { t } = useT()
const props = withDefaults(defineProps<{}>(), {})
const emits = defineEmits<{}>()
defineSlots<{}>()
useHead({ title: t('rules_document_title', 'Règles · Championnat de Caps') })

/*********************************************************
 * Expose
 *
 * @description
 * This page has no parent-facing controls.
 ********************************************************/
defineExpose({})
</script>

<style scoped lang="scss">
.rules-page { padding-block: 64px 82px; }
.rules-hero { max-width: 760px; }
.rules-hero .eyebrow { margin: 0 0 17px; }
.rules-hero > p:last-child { max-width: 680px; margin: 19px 0 0; color: var(--muted); font-size: 16px; line-height: 1.65; }
.rules-principle { display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 30px; margin-top: 38px; padding: clamp(24px, 4vw, 42px); background: linear-gradient(115deg, rgba(87, 242, 0, .05), var(--surface) 60%); }
.rules-principle .eyebrow { margin: 0; }
.rules-principle h2 { margin: 15px 0 0; font-size: clamp(24px, 3vw, 34px); letter-spacing: -.04em; }
.rules-principle > div > p:last-child { max-width: 630px; margin: 12px 0 0; color: var(--muted); line-height: 1.65; }
.rule-facts { display: grid; grid-template-columns: repeat(3, auto); gap: 22px; margin: 0; }
.rule-facts div { min-width: 72px; }
.rule-facts dt { color: var(--faint); font: 9px 'JetBrains Mono', monospace; letter-spacing: .1em; }
.rule-facts dd { margin: 9px 0 0; font-size: 25px; font-weight: 700; }
.rules-section { margin-top: 43px; }
.rules-section > .eyebrow { margin: 0 0 15px; }
.rule-steps { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 0; padding: 0; list-style: none; }
.rule-steps li { display: flex; min-height: 160px; flex-direction: column; padding: 19px; border: 1px solid var(--border); border-radius: 12px; background: var(--surface); }
.rule-steps__num { color: var(--accent); font: 11px 'JetBrains Mono', monospace; }
.rule-steps h2 { margin: 21px 0 0; font-size: 17px; }
.rule-steps p { margin: 7px 0 0; color: var(--muted); font-size: 12px; line-height: 1.55; }
.score-formats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-top: 30px; }
.score-formats article { padding: 23px; }
.score-formats .eyebrow { margin: 0; }
.score-formats strong { display: inline-block; margin-top: 18px; font-size: 44px; letter-spacing: -.06em; }
.score-formats h2 { display: inline-block; margin: 0 0 0 9px; font-size: 17px; }
.score-formats article > p:last-child { margin: 4px 0 0; color: var(--muted); font-size: 12px; }
.rules-callout { display: flex; align-items: center; gap: 13px; margin-top: 16px; padding: 16px 19px; border: 1px solid rgba(226, 182, 90, .25); border-radius: 10px; background: rgba(226, 182, 90, .05); }
.rules-callout span { display: grid; width: 23px; height: 23px; flex: none; place-items: center; border: 1px solid var(--warning); border-radius: 50%; color: var(--warning); font-size: 12px; }
.rules-callout p { margin: 0; color: var(--muted); font-size: 12px; line-height: 1.55; }
@media (max-width: 760px) { .rules-principle { grid-template-columns: 1fr; } .rule-facts { grid-template-columns: repeat(3, 1fr); } .rule-steps { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 480px) { .rule-steps { grid-template-columns: 1fr; } .score-formats { grid-template-columns: 1fr; } }
</style>

<style>
:root { --rules-page---section-gap: 30px; }
</style>

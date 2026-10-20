<template>
  <div class="page-wrap competition-page">
    <origam-toolbar tag="header" height="auto" class="page-head">
      <div><p class="eyebrow">{{ t('competition_kicker', 'CHAMPIONNAT · ARCHIVES') }}</p><origam-title tag="h1" class="page-heading" font-size="5xl">{{ t('competition_title', 'La compétition') }}</origam-title></div>
      <span class="archive-badge mono">{{ t('archive_read_only', 'ARCHIVES À IMPORTER') }}</span>
    </origam-toolbar>
    <origam-toolbar tag="nav" height="auto" class="competition-tabs" :aria-label="t('competition_sections', 'Sections de la compétition')">
      <origam-btn class="competition-tabs__item competition-tabs__item--active" href="#overview" variant="plain">{{ t('competition_overview', 'Vue d’ensemble') }}</origam-btn>
      <origam-btn class="competition-tabs__item" href="#groups" variant="plain">{{ t('groups', 'Poules') }}</origam-btn>
      <origam-btn class="competition-tabs__item" href="#bracket" variant="plain">{{ t('bracket', 'Bracket') }}</origam-btn>
      <origam-btn class="competition-tabs__item" href="#scores" variant="plain">{{ t('scores', 'Scores') }}</origam-btn>
    </origam-toolbar>
    <section id="overview" class="competition-empty surface">
      <span class="empty-mark" aria-hidden="true">✳</span>
      <div><p class="eyebrow">{{ t('no_active_edition_kicker', 'ÉDITION') }}</p><origam-title tag="h2" class="section-heading">{{ t('no_active_edition', 'Aucune édition active publiée') }}</origam-title><p>{{ t('competition_archive_message', 'Les résultats historiques doivent être repris et contrôlés avant leur affichage. Cette page se remplira à partir des éditions enregistrées dans le tournoi.') }}</p></div>
      <origam-btn class="button" to="/hall-of-fame" variant="outlined">{{ t('browse_history', 'Parcourir les archives') }} <span aria-hidden="true">↗</span></origam-btn>
    </section>
    <section id="groups" class="tournament-cards">
      <article class="tournament-card surface"><p class="eyebrow">01 · {{ t('groups', 'POULES') }}</p><origam-title tag="h2">{{ t('groups_title', 'Phase de poules') }}</origam-title><p>{{ t('groups_intro', 'Classements, rencontres et progression des joueurs au sein de chaque poule.') }}</p><span class="mono">{{ t('score_target_groups', 'FORMAT · 5 POINTS') }}</span></article>
      <article id="bracket" class="tournament-card surface"><p class="eyebrow">02 · {{ t('bracket', 'PHASE FINALE') }}</p><origam-title tag="h2">{{ t('bracket_title', 'Le bracket') }}</origam-title><p>{{ t('bracket_intro', 'Tableau à élimination directe avec tirage des adversaires à chaque tour.') }}</p><span class="mono">{{ t('score_target_bracket', 'FORMAT · 10 POINTS') }}</span></article>
      <article id="scores" class="tournament-card surface"><p class="eyebrow">03 · {{ t('scores', 'RÉSULTATS') }}</p><origam-title tag="h2">{{ t('scores_title', 'Scores & statistiques') }}</origam-title><p>{{ t('scores_intro', 'Les classements et statistiques sont calculés depuis les scores validés.') }}</p><span class="mono">{{ t('validated_results', 'SCORES VALIDÉS') }}</span></article>
    </section>
  </div>
</template>

<script setup lang="ts">
import { useT } from '~/composables/useT'
import { OrigamBtn, OrigamTitle, OrigamToolbar } from 'origam/components'

/*********************************************************
 * Competition archive landing
 *
 * @description
 * Shows the public competition areas without presenting unimported data as fact.
 ********************************************************/
const { t } = useT()
const props = withDefaults(defineProps<{}>(), {})
const emits = defineEmits<{}>()
defineSlots<{}>()
useHead({ title: t('competition_document_title', 'Compétition · Championnat de Caps') })

/*********************************************************
 * Expose
 *
 * @description
 * This page has no parent-facing controls.
 ********************************************************/
defineExpose({})
</script>

<style scoped lang="scss">
.competition-page { padding-block: 54px 80px; }
.page-head { display: flex; align-items: end; justify-content: space-between; gap: 18px; }
.page-head .eyebrow { margin: 0 0 15px; }
.archive-badge { padding: 9px 12px; border: 1px solid var(--border-strong); border-radius: 7px; color: var(--warning); font-size: 9px; letter-spacing: .1em; }
.competition-tabs { display: flex; gap: 24px; margin-top: 35px; border-bottom: 1px solid var(--border); overflow-x: auto; }
.competition-tabs__item { flex: none; padding: 0 3px 13px; border-bottom: 2px solid transparent; color: var(--muted); font-size: 13px; font-weight: 600; }
.competition-tabs__item--active, .competition-tabs__item:hover { border-bottom-color: var(--accent); color: var(--text); }
.competition-empty { display: flex; align-items: center; gap: 22px; margin-top: 25px; padding: 25px; }
.competition-empty > div { flex: 1; }
.competition-empty .eyebrow { margin: 0 0 9px; }
.competition-empty p:not(.eyebrow) { max-width: 610px; margin: 10px 0 0; color: var(--muted); font-size: 14px; line-height: 1.6; }
.empty-mark { display: grid; width: 48px; height: 48px; flex: none; place-items: center; border: 1px solid var(--border-strong); border-radius: 13px; color: var(--accent); font-size: 24px; }
.competition-empty .button { flex: none; }
.tournament-cards { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 13px; margin-top: 30px; }
.tournament-card { min-height: 220px; padding: 24px; }
.tournament-card .eyebrow { margin: 0; }
.tournament-card h2 { margin: 28px 0 0; font-size: 21px; letter-spacing: -.03em; }
.tournament-card p:not(.eyebrow) { min-height: 45px; margin: 10px 0 18px; color: var(--muted); font-size: 13px; line-height: 1.5; }
.tournament-card .mono { color: var(--faint); font-size: 9px; letter-spacing: .1em; }
@media (max-width: 760px) { .page-head { align-items: flex-start; flex-direction: column; } .competition-empty { align-items: flex-start; flex-wrap: wrap; } .competition-empty > div { min-width: calc(100% - 75px); } .tournament-cards { grid-template-columns: 1fr; } .tournament-card { min-height: auto; } .tournament-card h2 { margin-top: 18px; } }
</style>

<style>
:root { --competition-page---empty-state-gap: 22px; }
</style>

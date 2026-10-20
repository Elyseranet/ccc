<template>
  <div>
    <section class="hero">
      <div class="page-wrap hero__inner">
        <p class="eyebrow"><span class="live-dot" />{{ t('hero_kicker', 'CHAMPIONNAT DE CAPS') }}</p>
        <origam-title tag="h1" class="hero__title" font-size="cccHero">{{ t('hero_title_first', 'CHAMPIONNAT') }}<br>{{ t('hero_title_second', 'DE CAPS') }}</origam-title>
        <p class="hero__lead">{{ t('hero_intro', 'Le tournoi annuel du CCC : poules, bracket et palmarès. Retrouvez les éditions et les compétiteurs du championnat.') }}</p>
        <p class="hero__edition mono"><span>{{ t('archive_label', 'ARCHIVES') }}</span>{{ t('archive_detail', '2012 — aujourd’hui') }}</p>
        <origam-toolbar tag="nav" height="auto" class="hero__actions" :aria-label="t('home_actions', 'Découvrir le championnat')">
          <origam-btn class="button" to="/competition" variant="flat">{{ t('view_competition', 'Voir la compétition') }} <span aria-hidden="true">↗</span></origam-btn>
          <origam-btn class="button" to="/hall-of-fame" variant="outlined">{{ t('view_hall_of_fame', 'Le palmarès') }}</origam-btn>
        </origam-toolbar>
      </div>
      <div class="hero__orbit" aria-hidden="true"><span /><span /><span /></div>
    </section>

    <section class="archive-strip" :aria-label="t('archive_statistics', 'Données des archives')">
      <div class="page-wrap archive-strip__grid">
        <article class="archive-stat"><strong>16</strong><span>{{ t('editions', 'ÉDITIONS') }}</span></article>
        <article class="archive-stat"><strong>145</strong><span>{{ t('players', 'COMPÉTITEURS') }}</span></article>
        <article class="archive-stat"><strong>1 414</strong><span>{{ t('matches', 'MATCHS ARCHIVÉS') }}</span></article>
      </div>
    </section>

    <section class="home-feature page-wrap">
      <article class="feature-card title-card">
        <p class="eyebrow">{{ t('the_game', 'LE JEU') }}</p>
        <origam-title tag="h2">{{ t('game_title', 'Décapsule la bière de ton adversaire.') }}</origam-title>
        <p>{{ t('game_description', 'Deux joueurs assis, leurs bières espacées de 2 mètres. On lance la capsule pour faire tomber celle posée sur la bière adverse — 5 points en poule, 10 en phase finale.') }}</p>
        <origam-btn class="text-link" to="/rules" variant="plain">{{ t('read_rules', 'Lire les règles complètes') }} <span aria-hidden="true">→</span></origam-btn>
      </article>
      <article class="feature-card explore-card">
        <p class="eyebrow">{{ t('explore', 'EXPLORER') }}</p>
        <origam-btn v-for="item in exploreLinks" :key="item.key" class="explore-link" :to="item.to" variant="plain"><span>{{ t(item.key, item.label) }}</span><span aria-hidden="true">↗</span></origam-btn>
      </article>
    </section>
    <p class="page-wrap data-note">{{ t('archive_data_note', 'Les chiffres affichés proviennent des spécifications d’import des archives. Les résultats restent à rattacher aux données reprises.') }}</p>
  </div>
</template>

<script setup lang="ts">
import { useT } from '~/composables/useT'
import { OrigamBtn, OrigamTitle, OrigamToolbar } from 'origam/components'
import { HOME_EXPLORE_LINKS } from '~/consts/home-links.const'

/*********************************************************
 * Home page content
 *
 * @description
 * Presents the tournament and links to the public information areas.
 ********************************************************/
const { t } = useT()
const props = withDefaults(defineProps<{}>(), {})
const emits = defineEmits<{}>()
defineSlots<{}>()
useHead({ title: t('home_document_title', 'Championnat de Caps · CCC') })

const exploreLinks = HOME_EXPLORE_LINKS

/*********************************************************
 * Expose
 *
 * @description
 * The home page has no parent-facing controls.
 ********************************************************/
defineExpose({})
</script>

<style scoped lang="scss">
.hero { position: relative; overflow: hidden; border-bottom: 1px solid var(--border); background: radial-gradient(ellipse at 78% 34%, rgba(87, 242, 0, .08), transparent 43%); }
.hero__inner { position: relative; z-index: 1; padding-block: clamp(78px, 11vw, 142px) clamp(66px, 9vw, 112px); }
.hero .eyebrow { display: flex; align-items: center; gap: 10px; }
.live-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--accent); box-shadow: 0 0 16px var(--accent); }
.hero__title { margin: 24px 0 0; font-size: clamp(62px, 10vw, 126px); font-weight: 800; letter-spacing: -.065em; line-height: .84; }
.hero__lead { max-width: 600px; margin: 30px 0 0; color: var(--muted); font-size: clamp(16px, 2vw, 19px); line-height: 1.6; }
.hero__edition { display: flex; align-items: center; gap: 15px; margin-top: 29px; color: var(--muted); font-size: 13px; }
.hero__edition span { padding: 8px 11px; border: 1px solid var(--accent); border-radius: 7px; color: var(--accent); font-size: 10px; letter-spacing: .1em; }
.hero__actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 28px; }
.hero__orbit { position: absolute; top: 15%; right: max(-90px, calc((100vw - 1440px) / 2)); width: min(38vw, 470px); aspect-ratio: 1; border: 1px solid rgba(87, 242, 0, .14); border-radius: 50%; opacity: .7; }
.hero__orbit::before, .hero__orbit::after { position: absolute; inset: 12%; border: 1px solid rgba(87, 242, 0, .12); border-radius: 50%; content: ''; }
.hero__orbit::after { inset: 27%; }
.hero__orbit span { position: absolute; top: 24%; left: 21%; width: 9px; height: 9px; border-radius: 50%; background: var(--accent); box-shadow: 0 0 20px var(--accent); }
.hero__orbit span:nth-child(2) { top: 65%; left: 69%; width: 5px; height: 5px; }
.hero__orbit span:nth-child(3) { top: 45%; left: 50%; width: 3px; height: 3px; }
.archive-strip { border-bottom: 1px solid var(--border); background: #111216; }
.archive-strip__grid { display: grid; grid-template-columns: repeat(3, 1fr); }
.archive-stat { display: flex; min-height: 142px; flex-direction: column; justify-content: center; padding-inline: clamp(18px, 4vw, 54px); border-right: 1px solid var(--border); }
.archive-stat:first-child { padding-left: 0; }
.archive-stat:last-child { border-right: 0; }
.archive-stat strong { font-size: clamp(36px, 5vw, 52px); letter-spacing: -.05em; }
.archive-stat span { margin-top: 6px; color: var(--muted); font: 10px 'JetBrains Mono', monospace; letter-spacing: .13em; }
.home-feature { display: grid; grid-template-columns: 1.1fr .9fr; margin-block: 42px 22px; border: 1px solid var(--border); border-radius: 14px; overflow: hidden; }
.feature-card { padding: clamp(26px, 5vw, 54px); }
.title-card { border-right: 1px solid var(--border); background: linear-gradient(135deg, rgba(87, 242, 0, .045), transparent 65%); }
.title-card h2 { max-width: 530px; margin: 14px 0 0; font-size: clamp(30px, 4vw, 44px); letter-spacing: -.05em; line-height: 1.02; }
.title-card > p:not(.eyebrow) { max-width: 500px; margin: 18px 0 0; color: var(--muted); line-height: 1.65; }
.text-link { display: inline-flex; align-items: center; gap: 10px; margin-top: 24px; color: var(--accent); font-size: 14px; font-weight: 600; }
.explore-card { display: flex; flex-direction: column; }
.explore-card > .eyebrow { margin: 0 0 12px; }
.explore-link { display: flex; justify-content: space-between; gap: 18px; padding: 17px 0; border-bottom: 1px solid var(--border); font-size: 17px; font-weight: 600; }
.explore-link:last-child { border-bottom: 0; }
.explore-link span:last-child { color: var(--accent); }
.data-note { margin-block: 0 42px; color: var(--faint); font-size: 11px; line-height: 1.5; }
@media (max-width: 700px) { .hero__orbit { top: 12%; right: -34%; width: 70vw; opacity: .42; } .hero__inner { padding-top: 76px; } .archive-stat { min-height: 108px; padding-inline: 12px; } .archive-stat span { font-size: 8px; letter-spacing: .06em; } .home-feature { grid-template-columns: 1fr; } .title-card { border-right: 0; border-bottom: 1px solid var(--border); } }
</style>

<style>
:root { --home-hero---glow: rgba(87, 242, 0, .08); }
</style>

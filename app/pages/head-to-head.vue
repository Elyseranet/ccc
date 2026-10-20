<template>
  <div class="page-wrap faceoff-page">
    <origam-toolbar tag="header" height="auto" class="faceoff-head"><div><p class="eyebrow">{{ t('player_comparison', 'JOUEURS · COMPARAISON') }}</p><origam-title tag="h1" class="page-heading" font-size="5xl">{{ t('faceoff_title', 'Face-à-Face') }}</origam-title><p>{{ t('faceoff_intro', 'Comparez le bilan de deux compétiteurs dans les archives du championnat.') }}</p></div><origam-btn class="button" to="/players" variant="outlined">{{ t('players_directory', 'Annuaire') }} <span aria-hidden="true">↗</span></origam-btn></origam-toolbar>
    <origam-form class="faceoff-selectors surface" @submit.prevent="handleCompare">
      <fieldset><legend>{{ t('first_player', 'Premier joueur') }}</legend><origam-select id="player-a" v-model="playerA" :items="[]" :label="t('select_player', 'Sélectionner un compétiteur')" :placeholder="t('profiles_not_imported', 'Profils non importés')" disabled /></fieldset>
      <span class="faceoff-vs">VS</span>
      <fieldset><legend>{{ t('second_player', 'Second joueur') }}</legend><origam-select id="player-b" v-model="playerB" :items="[]" :label="t('select_player', 'Sélectionner un compétiteur')" :placeholder="t('profiles_not_imported', 'Profils non importés')" disabled /></fieldset>
    </origam-form>
    <section class="faceoff-empty surface"><div class="faceoff-mark" aria-hidden="true">VS</div><p class="eyebrow">{{ t('archive_required', 'ARCHIVES REQUISES') }}</p><origam-title tag="h2">{{ t('faceoff_empty_title', 'Aucune confrontation à afficher') }}</origam-title><p>{{ t('faceoff_empty_description', 'Les compétiteurs et les scores doivent être importés avant de pouvoir comparer leurs rencontres.') }}</p></section>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useT } from '~/composables/useT'
import { OrigamBtn, OrigamForm, OrigamSelect, OrigamTitle, OrigamToolbar } from 'origam/components'

/*********************************************************
 * Head-to-head comparison
 *
 * @description
 * Exposes the archive comparison screen while historical profiles are unavailable.
 ********************************************************/
const { t } = useT()
const props = withDefaults(defineProps<{}>(), {})
const emits = defineEmits<{}>()
defineSlots<{}>()
const playerA = ref('')
const playerB = ref('')
useHead({ title: t('faceoff_document_title', 'Face-à-Face · Championnat de Caps') })

const handleCompare = () => undefined

/*********************************************************
 * Expose
 *
 * @description
 * This page has no parent-facing controls.
 ********************************************************/
defineExpose({})
</script>

<style scoped lang="scss">
.faceoff-page { padding-block: 58px 80px; }
.faceoff-head { display: flex; align-items: end; justify-content: space-between; gap: 18px; }
.faceoff-head .eyebrow { margin: 0 0 15px; }
.faceoff-head p:last-child { margin: 12px 0 0; color: var(--muted); font-size: 14px; }
.faceoff-selectors { display: grid; grid-template-columns: 1fr 70px 1fr; align-items: center; gap: 18px; margin-top: 32px; padding: 24px; }
.faceoff-selectors fieldset { min-width: 0; margin: 0; padding: 0; border: 0; }
.faceoff-selectors legend { margin-bottom: 12px; font-size: 13px; font-weight: 700; }
.faceoff-vs { justify-self: center; color: var(--accent); font: 700 13px 'JetBrains Mono', monospace; }
.faceoff-empty { display: flex; min-height: 270px; align-items: center; flex-direction: column; justify-content: center; margin-top: 14px; padding: 28px; text-align: center; }
.faceoff-mark { display: grid; width: 58px; height: 58px; place-items: center; border: 1px solid rgba(87, 242, 0, .55); border-radius: 50%; color: var(--accent); font: 700 13px 'JetBrains Mono', monospace; }
.faceoff-empty .eyebrow { margin: 19px 0 0; }
.faceoff-empty h2 { margin: 9px 0 0; font-size: 23px; letter-spacing: -.03em; }
.faceoff-empty > p:last-child { max-width: 520px; margin: 9px 0 0; color: var(--muted); font-size: 12px; line-height: 1.55; }
@media (max-width: 640px) { .faceoff-head { align-items: flex-start; flex-direction: column; } .faceoff-selectors { grid-template-columns: 1fr; } .faceoff-vs { padding: 2px 0; } }
</style>

<style>
:root { --faceoff-form---control-height: 47px; }
</style>

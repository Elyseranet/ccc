<template>
  <div class="page-wrap players-page">
    <origam-toolbar tag="header" height="auto" class="page-head">
      <div><p class="eyebrow">{{ t('players_kicker', 'ANNUAIRE · ARCHIVES') }}</p><origam-title tag="h1" class="page-heading" font-size="5xl">{{ t('players_title', 'Les compétiteurs') }}</origam-title><p class="page-intro">{{ t('players_intro', 'Profils uniques, participations et statistiques du championnat.') }}</p></div>
      <origam-btn class="button" to="/head-to-head" variant="outlined">{{ t('compare_players', 'Face-à-Face') }} <span aria-hidden="true">↗</span></origam-btn>
    </origam-toolbar>
    <origam-form class="search-box" role="search" @submit.prevent="handleSearch">
      <origam-label class="search-box__label" name="player-search">{{ t('search_players', 'Rechercher un joueur') }}</origam-label>
      <span aria-hidden="true">⌕</span><origam-text-field id="player-search" v-model="searchTerm" type="search" :placeholder="t('search_player_placeholder', 'Nom ou surnom…')" /><origam-btn class="button" density="compact" type="submit" variant="flat">{{ t('search_action', 'Rechercher') }}</origam-btn>
    </origam-form>
    <section class="directory-summary surface">
      <div><span class="eyebrow">{{ t('profiles_to_import', 'PROFILS HISTORIQUES') }}</span><strong>145</strong><p>{{ t('profiles_import_note', 'Profils recensés dans la spécification de reprise, pas encore importés.') }}</p></div>
      <span class="directory-summary__status mono">{{ t('import_pending', 'IMPORT EN ATTENTE') }}</span>
    </section>
    <section class="empty-directory surface" aria-live="polite">
      <span class="empty-mark" aria-hidden="true">⌕</span>
      <origam-title tag="h2" class="section-heading">{{ hasSearch ? t('search_unavailable_title', 'La recherche sera disponible après l’import') : t('directory_empty_title', 'L’annuaire sera disponible après l’import') }}</origam-title>
      <p>{{ hasSearch ? t('search_unavailable_description', 'Aucun profil n’est encore chargé dans l’application.') : t('directory_empty_description', 'Les données des compétiteurs doivent être rapprochées et vérifiées avant publication.') }}</p>
      <origam-btn class="text-link" to="/hall-of-fame" variant="plain">{{ t('browse_hall', 'Voir le Hall of Fame') }} <span aria-hidden="true">→</span></origam-btn>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { OrigamBtn, OrigamForm, OrigamLabel, OrigamTextField, OrigamTitle, OrigamToolbar } from 'origam/components'
import { useT } from '~/composables/useT'

/*********************************************************
 * Competitor directory
 *
 * @description
 * Shows import status and accepts a search term without pretending archive data is loaded.
 ********************************************************/
const { t } = useT()
const props = withDefaults(defineProps<{}>(), {})
const emits = defineEmits<{}>()
defineSlots<{}>()
const searchTerm = ref('')
const hasSearch = computed(() => searchTerm.value.trim().length > 0)
useHead({ title: t('players_document_title', 'Compétiteurs · Championnat de Caps') })

const handleSearch = () => {
  searchTerm.value = searchTerm.value.trim()
}

/*********************************************************
 * Expose
 *
 * @description
 * This page has no parent-facing controls.
 ********************************************************/
defineExpose({})
</script>

<style scoped lang="scss">
.players-page { padding-block: 54px 80px; }
.page-head { display: flex; align-items: end; justify-content: space-between; gap: 20px; }
.page-head .eyebrow { margin: 0 0 15px; }
.page-intro { margin: 13px 0 0; color: var(--muted); font-size: 15px; }
.search-box { display: flex; align-items: center; gap: 12px; margin-top: 32px; padding: 10px 12px 10px 16px; border: 1px solid var(--border-strong); border-radius: 10px; background: var(--surface); color: var(--muted); }
.search-box__label { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; }
.search-box > span { font-size: 22px; }
.search-box input { min-width: 0; flex: 1; border: 0; outline: 0; color: var(--text); background: transparent; }
.search-box input::placeholder { color: var(--faint); }
.directory-summary { display: flex; align-items: center; justify-content: space-between; gap: 20px; margin-top: 18px; padding: 22px 24px; }
.directory-summary strong { display: block; margin-top: 8px; font-size: 34px; letter-spacing: -.04em; }
.directory-summary p { margin: 6px 0 0; color: var(--muted); font-size: 12px; }
.directory-summary__status { color: var(--warning); font-size: 9px; letter-spacing: .1em; }
.empty-directory { display: flex; min-height: 250px; align-items: center; flex-direction: column; justify-content: center; margin-top: 18px; padding: 26px; text-align: center; }
.empty-mark { display: grid; width: 44px; height: 44px; place-items: center; border: 1px solid var(--border-strong); border-radius: 50%; color: var(--accent); font-size: 21px; }
.empty-directory h2 { margin: 18px 0 0; font-size: 22px; }
.empty-directory p { max-width: 490px; margin: 9px 0 0; color: var(--muted); font-size: 13px; line-height: 1.6; }
.text-link { display: inline-flex; gap: 8px; margin-top: 17px; color: var(--accent); font-size: 13px; font-weight: 600; }
@media (max-width: 620px) { .page-head { align-items: flex-start; flex-direction: column; } .search-box { gap: 8px; padding-inline: 12px; } }
</style>

<style>
:root { --players-directory---card-radius: 14px; }
</style>

import { computed } from 'vue'
import type { MaybeRefOrGetter } from 'vue'
import { useEdition } from '~/composables/useEdition'
import { useEditions } from '~/composables/useEditions'
import { fromAsyncDataError } from '~/utils/async-data-error.util'
import {
  buildEditionFacts,
  buildEditionHeroMeta,
  buildEditionParticipants,
  buildEditionPodium,
  buildEditionRoundDraws,
  buildEditionSeeds,
  buildEditionSteps,
  editionOption,
  findPoolsDraw
} from '~/utils/edition-view.util'

/*********************************************************
 * useEditionView
 *
 * @description
 * Données d'une édition (`code` de l'URL, R-9) mises en forme pour la page : en-tête, podium, chiffres, déroulé,
 * participants, têtes de série et tirages. Toute la mise en forme est dans `edition-view.util` (testée en unitaire) ;
 * ce composable ne fait que brancher les requêtes et les `computed`. Les requêtes sont attendues : le HTML rendu côté
 * serveur contient déjà les données (pas de décalage d'hydratation).
 ********************************************************/
export const useEditionView = async (code: MaybeRefOrGetter<string>) => {
  const editionRequest = useEdition(code)
  const editionsRequest = useEditions()
  await Promise.all([editionRequest, editionsRequest])
  const { data: edition, pending, error, refresh } = editionRequest
  const { data: editions } = editionsRequest
  const hasEdition = computed(() => edition.value !== null && edition.value !== undefined)
  const pageError = computed(() => (error.value ? fromAsyncDataError(error.value) : null))
  const heroMeta = computed(() => (edition.value ? buildEditionHeroMeta(edition.value) : null))
  const podium = computed(() => (edition.value ? buildEditionPodium(edition.value) : null))
  const facts = computed(() => (edition.value ? buildEditionFacts(edition.value) : []))
  const steps = computed(() => (edition.value ? buildEditionSteps(edition.value.status) : []))
  const participants = computed(() => (edition.value ? buildEditionParticipants(edition.value) : []))
  const seeds = computed(() => (edition.value ? buildEditionSeeds(edition.value) : []))
  const poolsDraw = computed(() => (edition.value ? findPoolsDraw(edition.value) : null))
  const roundDraws = computed(() => (edition.value ? buildEditionRoundDraws(edition.value) : []))
  const options = computed(() => [...(editions.value ?? [])].sort((a, b) => b.year - a.year || b.code.localeCompare(a.code)).map(editionOption))
  return { edition, pending, pageError, refresh, hasEdition, heroMeta, podium, facts, steps, participants, seeds, poolsDraw, roundDraws, options }
}

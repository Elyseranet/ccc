import { computed, ref, watch } from 'vue'
import { useAdminEdition } from '~/composables/useAdminEdition'
import { useAdminEditionStore } from '~/composables/useAdminEditionStore'
import { useDebouncedValue } from '~/composables/useDebouncedValue'
import { useEditions } from '~/composables/useEditions'
import { ADMIN_QUALIFICATION_ASYNC_KEY, QUALIFICATION_SIMULATION_DELAY_MS } from '~/consts/qualification-view.const'
import { EDITION_STATUS } from '~/enums/edition.enum'
import { QUALIFICATION_BLOCKER, QUALIFICATION_FAILURE } from '~/enums/qualification.enum'
import type { IQualificationInputs, IQualificationTieView } from '~/interfaces/qualification-view.interface'
import type { IQualificationParameters, IQualificationStatus } from '~/interfaces/qualification.interface'
import { QualificationService } from '~/services/qualification.service'
import { fromAsyncDataError, toAsyncDataError } from '~/utils/async-data-error.util'
import { blockerOf, boundsOf, checkInputs, initialInputs, pendingRegularCount, prerequisitesOf, qualifiedRowsOf, rankTablesOf, stepsOf, tieViewsOf } from '~/utils/qualification-view.util'
import { toQualificationFailure } from '~/utils/qualification-failure.util'

/*********************************************************
 * useQualification
 *
 * @description
 * État de la qualification de l'édition active (`GET /admin/editions/{id}/qualification`, B-13) et ses deux écritures : créer un départage,
 * arrêter la liste. Le serveur est la source de vérité : égalités, départage suivant et qualifiés viennent de sa réponse, rien n'est recalculé ici.
 * Simulation : chaque changement valide des champs relance la lecture avec `?topPerPool=&bestNextCount=`, après `QUALIFICATION_SIMULATION_DELAY_MS`
 * (une requête par pause, pas par touche) ; un champ invalide n'envoie rien et garde l'état précédent. Une fois la liste arrêtée, la configuration
 * enregistrée prime et les champs sont en lecture seule. Clé de cache fixe (même raison que `useMatchQueue`) : le changement d'édition relance la requête.
 * Contexte Nuxt : `useRequestFetch` et `useAsyncData` avant le premier `await`.
 ********************************************************/
export const useQualification = async () => {
  const service = new QualificationService({ fetcher: useRequestFetch() })
  const store = useAdminEditionStore()
  const adminEdition = useAdminEdition()
  const editionsRequest = useEditions()
  const editionId = computed(() => store.editionId)

  const inputs = ref<IQualificationInputs>({ topPerPool: '2', bestNextCount: '0', withPlayoff: false })
  const inputsReady = ref(false)
  const simulated = ref<Pick<IQualificationParameters, 'topPerPool' | 'bestNextCount'> | null>(null)

  const request = useAsyncData(
    ADMIN_QUALIFICATION_ASYNC_KEY,
    async (): Promise<IQualificationStatus | null> => {
      await adminEdition
      if (!editionId.value) {
        return null
      }
      try {
        return await service.status(editionId.value, simulated.value)
      } catch (cause) {
        throw toAsyncDataError(cause)
      }
    },
    { watch: [editionId, simulated], default: () => null }
  )
  await Promise.all([adminEdition, editionsRequest, request])
  const { data: editions } = editionsRequest

  const status = computed(() => request.data.value ?? null)
  const edition = computed(() => (editions.value ?? []).find(entry => entry.id === editionId.value) ?? null)
  const isClosed = computed(() => edition.value?.status === EDITION_STATUS.CLOSED)
  const isFinalized = computed(() => status.value?.listFinalized === true)
  const isReadonly = computed(() => isClosed.value || isFinalized.value)
  const bounds = computed(() => status.value ? boundsOf(status.value) : { largestPool: 0, poolCount: 0 })
  const check = computed(() => checkInputs(inputs.value, bounds.value))
  const parameters = computed(() => check.value.parameters)

  watch(status, (value) => {
    if (value && !inputsReady.value) {
      inputs.value = initialInputs(value)
      inputsReady.value = true
    }
  }, { immediate: true })

  const wanted = computed(() => inputsReady.value && !isFinalized.value && parameters.value
    ? { topPerPool: parameters.value.topPerPool, bestNextCount: parameters.value.bestNextCount }
    : null)
  const debouncedWanted = useDebouncedValue(wanted, QUALIFICATION_SIMULATION_DELAY_MS)
  watch(debouncedWanted, (value) => {
    const same = value?.topPerPool === simulated.value?.topPerPool && value?.bestNextCount === simulated.value?.bestNextCount
    if (value && !same) {
      simulated.value = value
    }
  })

  const prerequisites = computed(() => status.value ? prerequisitesOf(status.value) : null)
  const rankTables = computed(() => status.value ? rankTablesOf(status.value, parameters.value?.topPerPool ?? null) : [])
  const ties = computed(() => status.value ? tieViewsOf(status.value, isClosed.value) : [])
  const qualifiedRows = computed(() => status.value ? qualifiedRowsOf(status.value) : [])
  const steps = computed(() => status.value ? stepsOf(status.value, check.value) : [])
  const pendingCount = computed(() => status.value ? pendingRegularCount(status.value) : 0)
  const finalizeBlocker = computed(() => {
    if (!status.value) {
      return QUALIFICATION_BLOCKER.PENDING_MATCHES
    }
    const base = blockerOf(pendingCount.value, status.value.ties.length, isClosed.value)
    if (base !== null) {
      return base
    }
    return parameters.value === null ? QUALIFICATION_BLOCKER.INVALID_PARAMETERS : null
  })
  const previewReady = computed(() => parameters.value !== null && bounds.value.poolCount > 0)
  const pageError = computed(() => request.error.value ? fromAsyncDataError(request.error.value) : null)

  const failure = ref<QUALIFICATION_FAILURE | null>(null)
  const busyTie = ref<string | null>(null)
  const finalizing = ref(false)
  const justFinalized = ref(false)

  const reload = async () => {
    failure.value = null
    await request.refresh()
  }

  const createTiebreak = async (tie: IQualificationTieView): Promise<boolean> => {
    if (!editionId.value || busyTie.value !== null || tie.blocker !== null) {
      return false
    }
    busyTie.value = tie.key
    failure.value = null
    try {
      await service.createTiebreak(editionId.value, {
        participationIds: tie.participationIds,
        ...(parameters.value ? { parameters: { topPerPool: parameters.value.topPerPool, bestNextCount: parameters.value.bestNextCount } } : {})
      })
      await request.refresh()
      return true
    } catch (cause) {
      failure.value = toQualificationFailure(cause)
      return false
    } finally {
      busyTie.value = null
    }
  }

  const finalize = async (): Promise<boolean> => {
    if (!editionId.value || finalizing.value || finalizeBlocker.value !== null || !parameters.value) {
      return false
    }
    finalizing.value = true
    failure.value = null
    try {
      await service.finalize(editionId.value, parameters.value)
      simulated.value = null
      await request.refresh()
      justFinalized.value = true
      return true
    } catch (cause) {
      failure.value = toQualificationFailure(cause)
      return false
    } finally {
      finalizing.value = false
    }
  }

  return {
    status, edition, inputs, check, bounds, parameters, isClosed, isFinalized, isReadonly, prerequisites, rankTables, ties, qualifiedRows, steps,
    pendingCount, finalizeBlocker, previewReady, pageError, pending: request.pending, failure, busyTie, finalizing, justFinalized, reload, createTiebreak, finalize
  }
}

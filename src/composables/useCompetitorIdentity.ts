import type { MaybeRefOrGetter } from 'vue'
import { computed, ref, watch } from 'vue'
import { useCompetitor } from '~/composables/useCompetitor'
import { ADMIN_COMPETITORS_CACHE_SCOPE } from '~/consts/admin-competitors.const'
import type { ICompetitorFormValues } from '~/interfaces/admin-competitors.interface'
import type { IAdminFailure } from '~/interfaces/admin-failure.interface'
import { CompetitorService } from '~/services/competitor.service'
import { fromAsyncDataError } from '~/utils/async-data-error.util'
import { isVersionConflict, toCompetitorFailure, toUpdateCompetitorRequest } from '~/utils/admin-competitors.util'

/*********************************************************
 * useCompetitorIdentity
 *
 * @description
 * Lecture (`GET /competiteurs/{id}`) et correction d'identité (`PATCH /competiteurs/{id}`) d'un compétiteur. La fiche porte
 * la `version` de l'identité, renvoyée dans `If-Match` (T-SEC-10) : le service l'exige, aucun envoi n'est possible sans elle. Sur 412
 * `VERSION_CONFLICT` la fiche est rechargée avec ses valeurs actuelles et le message l'annonce. La photo n'avance pas la
 * version : identité et photo s'enchaînent dans n'importe quel ordre.
 ********************************************************/
export const useCompetitorIdentity = (id: MaybeRefOrGetter<string | null>) => {
  const service = new CompetitorService({ fetcher: useRequestFetch() })
  const { data: competitor, pending: loading, error, refresh } = useCompetitor(id)
  const saving = ref(false)
  const saved = ref(false)
  const failure = ref<IAdminFailure | null>(null)

  const loadFailure = computed(() => error.value ? fromAsyncDataError(error.value) : null)

  watch(() => toValue(id), () => {
    saved.value = false
    failure.value = null
  })

  const reload = async () => {
    await Promise.all([refresh(), refreshNuxtData(`competitors:${ADMIN_COMPETITORS_CACHE_SCOPE}`)])
  }

  const save = async (values: ICompetitorFormValues): Promise<boolean> => {
    const current = competitor.value
    if (!current || saving.value) {
      return false
    }
    saving.value = true
    saved.value = false
    failure.value = null
    try {
      await service.updateIdentity(current.id, toUpdateCompetitorRequest(values), current.version)
      await reload()
      saved.value = true
      return true
    } catch (cause) {
      failure.value = toCompetitorFailure(cause)
      if (isVersionConflict(failure.value)) {
        await reload()
      }
      return false
    } finally {
      saving.value = false
    }
  }

  return { competitor, loading, loadFailure, save, saving, saved, failure, reload, refresh }
}

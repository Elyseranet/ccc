import { computed, watchEffect } from 'vue'
import { EDITION_STATUS } from '#shared/enums/edition.enum'
import { useEditions } from '~/composables/useEditions'
import { useT } from '~/composables/useT'
import { EDITION_STATUS_LABELS } from '~/consts/edition-status.const'
import { useAdminEditionStore } from '~/stores/admin-edition.store'

/*********************************************************
 * useAdminEdition
 *
 * @description
 * Édition active de l'admin et options du sélecteur global. À défaut de choix mémorisé,
 * l'édition active est la première non clôturée, sinon la plus récente.
 ********************************************************/
export const useAdminEdition = async () => {
  const { t } = useT()
  const store = useAdminEditionStore()
  const { data: editions } = await useEditions()

  const options = computed(() => (editions.value ?? []).map((edition) => {
    const status = EDITION_STATUS_LABELS[edition.status]
    const isClosed = edition.status === EDITION_STATUS.CLOSED
    return {
      value: edition.id,
      title: isClosed
        ? t('layout.admin.edition_archive', '{year} · {status}', { year: edition.year, status: t(status.key, status.label) })
        : t('layout.admin.edition_current', 'Édition {year} · {status}', { year: edition.year, status: t(status.key, status.label) })
    }
  }))

  watchEffect(() => {
    const list = editions.value ?? []
    if (list.length === 0 || list.some(edition => edition.id === store.editionId)) {
      return
    }
    store.editionId = (list.find(edition => edition.status !== EDITION_STATUS.CLOSED) ?? list[0])!.id
  })

  return { store, options }
}

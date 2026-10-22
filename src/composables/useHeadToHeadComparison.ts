import { computed, ref } from 'vue'
import type { ICompetitorDetail } from '~/interfaces/competitor.interface'
import { useCompetitor } from '~/composables/useCompetitor'
import { useCompetitors } from '~/composables/useCompetitors'
import { useDebouncedValue } from '~/composables/useDebouncedValue'
import { useHeadToHead } from '~/composables/useHeadToHead'
import {
  HEAD_TO_HEAD_QUERY_A,
  HEAD_TO_HEAD_QUERY_B,
  HEAD_TO_HEAD_SEARCH_DEBOUNCE_MS,
  HEAD_TO_HEAD_SEARCH_MIN_LENGTH,
  HEAD_TO_HEAD_SEARCH_PAGE_SIZE
} from '~/consts/head-to-head.const'
import { HTTP_STATUS_BAD_REQUEST, HTTP_STATUS_NOT_FOUND } from '~/consts/http-status.const'
import { HEAD_TO_HEAD_FIELD_ERROR, HEAD_TO_HEAD_SIDE } from '~/enums/head-to-head.enum'
import type { ICompetitorsQuery } from '~/interfaces/api-client.interface'
import type { ApiRequestError } from '~/utils/api-request-error.util'
import { fromAsyncDataError } from '~/utils/async-data-error.util'
import { isUuid, readQueryId, toOptions } from '~/utils/head-to-head.util'

/*********************************************************
 * useHeadToHeadComparison
 *
 * @description
 * Logique de l'écran Face-à-face : la paire vit dans l'URL (`?a=&b=`, partageable), l'inversion et les choix
 * réécrivent l'URL, et chaque cas d'erreur (même joueur, identifiant invalide, joueur inconnu) est rattaché à son champ.
 * Le cas « même joueur deux fois » est bloqué avant tout appel : la paire n'est interrogée que si elle est comparable.
 ********************************************************/
export const useHeadToHeadComparison = () => {
  const route = useRoute()
  const router = useRouter()

  /*********************************************************
   * Paire dans l'URL
   *
   * @description
   * Les identifiants sont lus tels quels (jamais corrigés) : une valeur invalide est signalée sur son champ.
   ********************************************************/
  const playerAId = computed(() => readQueryId(route.query[HEAD_TO_HEAD_QUERY_A]))
  const playerBId = computed(() => readQueryId(route.query[HEAD_TO_HEAD_QUERY_B]))
  const isSamePlayer = computed(() => playerAId.value !== null && playerAId.value === playerBId.value)
  const validAId = computed(() => isUuid(playerAId.value) ? playerAId.value : null)
  const validBId = computed(() => isUuid(playerBId.value) ? playerBId.value : null)
  const canCompare = computed(() => validAId.value !== null && validBId.value !== null && !isSamePlayer.value)

  const updateQuery = (side: HEAD_TO_HEAD_SIDE, value: string | null) => {
    const name = side === HEAD_TO_HEAD_SIDE.A ? HEAD_TO_HEAD_QUERY_A : HEAD_TO_HEAD_QUERY_B
    const query = { ...route.query }
    if (value) {
      query[name] = value
    } else {
      delete query[name]
    }
    return router.push({ query })
  }

  const selectPlayerA = (value: string | null) => updateQuery(HEAD_TO_HEAD_SIDE.A, value)
  const selectPlayerB = (value: string | null) => updateQuery(HEAD_TO_HEAD_SIDE.B, value)

  const swapPlayers = () => {
    const query = { ...route.query }
    delete query[HEAD_TO_HEAD_QUERY_A]
    delete query[HEAD_TO_HEAD_QUERY_B]
    if (playerBId.value) {
      query[HEAD_TO_HEAD_QUERY_A] = playerBId.value
    }
    if (playerAId.value) {
      query[HEAD_TO_HEAD_QUERY_B] = playerAId.value
    }
    return router.push({ query })
  }

  /*********************************************************
   * Données
   *
   * @description
   * La paire (`IHeadToHead`) ne part qu'avec deux identifiants valides et distincts. Les fiches des deux joueurs
   * donnent leurs bilans globaux et rattachent un 404 au bon champ.
   ********************************************************/
  const headToHead = useHeadToHead(() => canCompare.value ? validAId.value : null, () => canCompare.value ? validBId.value : null)
  const detailA = useCompetitor(validAId)
  const detailB = useCompetitor(validBId)

  /*********************************************************
   * Recherche
   *
   * @description
   * Autocomplétion serveur (`GET /competiteurs?q=`, 2 caractères minimum) avec un léger délai entre deux frappes.
   * Le joueur déjà choisi reste toujours dans les options, même hors de la page de résultats.
   ********************************************************/
  const searchA = ref('')
  const searchB = ref('')
  const delayedSearchA = useDebouncedValue(searchA, HEAD_TO_HEAD_SEARCH_DEBOUNCE_MS)
  const delayedSearchB = useDebouncedValue(searchB, HEAD_TO_HEAD_SEARCH_DEBOUNCE_MS)
  const queryFor = (search: string): ICompetitorsQuery => {
    const trimmed = search.trim()
    return trimmed.length >= HEAD_TO_HEAD_SEARCH_MIN_LENGTH
      ? { q: trimmed, pageSize: HEAD_TO_HEAD_SEARCH_PAGE_SIZE }
      : { pageSize: HEAD_TO_HEAD_SEARCH_PAGE_SIZE }
  }
  const listA = useCompetitors(() => queryFor(delayedSearchA.value), HEAD_TO_HEAD_SIDE.A)
  const listB = useCompetitors(() => queryFor(delayedSearchB.value), HEAD_TO_HEAD_SIDE.B)
  const optionsA = computed(() => toOptions([detailA.data.value], listA.data.value?.items ?? []))
  const optionsB = computed(() => toOptions([detailB.data.value], listB.data.value?.items ?? []))

  /*********************************************************
   * Erreurs rattachées aux champs
   *
   * @description
   * Un 400 (identifiant mal formé) et un 404 (joueur inconnu) deviennent des messages de champ, pas une alerte de page.
   ********************************************************/
  const statusOf = (error: unknown): number | null => error ? fromAsyncDataError(error).error.statusCode : null
  const fieldError = (id: string | null, detail: ICompetitorDetail | null | undefined, detailError: unknown): HEAD_TO_HEAD_FIELD_ERROR => {
    if (id === null) {
      return HEAD_TO_HEAD_FIELD_ERROR.NONE
    }
    if (!isUuid(id)) {
      return HEAD_TO_HEAD_FIELD_ERROR.INVALID_ID
    }
    if (isSamePlayer.value) {
      return HEAD_TO_HEAD_FIELD_ERROR.SAME_PLAYER
    }
    if (statusOf(detailError) === HTTP_STATUS_NOT_FOUND && !detail) {
      return HEAD_TO_HEAD_FIELD_ERROR.UNKNOWN_PLAYER
    }
    return HEAD_TO_HEAD_FIELD_ERROR.NONE
  }
  const pairError = computed<ApiRequestError | null>(() => headToHead.error.value ? fromAsyncDataError(headToHead.error.value) : null)
  const isPairRejected = computed(() => pairError.value !== null && [HTTP_STATUS_BAD_REQUEST, HTTP_STATUS_NOT_FOUND].includes(pairError.value.error.statusCode))
  const rejectedAs = (): HEAD_TO_HEAD_FIELD_ERROR => {
    if (!isPairRejected.value) {
      return HEAD_TO_HEAD_FIELD_ERROR.NONE
    }
    return pairError.value?.error.statusCode === HTTP_STATUS_BAD_REQUEST ? HEAD_TO_HEAD_FIELD_ERROR.INVALID_ID : HEAD_TO_HEAD_FIELD_ERROR.UNKNOWN_PLAYER
  }
  const withRejection = (error: HEAD_TO_HEAD_FIELD_ERROR): HEAD_TO_HEAD_FIELD_ERROR => error === HEAD_TO_HEAD_FIELD_ERROR.NONE ? rejectedAs() : error
  const errorA = computed(() => withRejection(fieldError(playerAId.value, detailA.data.value, detailA.error.value)))
  const errorB = computed(() => withRejection(fieldError(playerBId.value, detailB.data.value, detailB.error.value)))
  const hasFieldError = computed(() => errorA.value !== HEAD_TO_HEAD_FIELD_ERROR.NONE || errorB.value !== HEAD_TO_HEAD_FIELD_ERROR.NONE)

  /*********************************************************
   * État de l'écran
   *
   * @description
   * Une erreur déjà rattachée à un champ n'est pas répétée en alerte. Une paire en 400 ou 404 sans fiche fautive
   * devient une erreur de champ pour les deux joueurs ; toute autre erreur (réseau, 429, 500) passe par `AsyncState`.
   ********************************************************/
  const pageError = computed<ApiRequestError | null>(() => {
    if (isPairRejected.value || hasFieldError.value) {
      return null
    }
    return pairError.value
  })
  const isIdle = computed(() => !canCompare.value && !hasFieldError.value)
  const isPending = computed(() => canCompare.value && headToHead.status.value === 'pending')
  const comparison = computed(() => canCompare.value ? headToHead.data.value ?? null : null)

  const retry = async () => {
    await Promise.all([headToHead.refresh(), detailA.refresh(), detailB.refresh()])
  }

  return {
    playerAId,
    playerBId,
    searchA,
    searchB,
    optionsA,
    optionsB,
    errorA,
    errorB,
    detailA: computed(() => detailA.data.value ?? null),
    detailB: computed(() => detailB.data.value ?? null),
    comparison,
    pageError,
    isIdle,
    isPending,
    isPairRejected,
    selectPlayerA,
    selectPlayerB,
    swapPlayers,
    retry
  }
}

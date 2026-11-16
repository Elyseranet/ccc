import { computed, onScopeDispose, ref, watch } from 'vue'
import { useCompetitors } from '~/composables/useCompetitors'
import { useEditions } from '~/composables/useEditions'
import { usePlayerFormat } from '~/composables/usePlayerFormat'
import { useT } from '~/composables/useT'
import { PLAYERS_ALL_EDITIONS, PLAYERS_PAGE_SIZE, PLAYERS_SEARCH_DEBOUNCE_MS } from '~/consts/players.const'
import { COMPETITOR_SORT } from '~/enums/competitor-sort.enum'
import type { IPlayersEditionOption, IPlayersSearchState, IPlayersSortChange } from '~/interfaces/players.interface'
import { fromAsyncDataError } from '~/utils/async-data-error.util'
import { buildPlayersApiQuery, buildPlayersLocationQuery, parsePlayersState } from '~/utils/player.util'

/*********************************************************
 * usePlayerSearch
 *
 * @description
 * Annuaire des joueurs : l'état (recherche, édition, tri, page) vit dans l'URL, l'API fait la recherche
 * (insensible aux accents et à la casse), le tri et la pagination. La frappe est regroupée par un délai
 * de requête (la recherche publique est limitée en débit) ; la validation du formulaire l'applique aussitôt.
 * Le filtre d'édition ne filtre que les inscrits : les statistiques restent celles de la carrière.
 ********************************************************/
export const usePlayerSearch = () => {
  const { t } = useT()
  const { editionLabel } = usePlayerFormat()
  const route = useRoute()
  const router = useRouter()
  const state = computed<IPlayersSearchState>(() => parsePlayersState(route.query))
  const draft = ref(state.value.q)
  const apiQuery = computed(() => buildPlayersApiQuery(state.value))
  const { data, pending, error, refresh } = useCompetitors(apiQuery, 'players')
  const { data: editions } = useEditions()
  let timer: ReturnType<typeof setTimeout> | undefined

  const navigate = (patch: Partial<IPlayersSearchState>, replace = true) => {
    const query = buildPlayersLocationQuery({ ...state.value, ...patch })
    return replace ? router.replace({ query }) : router.push({ query })
  }

  const clearTimer = () => {
    if (timer !== undefined) {
      clearTimeout(timer)
      timer = undefined
    }
  }

  const applyDraft = () => {
    clearTimer()
    if (draft.value !== state.value.q) {
      void navigate({ q: draft.value, page: 1 })
    }
  }

  const setQuery = (value: string) => {
    draft.value = value
    clearTimer()
    timer = setTimeout(applyDraft, PLAYERS_SEARCH_DEBOUNCE_MS)
  }

  const setEdition = (value: string) => {
    void navigate({ edition: value ?? PLAYERS_ALL_EDITIONS, page: 1 })
  }

  const setSort = ({ sort, order }: IPlayersSortChange) => {
    void navigate({ sort, order, page: 1 })
  }

  const setPage = (page: number) => {
    void navigate({ page }, false)
  }

  watch(() => state.value.q, (value) => {
    if (timer === undefined) {
      draft.value = value
    }
  })

  onScopeDispose(clearTimer)

  const items = computed(() => data.value?.items ?? [])
  const total = computed(() => data.value?.total ?? 0)
  const editionOptions = computed<IPlayersEditionOption[]>(() => [
    { title: t('players.search.all_editions', 'Toutes'), value: PLAYERS_ALL_EDITIONS },
    ...(editions.value ?? []).map(edition => ({ title: editionLabel(edition.code), value: edition.id }))
  ])
  const sortLabel = computed(() => {
    switch (state.value.sort) {
      case COMPETITOR_SORT.EDITIONS_PLAYED:
        return t('players.sort.editions_played', 'éditions')
      case COMPETITOR_SORT.MATCHES_PLAYED:
        return t('players.sort.matches_played', 'matchs')
      case COMPETITOR_SORT.WINS:
        return t('players.sort.wins', 'victoires')
      case COMPETITOR_SORT.TITLES:
        return t('players.sort.titles', 'titres')
      case COMPETITOR_SORT.FIRST_EDITION:
        return t('players.sort.first_edition', 'première édition')
      default:
        return t('players.sort.display_name', 'nom')
    }
  })
  const countText = computed(() => {
    if (pending.value && !data.value) {
      return ''
    }
    if (total.value === 0) {
      return t('players.count_none', 'Aucun joueur trouvé')
    }
    return total.value === 1
      ? t('players.count_one', '1 joueur · tri par {sort}', { sort: sortLabel.value })
      : t('players.count_other', '{count} joueurs · tri par {sort}', { count: total.value, sort: sortLabel.value })
  })

  return {
    state,
    draft,
    items,
    total,
    pageSize: PLAYERS_PAGE_SIZE,
    pending,
    error: computed(() => error.value ? fromAsyncDataError(error.value) : null),
    refresh,
    editionOptions,
    countText,
    isEditionFiltered: computed(() => state.value.edition !== PLAYERS_ALL_EDITIONS),
    setQuery,
    applyDraft,
    setEdition,
    setSort,
    setPage
  }
}

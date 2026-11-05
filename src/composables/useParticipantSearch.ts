import { computed, ref } from 'vue'
import type { Ref } from 'vue'
import { PARTICIPANT_SEARCH_DEBOUNCE_MS, PARTICIPANT_SEARCH_PAGE_SIZE } from '~/consts/admin-participants.const'
import { COMPETITOR_SEARCH_MIN_LENGTH } from '~/consts/competitor.const'
import { useDebouncedValue } from '~/composables/useDebouncedValue'
import type { IParticipantSuggestion } from '~/interfaces/admin-participants.interface'
import { CompetitorService } from '~/services/competitor.service'
import { buildSuggestions } from '~/utils/admin-participants.util'

/*********************************************************
 * useParticipantSearch
 *
 * @description
 * Recherche d'un profil existant à rattacher (`GET /competiteurs?q=`, nom, prénom ou pseudo). La frappe est regroupée
 * par un délai (la recherche publique est limitée en débit) et rien n'est demandé sous le minimum de caractères du
 * serveur. Les profils déjà inscrits ne sont pas proposés ; l'entrée « Créer un nouveau participant » ferme la liste.
 ********************************************************/
export const useParticipantSearch = (registeredIds: Ref<ReadonlySet<string>>) => {
  const service = new CompetitorService({ fetcher: useRequestFetch() })
  const query = ref('')
  const debounced = useDebouncedValue(query, PARTICIPANT_SEARCH_DEBOUNCE_MS)
  const term = computed(() => debounced.value.trim())
  const isSearchable = computed(() => term.value.length >= COMPETITOR_SEARCH_MIN_LENGTH)

  const { data, pending } = useAsyncData(
    'admin-participant-search',
    async () => isSearchable.value
      ? (await service.list({ q: term.value, pageSize: PARTICIPANT_SEARCH_PAGE_SIZE })).items
      : [],
    { watch: [term], default: () => [] }
  )

  const suggestions = computed<IParticipantSuggestion[]>(() => isSearchable.value
    ? buildSuggestions(data.value, registeredIds.value, query.value.trim())
    : [])

  return { query, term, isSearchable, suggestions, pending }
}

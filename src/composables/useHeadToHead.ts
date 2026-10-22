import type { MaybeRefOrGetter } from 'vue'
import { CompetitorService } from '~/services/competitor.service'

/*********************************************************
 * useHeadToHead
 *
 * @description
 * Face-à-face de deux joueurs (RG36, RG37), clé de cache stable par paire.
 ********************************************************/
export const useHeadToHead = (id: MaybeRefOrGetter<string>, opponentId: MaybeRefOrGetter<string>) => {
  const service = new CompetitorService({ fetcher: useRequestFetch() })
  return useAsyncData(
    `head-to-head:${toValue(id)}:${toValue(opponentId)}`,
    () => service.headToHead(toValue(id), toValue(opponentId)),
    { watch: [() => toValue(id), () => toValue(opponentId)] }
  )
}

import { getQuery } from 'h3'
import type { IMatch } from '../../../../../shared/interfaces/api/match.interface'
import type { IPaginated } from '../../../../../shared/interfaces/api/pagination.interface'
import { parseMatchListQuery } from '../../../../utils/edition/edition-query.util'
import { loadPublicMatchPage } from '../../../../utils/edition/edition-read.util'
import { readEditionResource } from '../../../../utils/edition/edition-route.util'

export default defineEventHandler((event) => {
  // Les filtres sont validés avant toute lecture : un filtre invalide répond 400, jamais 304.
  const query = parseMatchListQuery(getQuery(event))
  return readEditionResource(event, (dataSource, edition): Promise<IPaginated<IMatch>> =>
    loadPublicMatchPage(dataSource, edition.id, query))
})

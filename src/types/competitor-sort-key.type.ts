import type { ICompetitorCareer } from '../interfaces/competitor.interface.js'
import type { ICompetitorListItem } from '../interfaces/competitor.interface.js'

export type TCompetitorSortKeyReader = (
  item: ICompetitorListItem,
  career: ICompetitorCareer | undefined
) => number | string | null

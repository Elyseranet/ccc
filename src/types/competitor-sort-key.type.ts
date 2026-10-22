import type { ICompetitorCareer } from '../server/interfaces/competitor.interface'
import type { ICompetitorListItem } from '../interfaces/competitor.interface'

export type TCompetitorSortKeyReader = (
  item: ICompetitorListItem,
  career: ICompetitorCareer | undefined
) => number | string | null

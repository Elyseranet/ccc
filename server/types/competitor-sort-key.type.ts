import type { ICompetitorCareer } from '../interfaces/competitor.interface'
import type { ICompetitorListItem } from '../../shared/interfaces/api/competitor.interface'

export type TCompetitorSortKeyReader = (
  item: ICompetitorListItem,
  career: ICompetitorCareer | undefined
) => number | string | null

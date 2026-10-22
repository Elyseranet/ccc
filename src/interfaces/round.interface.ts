import type { ROUND_KIND, ROUND_STATUS } from '../enums/round.enum.js'
import type { IMatch } from './match.interface.js'

export interface IRound {
  id: string
  kind: ROUND_KIND
  sequence: number
  status: ROUND_STATUS
  matchCount: number
  validatedMatchCount: number
}

export interface IBracketRound {
  kind: ROUND_KIND
  matches: IMatch[]
}

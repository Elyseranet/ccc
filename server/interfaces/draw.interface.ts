/** Compteurs cumulatifs : « finales jouées » inclut les titres, etc. (RG10, interprétation). */
export interface ISeedCandidate {
  playerId: string
  acp: number
  titles: number
  finals: number
  semis: number
  quarters: number
  roundsOf16: number
  playoffs: number
  participations: number
}

export interface ISeedRanking {
  ranked: ISeedCandidate[]
  /** Groupes de candidats à égalité parfaite sur tous les critères (RG10) : jamais tranchés. */
  unresolvedTies: string[][]
}

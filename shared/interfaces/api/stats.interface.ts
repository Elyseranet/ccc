/**
 * A16 : `matches` compte les matchs joués (VALIDATED ou RESULT_UNKNOWN) ; `scoredMatches` ceux qui ont
 * un score (554 sur 729 pour l'archive) ; `unknownResultMatches` le reste (R-5).
 */
export interface IArchiveStats {
  editions: number
  competitors: number
  matches: number
  scoredMatches: number
  unknownResultMatches: number
}

/** Voie de qualification d'un joueur à l'issue des poules (RG18). */
export enum QUALIFICATION_ROUTE {
  /** Un des `n` premiers de sa poule. */
  TOP_OF_POOL = 'TOP_OF_POOL',
  /** Un des `m` meilleurs (n+1)èmes, comparés entre poules (A10). */
  BEST_NEXT = 'BEST_NEXT'
}

/** Où se joue l'égalité à départager (RG19, RG20). */
export enum TIEBREAK_SCOPE {
  /** Au sein d'une poule (RG19) : la mini-poule est déjà appliquée (R-6). */
  POOL = 'POOL',
  /** Entre poules, pour une place de meilleur (n+1)ème (RG20). */
  BOUNDARY = 'BOUNDARY'
}

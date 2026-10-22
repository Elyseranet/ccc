export interface IFixtureSet<T> {
  default: T
  empty: T
  /** Scénario `?fixture=registration` : seuls les jeux qui le prévoient diffèrent, les autres retombent sur `default`. */
  registration?: T
}

/** Côté d'un match de fixture : numéro de joueur, nom et score. */
export interface IFixtureSide {
  id: number
  name: string
  score: number
}

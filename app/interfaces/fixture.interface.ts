export interface IFixtureSet<T> {
  default: T
  empty: T
  /** Scénario `?fixture=registration` : seuls les jeux qui le prévoient diffèrent, les autres retombent sur `default`. */
  registration?: T
}

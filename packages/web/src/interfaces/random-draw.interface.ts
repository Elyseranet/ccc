/** Entrée du tirage au sort des poules (B-26) : les têtes de série dans l'ordre de leur `drawnOrder`, puis les autres inscrits. */
export interface IPoolRandomDrawInput {
  seedIds: readonly string[]
  otherIds: readonly string[]
  poolCount: number
}

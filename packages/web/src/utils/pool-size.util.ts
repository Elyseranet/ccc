/** Tailles des poules (RG16) : les `total` joueurs se répartissent au plus à un joueur d'écart, les plus grandes poules d'abord. */
export const poolSizes = (total: number, poolCount: number): number[] => {
  if (poolCount < 1 || total < 0) {
    return []
  }
  const base = Math.floor(total / poolCount)
  const larger = total % poolCount
  return Array.from({ length: poolCount }, (_, index) => (index < larger ? base + 1 : base))
}

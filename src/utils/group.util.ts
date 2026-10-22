/** Découpe une liste déjà triée en blocs consécutifs considérés égaux par `equals`. */
export function splitByEquality<T>(
  sorted: readonly T[],
  equals: (a: T, b: T) => boolean,
): T[][] {
  const blocks: T[][] = []
  for (const item of sorted) {
    const last = blocks[blocks.length - 1]
    if (last && equals(last[0]!, item)) {
      last.push(item)
    } else {
      blocks.push([item])
    }
  }
  return blocks
}

/** Découpe une liste déjà triée en blocs consécutifs de même clé. */
export function splitByKey<T>(sorted: readonly T[], key: (item: T) => number): T[][] {
  return splitByEquality(sorted, (a, b) => key(a) === key(b))
}

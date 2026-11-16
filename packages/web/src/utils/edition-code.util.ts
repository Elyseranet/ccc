import { EDITION_CODE_SUFFIXES } from '../consts/edition.const.js'

/**
 * Code d'une nouvelle édition (CE-1) : l'année seule pour la première (`2027`), puis `2027b`, `2027c`…
 * Le code est immuable (R-9) : la première édition de l'année ne peut donc pas devenir `2027a` après coup,
 * et le suffixe suivant est toujours après le plus grand déjà utilisé (`2012a`, `2012b` → `2012c`).
 * Renvoie `null` quand les 25 suffixes de l'année sont pris.
 * Seule fonction à modifier si la règle de nommage change.
 */
export const buildEditionCode = (year: number, existingCodes: readonly string[]): string | null => {
  const prefix = String(year)
  const used = existingCodes
    .filter((code) => code.startsWith(prefix) && /^[a-z]?$/.test(code.slice(prefix.length)))
    // L'année seule est la première de la série : elle compte comme « a ».
    .map((code) => code.slice(prefix.length) || 'a')
  if (used.length === 0) {
    return prefix
  }
  const highest = used.reduce((max, letter) => (letter > max ? letter : max), 'a')
  const next = [...EDITION_CODE_SUFFIXES].find((suffix) => suffix > highest)
  return next ? `${prefix}${next}` : null
}

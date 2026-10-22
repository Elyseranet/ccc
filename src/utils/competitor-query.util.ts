import { COMBINING_MARKS, LIKE_SPECIAL_CHARACTERS } from '../consts/competitor.const.js'

/** Minuscules sans accents : `Rémi` et `Remi` donnent la même chaîne. */
export const foldSearchText = (value: string): string =>
  value.normalize('NFD').replace(COMBINING_MARKS, '').toLowerCase()

/** `%`, `_` et `\` perdent leur sens de joker : `q=%` cherche un pourcent littéral. */
export const escapeLikePattern = (value: string): string => value.replace(LIKE_SPECIAL_CHARACTERS, '\\$&')

export const buildContainsPattern = (query: string): string => `%${escapeLikePattern(foldSearchText(query))}%`

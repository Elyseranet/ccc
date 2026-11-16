import { ADMIN_DATE_LOCALE } from '../consts/admin-editions.const.js'

/** « A, B et C » : une liste de noms en toutes lettres, pour un nom de bouton ou une phrase (la langue est celle de l'admin). */
export const formatNameList = (names: readonly string[]): string =>
  new Intl.ListFormat(ADMIN_DATE_LOCALE, { style: 'long', type: 'conjunction' }).format(names)

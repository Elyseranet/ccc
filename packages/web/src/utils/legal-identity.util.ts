import { LEGAL_IDENTITY_FIELDS, LEGAL_PLACEHOLDER_PATTERN } from '../consts/runtime-config.const.js'
import type { TLegalIdentityField } from '../types/legal-identity.type.js'

/** Valeur d'une variable d'identité dans `runtimeConfig.public.legal`, rognée ; vide si absente, pas une chaîne ou `A_COMPLETER`. */
export const legalFieldValue = (legal: unknown, field: TLegalIdentityField): string => {
  let node: unknown = legal
  for (const key of field.path) {
    node = node !== null && typeof node === 'object' ? (node as Record<string, unknown>)[key] : undefined
  }
  const value = typeof node === 'string' ? node.trim() : ''
  return LEGAL_PLACEHOLDER_PATTERN.test(value) ? '' : value
}

/** Noms des variables d'identité obligatoires et vides (jamais leurs valeurs) : la garde de production les cite. */
export const missingLegalVariables = (legal: unknown): string[] =>
  LEGAL_IDENTITY_FIELDS.filter(field => field.required && legalFieldValue(legal, field) === '').map(field => field.variable)

/** Valeur d'une variable d'identité désignée par son paramètre (`email`, `hostName`…) ; vide si inconnue ou non renseignée. */
export const legalValue = (legal: unknown, param: string): string => {
  const field = LEGAL_IDENTITY_FIELDS.find(entry => entry.param === param)
  return field === undefined ? '' : legalFieldValue(legal, field)
}

/** Paramètres des textes légaux : l'information, `toComplete` si une variable obligatoire est vide, vide si une variable facultative l'est. */
export const legalParams = (legal: unknown, toComplete: string): Record<string, string> =>
  Object.fromEntries(LEGAL_IDENTITY_FIELDS.map(field => [field.param, legalFieldValue(legal, field) || (field.required ? toComplete : '')]))

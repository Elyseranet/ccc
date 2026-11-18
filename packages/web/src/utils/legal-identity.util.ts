import { LEGAL_IDENTITY_FIELDS } from '../consts/runtime-config.const.js'
import type { TLegalIdentityField } from '../types/legal-identity.type.js'

/** Valeur d'une variable d'identité dans `runtimeConfig.public.legal`, rognée ; vide si absente ou pas une chaîne. */
export const legalFieldValue = (legal: unknown, field: TLegalIdentityField): string => {
  let node: unknown = legal
  for (const key of field.path) {
    node = node !== null && typeof node === 'object' ? (node as Record<string, unknown>)[key] : undefined
  }
  return typeof node === 'string' ? node.trim() : ''
}

/** Noms des variables d'identité vides (jamais leurs valeurs) : la garde de production les cite. */
export const missingLegalVariables = (legal: unknown): string[] =>
  LEGAL_IDENTITY_FIELDS.filter(field => legalFieldValue(legal, field) === '').map(field => field.variable)

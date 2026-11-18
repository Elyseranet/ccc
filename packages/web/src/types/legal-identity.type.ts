import type { LEGAL_IDENTITY_FIELDS } from '../consts/runtime-config.const.js'

/** Une variable d'identité légale de l'éditeur (F-70) : chemin dans la config, paramètre de texte, nom de variable. */
export type TLegalIdentityField = (typeof LEGAL_IDENTITY_FIELDS)[number]

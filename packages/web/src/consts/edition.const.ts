import { EDITION_STATUS } from '../enums/edition.enum.js'

/** Code lisible d'une édition (`2012a`, `2026`) accepté à la place de l'UUID dans l'URL. */
export const EDITION_CODE_PATTERN = /^[A-Za-z0-9-]{1,16}$/

/** Préfixe des ETag d'une réponse d'édition. */
export const EDITION_ETAG_PREFIX = 'ccc-ed'

export const CACHE_CONTROL_OPEN_EDITION = 'no-cache'

/** Garde-fou si `runtimeConfig.cache.closedEditionMaxAgeSeconds` n'est pas un entier valide. */
export const DEFAULT_CLOSED_EDITION_MAX_AGE_SECONDS = 3600

/** Relations nécessaires au DTO public d'un match (`toPublicMatch`). */
export const MATCH_PUBLIC_RELATIONS = { round: true, pool: true, sides: { participation: { competitor: true } } } as const

/** Bornes de validation de `POST /editions` (choix d'implémentation : la Spec ne fixe pas de bornes). */
export const EDITION_YEAR_MIN = 2000
export const EDITION_YEAR_MAX = 2100
export const EDITION_NAME_MAX_LENGTH = 160
export const EDITION_LOCATION_MAX_LENGTH = 160
export const EDITION_DESCRIPTION_MAX_LENGTH = 5000
export const EDITION_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

/** Suffixes des éditions d'une même année : `b` à `z` (la première édition porte l'année seule). */
export const EDITION_CODE_SUFFIXES = 'bcdefghijklmnopqrstuvwxyz'

/**
 * Clé du verrou transactionnel GLOBAL (pas un verrou par année) qui sérialise toute création d'édition :
 * le rang chronologique est global, donc deux années différentes se disputeraient le même rang.
 */
export const EDITION_CREATION_LOCK_KEY = 7_310_001

/** Contraintes d'unicité calculées à la création : une collision résiduelle (insertion hors verrou) devient un 409. */
export const EDITION_COMPUTED_UNIQUE_CONSTRAINTS: readonly string[] = ['uq_editions_code', 'uq_editions_chronological_rank']

/** Statuts d'une édition qui acceptent encore des ajouts et des retraits de participants. */
export const PARTICIPANT_EDITABLE_STATUSES: readonly EDITION_STATUS[] = [EDITION_STATUS.CREATED, EDITION_STATUS.REGISTRATION]

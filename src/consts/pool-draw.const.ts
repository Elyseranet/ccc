import { API_ERROR_CODE } from '../enums/api-error-code.enum.js'
import { POOL_DRAW_STEP } from '../enums/pool-draw.enum.js'
import type { ITranslatableText } from '../interfaces/common-components.interface.js'

/** Bornes de `poules` et de `poolCount` côté API (B-11) : 1 à 20. */
export const POOL_DRAW_MIN_POOLS = 1
export const POOL_DRAW_MAX_POOLS = 20

/** Taille de poule visée pour proposer un nombre de poules : « poules de 6 et de 5 » (maquette `admin-tirages.html`, RG16). */
export const POOL_DRAW_TARGET_POOL_SIZE = 6

/** Durée d'affichage du retour « Brouillon enregistré » (mapping.md : `timeout: 2500`). */
export const POOL_DRAW_SNACKBAR_TIMEOUT_MS = 2500

/** Clés de cache des requêtes de l'écran. */
export const POOL_DRAW_DRAFTS_CACHE_KEY = 'admin-pool-draw-drafts'
export const POOL_DRAW_PROPOSAL_CACHE_KEY = 'admin-pool-draw-proposal'

/** Étapes, dans l'ordre : paramètres, têtes de série, saisie, récapitulatif, validation. */
export const POOL_DRAW_STEPS: Array<{ step: POOL_DRAW_STEP, label: ITranslatableText }> = [
  { step: POOL_DRAW_STEP.PARAMETERS, label: { key: 'admin.draws.step_parameters', fallback: 'Paramètres' } },
  { step: POOL_DRAW_STEP.SEEDS, label: { key: 'admin.draws.step_seeds', fallback: 'Têtes de série' } },
  { step: POOL_DRAW_STEP.ENTRY, label: { key: 'admin.draws.step_entry', fallback: 'Saisie du tirage' } },
  { step: POOL_DRAW_STEP.RECAP, label: { key: 'admin.draws.step_recap', fallback: 'Récapitulatif' } },
  { step: POOL_DRAW_STEP.VALIDATION, label: { key: 'admin.draws.step_validation', fallback: 'Validation' } }
]

export const POOL_DRAW_ERROR_OFFLINE: ITranslatableText = { key: 'admin.draws.errors.offline', fallback: 'Connexion perdue : l’action n’a pas été enregistrée. Réessayez dès que le réseau revient.' }
export const POOL_DRAW_ERROR_UNKNOWN: ITranslatableText = { key: 'admin.draws.errors.unknown', fallback: 'Une erreur est survenue : l’action n’a pas été enregistrée.' }

/** Un message par code d'erreur de l'API (B-11) ; un code absent de la table donne le message générique. */
export const POOL_DRAW_ERROR_MESSAGES: Partial<Record<API_ERROR_CODE, ITranslatableText>> = {
  [API_ERROR_CODE.DRAW_SEEDS_INVALID]: { key: 'admin.draws.errors.draw_seeds_invalid', fallback: 'Les têtes de série ne sont pas celles que le classement impose : recalculez-les.' },
  [API_ERROR_CODE.DRAW_INCONSISTENT]: { key: 'admin.draws.errors.draw_inconsistent', fallback: 'Les affectations sont incohérentes : une poule ne peut avoir qu’une tête de série, et un joueur n’est placé qu’une fois.' },
  [API_ERROR_CODE.DRAW_INCOMPLETE]: { key: 'admin.draws.errors.draw_incomplete', fallback: 'Tous les inscrits doivent être placés avant la validation.' },
  [API_ERROR_CODE.DRAW_ALREADY_VALIDATED]: { key: 'admin.draws.errors.draw_already_validated', fallback: 'Le tirage est déjà validé : il ne peut plus changer.' },
  [API_ERROR_CODE.DRAW_SEED_WITHDRAWN]: { key: 'admin.draws.errors.draw_seed_withdrawn', fallback: 'Une tête de série s’est retirée : recommencez le tirage.' },
  [API_ERROR_CODE.REGISTRATION_CLOSED]: { key: 'admin.draws.errors.registration_closed', fallback: 'Les inscriptions sont closes : le tirage ne peut plus être modifié.' },
  [API_ERROR_CODE.EDITION_CLOSED]: { key: 'admin.draws.errors.edition_closed', fallback: 'L’édition est close : le tirage ne peut plus être modifié.' },
  [API_ERROR_CODE.VALIDATION_FAILED]: { key: 'admin.draws.errors.validation_failed', fallback: 'Les valeurs envoyées sont refusées par le serveur.' },
  [API_ERROR_CODE.BAD_REQUEST]: { key: 'admin.draws.errors.bad_request', fallback: 'Il y a plus de poules que d’inscrits : réduisez le nombre de poules.' },
  [API_ERROR_CODE.NOT_FOUND]: { key: 'admin.draws.errors.not_found', fallback: 'Le tirage ou l’édition est introuvable : rechargez la page.' },
  [API_ERROR_CODE.FORBIDDEN]: { key: 'admin.draws.errors.forbidden', fallback: 'Cette action est réservée aux administrateurs.' }
}

/** Codes qui obligent à recommencer le tirage (une tête de série s'est retirée) : l'écran propose « Recommencer le tirage ». */
export const POOL_DRAW_RESTART_CODES: API_ERROR_CODE[] = [API_ERROR_CODE.DRAW_SEED_WITHDRAWN, API_ERROR_CODE.DRAW_SEEDS_INVALID]

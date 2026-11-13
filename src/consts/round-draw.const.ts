import { API_ERROR_CODE } from '../enums/api-error-code.enum.js'
import type { ITranslatableText } from '../interfaces/common-components.interface.js'
import { POOL_DRAW_ERROR_MESSAGES } from './pool-draw.const.js'

/** Clés de cache des lectures de la page (fixes : l'édition active n'est connue qu'après le chargement des éditions). */
export const ROUND_DRAW_PREVIEW_CACHE_KEY = 'admin-round-draw-preview'
export const ROUND_DRAW_DRAFTS_CACHE_KEY = 'admin-round-draw-drafts'
export const ROUND_DRAW_DETAIL_CACHE_KEY = 'admin-round-draw-edition'

/** Cible de score des matchs d'un tour de phase finale (RG21), affichée et non éditable. */
export const ROUND_DRAW_TARGET_SCORE = 10

/** Un vivier de cette taille se tire sans choix : 2 la finale, 4 les demies, 8 les quarts, 16 les huitièmes (RG13). */
export const ROUND_DRAW_DEDUCED_SIZES: readonly number[] = [2, 4, 8, 16]

/**
 * Refus du serveur, par code (le serveur ne distingue pas toujours la cause dans le code : plusieurs causes partagent `DRAW_INCONSISTENT`).
 * Les codes déjà traduits par le tirage des poules sont repris ; ceux du tour s'y ajoutent.
 */
export const ROUND_DRAW_ERROR_MESSAGES: Partial<Record<API_ERROR_CODE, ITranslatableText>> = {
  ...POOL_DRAW_ERROR_MESSAGES,
  [API_ERROR_CODE.DRAW_INCONSISTENT]: { key: 'admin.round_draw.errors.draw_inconsistent', fallback: 'Le tirage est incohérent : un joueur n’est tiré qu’une fois, les premiers de poule n’entrent pas en barrages, les huitièmes se tirent à 16 joueurs et la finale à 2.' },
  [API_ERROR_CODE.DRAW_INCOMPLETE]: { key: 'admin.round_draw.errors.draw_incomplete', fallback: 'Chaque affiche doit avoir deux joueurs, et tous les joueurs du vivier doivent figurer dans une affiche.' },
  [API_ERROR_CODE.DRAW_ALREADY_VALIDATED]: { key: 'admin.round_draw.errors.draw_already_validated', fallback: 'Le tirage de ce tour est validé : le tour ne peut plus être changé.' },
  [API_ERROR_CODE.QUALIFICATION_NOT_DONE]: { key: 'admin.round_draw.errors.qualification_not_done', fallback: 'La liste des qualifiés n’est pas arrêtée : arrêtez-la d’abord.' },
  [API_ERROR_CODE.ROUND_NOT_COMPLETED]: { key: 'admin.round_draw.errors.round_not_completed', fallback: 'Tous les matchs du tour précédent doivent être validés avant de tirer le suivant.' },
  [API_ERROR_CODE.EDITION_CLOSED]: { key: 'admin.round_draw.errors.edition_closed', fallback: 'L’édition est clôturée : le tirage ne peut plus être modifié.' }
}

/** Texte du refus d'un tirage dont le serveur a changé l'état sous la saisie : l'écran propose « Recharger » et garde la saisie. */
export const ROUND_DRAW_STALE_CODES: readonly API_ERROR_CODE[] = [
  API_ERROR_CODE.DRAW_ALREADY_VALIDATED,
  API_ERROR_CODE.QUALIFICATION_NOT_DONE,
  API_ERROR_CODE.ROUND_NOT_COMPLETED,
  API_ERROR_CODE.NOT_FOUND
]

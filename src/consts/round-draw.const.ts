import { ROUND_DRAW_VIEW } from '../enums/round-draw.enum.js'
import { ROUND_KIND } from '../enums/round.enum.js'
import { API_ERROR_CODE } from '../enums/api-error-code.enum.js'
import type { TSidePosition } from '../types/draw.type.js'
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

/**
 * Formes d'un tour dans les phrases de la page : « des huitièmes » (« Saisir le tirage des huitièmes ») et « huitièmes » (« Vivier · huitièmes »). Les libellés
 * capitalisés (« Huitièmes ») viennent de `ROUND_LABELS`. La langue décide de l'accord : une clé par forme.
 */
export const ROUND_DRAW_TEXTS: Record<ROUND_KIND, { of: ITranslatableText, bare: ITranslatableText }> = {
  [ROUND_KIND.POOLS]: { of: { key: 'admin.round_draw.of_pools', fallback: 'des poules' }, bare: { key: 'admin.round_draw.bare_pools', fallback: 'poules' } },
  [ROUND_KIND.PLAYOFF]: { of: { key: 'admin.round_draw.of_playoff', fallback: 'des barrages' }, bare: { key: 'admin.round_draw.bare_playoff', fallback: 'barrages' } },
  [ROUND_KIND.ROUND_OF_16]: { of: { key: 'admin.round_draw.of_round_of_16', fallback: 'des huitièmes' }, bare: { key: 'admin.round_draw.bare_round_of_16', fallback: 'huitièmes' } },
  [ROUND_KIND.QUARTER]: { of: { key: 'admin.round_draw.of_quarter', fallback: 'des quarts' }, bare: { key: 'admin.round_draw.bare_quarter', fallback: 'quarts' } },
  [ROUND_KIND.SEMI]: { of: { key: 'admin.round_draw.of_semi', fallback: 'des demi-finales' }, bare: { key: 'admin.round_draw.bare_semi', fallback: 'demi-finales' } },
  [ROUND_KIND.FINAL]: { of: { key: 'admin.round_draw.of_final', fallback: 'de la finale' }, bare: { key: 'admin.round_draw.bare_final', fallback: 'finale' } }
}

/** Phrase des barrages (maquette 13b43ad8) : les premiers de poule ne sont pas tirés (RG14) et attendent le tour qui suit ; `{round}` = le tour d'après, déduit des données. */
export const ROUND_DRAW_PLAYOFF_WAIT_TEXTS: { one: ITranslatableText, other: ITranslatableText } = {
  one: { key: 'admin.round_draw.playoff_leaders_wait_one', fallback: 'Le premier de poule n’est pas tiré : il attend {round}.' },
  other: { key: 'admin.round_draw.playoff_leaders_wait_other', fallback: 'Les {count} premiers de poule ne sont pas tirés : ils attendent {round}.' }
}

/** Le tour d'après les barrages, avec son article (« les huitièmes », « la finale »). */
export const ROUND_DRAW_WAIT_ROUND_TEXTS: Partial<Record<ROUND_KIND, ITranslatableText>> = {
  [ROUND_KIND.ROUND_OF_16]: { key: 'admin.round_draw.wait_round_of_16', fallback: 'les huitièmes' },
  [ROUND_KIND.QUARTER]: { key: 'admin.round_draw.wait_quarter', fallback: 'les quarts' },
  [ROUND_KIND.SEMI]: { key: 'admin.round_draw.wait_semi', fallback: 'les demi-finales' },
  [ROUND_KIND.FINAL]: { key: 'admin.round_draw.wait_final', fallback: 'la finale' }
}

/** Gravité de l'alerte de chaque état sans saisie (valeurs de `origam-alert`) : le vivier qui ne se tire pas est une erreur, la fin de la phase finale un succès, le reste une information. */
export const ROUND_DRAW_STATE_STATUS: Record<ROUND_DRAW_VIEW, string> = {
  [ROUND_DRAW_VIEW.QUALIFICATION_PENDING]: 'info',
  [ROUND_DRAW_VIEW.PREVIOUS_INCOMPLETE]: 'info',
  [ROUND_DRAW_VIEW.FINISHED]: 'success',
  [ROUND_DRAW_VIEW.UNDRAWABLE]: 'error',
  [ROUND_DRAW_VIEW.CHOICE]: 'info',
  [ROUND_DRAW_VIEW.ENTRY]: 'info',
  [ROUND_DRAW_VIEW.DRAWN]: 'info'
}

/** Les deux côtés d'une affiche, dans l'ordre de saisie. */
export const ROUND_DRAW_SIDES: readonly TSidePosition[] = [1, 2]

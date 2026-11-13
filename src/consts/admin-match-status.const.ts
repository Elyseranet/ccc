import { EDITION_CHIP_FAMILY } from '../enums/edition-tab.enum.js'
import { MATCH_ACTION } from '../enums/match-action.enum.js'
import { MATCH_STATUS } from '../enums/match.enum.js'
import type { ITranslatableText } from '../interfaces/common-components.interface.js'

/** Statut d'un match dans la file, écrit en toutes lettres (jamais porté par la seule couleur). */
export const ADMIN_MATCH_STATUS_VIEW: Record<MATCH_STATUS, { label: ITranslatableText, family: EDITION_CHIP_FAMILY }> = {
  [MATCH_STATUS.RECORDED]: { label: { key: 'admin.matches.status_recorded', fallback: 'Saisi · à valider' }, family: EDITION_CHIP_FAMILY.TINTED_WARNING },
  [MATCH_STATUS.SCHEDULED]: { label: { key: 'admin.matches.status_scheduled', fallback: 'Sans score' }, family: EDITION_CHIP_FAMILY.NEUTRAL },
  [MATCH_STATUS.VALIDATED]: { label: { key: 'admin.matches.status_validated', fallback: 'Validé' }, family: EDITION_CHIP_FAMILY.TINTED_SUCCESS },
  [MATCH_STATUS.RESULT_UNKNOWN]: { label: { key: 'admin.matches.status_unknown', fallback: 'Résultat inconnu' }, family: EDITION_CHIP_FAMILY.TINTED_INFO }
}

/** Ordre de la file de traitement : à valider d'abord, puis sans score, puis validés (pas l'ordre chronologique). */
export const ADMIN_MATCH_QUEUE_ORDER: Record<MATCH_STATUS, number> = {
  [MATCH_STATUS.RECORDED]: 0,
  [MATCH_STATUS.SCHEDULED]: 1,
  [MATCH_STATUS.VALIDATED]: 2,
  [MATCH_STATUS.RESULT_UNKNOWN]: 3
}

/** Bouton d'une carte : « Valider » (CTA ambre) pour un score saisi, « Saisir » (contour) pour un match sans score. */
export const MATCH_ACTION_VIEW: Record<MATCH_ACTION, {
  label: ITranslatableText
  aria: ITranslatableText
  /** Départage à 3 côtés ou plus : le nom du bouton liste tous les joueurs. */
  ariaMulti: ITranslatableText
  variant: 'flat' | 'outlined'
  bgColor?: string
  elevation?: string
  hover?: { elevation: string }
  dataCy: string
}> = {
  [MATCH_ACTION.VALIDATE]: {
    label: { key: 'admin.matches.action_validate', fallback: 'Valider' },
    aria: { key: 'admin.matches.action_validate_aria', fallback: 'Valider {first} contre {second}' },
    ariaMulti: { key: 'admin.matches.action_validate_multi_aria', fallback: 'Valider le départage {players}' },
    variant: 'flat',
    bgColor: 'primary',
    elevation: 'lg',
    hover: { elevation: 'xl' },
    dataCy: 'validate'
  },
  [MATCH_ACTION.ENTER]: {
    label: { key: 'admin.matches.action_enter', fallback: 'Saisir' },
    aria: { key: 'admin.matches.action_enter_aria', fallback: 'Saisir {first} contre {second}' },
    ariaMulti: { key: 'admin.matches.action_enter_multi_aria', fallback: 'Saisir le départage {players}' },
    variant: 'outlined',
    dataCy: 'enter'
  }
}

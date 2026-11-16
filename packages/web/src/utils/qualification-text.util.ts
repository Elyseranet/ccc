import { ROUND_DRAW_TEXTS } from '../consts/round-draw.const.js'
import { QUALIFICATION_BLOCKER_TEXT } from '../consts/qualification-view.const.js'
import { QUALIFICATION_BLOCKER } from '../enums/qualification.enum.js'
import type { ROUND_KIND } from '../enums/round.enum.js'
import type { TTranslate } from '../types/translate.type.js'

/*********************************************************
 * Qualification : textes qui s'accordent en nombre
 *
 * @description
 * Le moteur de traduction ne connaît pas les pluriels : un compte s'écrit avec sa clé au singulier ou au pluriel, choisie ici, pas dans le gabarit.
 ********************************************************/
export const countTies = (t: TTranslate, count: number): string => count === 1
  ? t('admin.qualification.count_ties_one', '1 égalité restante')
  : t('admin.qualification.count_ties_other', '{count} égalités restantes', { count })

export const countPending = (t: TTranslate, count: number): string => count === 1
  ? t('admin.qualification.count_pending_one', '1 match de poule à valider')
  : t('admin.qualification.count_pending_other', '{count} matchs de poule à valider', { count })

/** « Indisponible : 2 égalités restantes et 3 matchs de poule à valider. », ou la raison propre aux autres blocages. */
export const blockerText = (t: TTranslate, blocker: QUALIFICATION_BLOCKER, pending: number, ties: number): string => {
  if (blocker === QUALIFICATION_BLOCKER.PENDING_MATCHES) {
    return t('admin.qualification.blocker_reasons', 'Indisponible : {reasons}.', { reasons: countPending(t, pending) })
  }
  if (blocker === QUALIFICATION_BLOCKER.TIES_LEFT) {
    return t('admin.qualification.blocker_reasons', 'Indisponible : {reasons}.', { reasons: countTies(t, ties) })
  }
  if (blocker === QUALIFICATION_BLOCKER.PENDING_AND_TIES) {
    return t('admin.qualification.blocker_reasons', 'Indisponible : {reasons}.', {
      reasons: t('admin.qualification.blocker_both', '{ties} et {pending}', { ties: countTies(t, ties), pending: countPending(t, pending) })
    })
  }
  const text = QUALIFICATION_BLOCKER_TEXT[blocker]
  return text ? t(text.key, text.fallback) : ''
}

/** « des huitièmes » (forme « de » du tour, comme dans la page de tirage), ou « du premier tour » quand le tour n'est pas connu : le gabarit dit « le tirage {round} ». */
export const firstRoundText = (t: TTranslate, kind: ROUND_KIND | null): string => kind === null
  ? t('admin.qualification.first_round_of', 'du premier tour')
  : t(ROUND_DRAW_TEXTS[kind].of.key, ROUND_DRAW_TEXTS[kind].of.fallback)

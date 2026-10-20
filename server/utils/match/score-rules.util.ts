import {
  SCORE_TARGET_KNOCKOUT,
  SCORE_TARGET_POOL,
  SCORE_TARGET_TIEBREAK_THREE_SIDES,
  SIDES_DUEL,
  SIDES_TRIPLE,
} from '../../consts/domain-rules.const'
import { SCORE_ERROR_CODE } from '../../enums/domain.enum'
import type { IScoreValidation } from '../../interfaces/match.interface'
import { MATCH_PURPOSE } from '../../../shared/enums/match.enum'
import { ROUND_KIND } from '../../../shared/enums/round.enum'

function inconsistent(reason: string): IScoreValidation {
  return { valid: false, code: SCORE_ERROR_CODE.SCORE_INCONSISTENT, reason }
}

/**
 * Score cible : 5 en poule et en départage 1v1, 10 en phase finale (RG21, RG22),
 * 3 pour un départage à trois côtés (A11).
 * Barrages (PLAYOFF) : phase finale, donc 10 ; constat sur l'onglet `scores`, les 8 matchs
 * `1/16` de 2024 ont tous un vainqueur à 10.
 */
export function targetScore(roundKind: ROUND_KIND, purpose: MATCH_PURPOSE, sides: number): number {
  if (purpose === MATCH_PURPOSE.TIEBREAK) {
    return sides === SIDES_TRIPLE ? SCORE_TARGET_TIEBREAK_THREE_SIDES : SCORE_TARGET_POOL
  }
  return roundKind === ROUND_KIND.POOLS ? SCORE_TARGET_POOL : SCORE_TARGET_KNOCKOUT
}

/**
 * RG21, RG22, A11 : exactement un côté atteint la cible ; les autres sont des entiers dans
 * [0, cible-1]. Deux côtés, ou trois pour un départage uniquement. Sinon SCORE_INCONSISTENT (422).
 */
export function validateScore(
  roundKind: ROUND_KIND,
  purpose: MATCH_PURPOSE,
  scores: readonly number[],
): IScoreValidation {
  const sides = scores.length
  const sidesAllowed =
    sides === SIDES_DUEL || (sides === SIDES_TRIPLE && purpose === MATCH_PURPOSE.TIEBREAK)
  if (!sidesAllowed) {
    return inconsistent(`Nombre de côtés invalide : ${sides}`)
  }
  if (!scores.every((score) => Number.isInteger(score) && score >= 0)) {
    return inconsistent('Les scores sont des entiers positifs ou nuls')
  }
  const target = targetScore(roundKind, purpose, sides)
  const reaching = scores.filter((score) => score === target).length
  if (reaching !== 1) {
    return inconsistent(`Exactement un côté doit atteindre ${target}`)
  }
  if (!scores.every((score) => score <= target)) {
    return inconsistent(`Aucun score ne dépasse ${target}`)
  }
  return { valid: true }
}

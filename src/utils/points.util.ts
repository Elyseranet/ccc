import {
  CENTS_PER_POINT,
  POINTS_BASE_SCALE,
  POINTS_REFERENCE_PARTICIPANTS,
} from '../consts/domain-rules.const.js'
import { DOMAIN_ERROR_CODE } from '../enums/domain.enum.js'
import { FINAL_STAGE } from '../enums/participation.enum.js'
import { DomainRuleError } from './domain-rule-error.util.js'

/**
 * RG1, RG2 : points d'une participation, en centièmes (entier).
 * points = base x N / 50. Avec un barème entier, base x N x 100 / 50 est toujours entier :
 * aucun flottant n'intervient.
 *
 * RG3 : si `playedStages` est fourni et ne contient pas `stage`, le tour n'a pas été disputé
 * dans cette édition (pas de huitièmes avant 2015, pas de barrages hors 2024) : on lève plutôt
 * que d'attribuer des points. Une élimination en poule est toujours possible.
 */
export function computeParticipationPointsCents(
  stage: FINAL_STAGE,
  participants: number,
  playedStages?: readonly FINAL_STAGE[],
): number {
  if (!Number.isInteger(participants) || participants <= 0) {
    throw new DomainRuleError(
      DOMAIN_ERROR_CODE.INVALID_PARAMETER,
      `Effectif invalide : ${participants}`,
    )
  }
  if (
    playedStages !== undefined &&
    stage !== FINAL_STAGE.POOL_ELIMINATED &&
    !playedStages.includes(stage)
  ) {
    throw new DomainRuleError(
      DOMAIN_ERROR_CODE.STAGE_NOT_PLAYED,
      `Le tour ${stage} n'a pas été disputé dans cette édition`,
    )
  }
  return Math.round(
    (POINTS_BASE_SCALE[stage] * participants * CENTS_PER_POINT) / POINTS_REFERENCE_PARTICIPANTS,
  )
}

/** RG2 : points d'une participation, en points (2 décimales exactes). */
export function computeParticipationPoints(
  stage: FINAL_STAGE,
  participants: number,
  playedStages?: readonly FINAL_STAGE[],
): number {
  return computeParticipationPointsCents(stage, participants, playedStages) / CENTS_PER_POINT
}

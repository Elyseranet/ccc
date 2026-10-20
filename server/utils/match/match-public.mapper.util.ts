import type { MatchEntity } from '../../database/entities/match.entity'
import { MATCH_STATUS } from '../../../shared/enums/match.enum'
import type { IMatch, IMatchSide } from '../../../shared/interfaces/api/match.interface'

/**
 * Côté public, un score saisi mais non validé est « à jouer » (E-f) : RECORDED est sérialisé en
 * SCHEDULED, pour que ni le statut ni un score ne trahissent la saisie.
 */
export const toPublicMatchStatus = (status: MATCH_STATUS): MATCH_STATUS =>
  status === MATCH_STATUS.RECORDED ? MATCH_STATUS.SCHEDULED : status

/** Statuts stockés recouverts par un statut public : SCHEDULED couvre aussi RECORDED. */
export const toStoredMatchStatuses = (status: MATCH_STATUS): MATCH_STATUS[] =>
  status === MATCH_STATUS.SCHEDULED ? [MATCH_STATUS.SCHEDULED, MATCH_STATUS.RECORDED] : [status]

const toPublicSide = (side: MatchEntity['sides'][number], validated: boolean): IMatchSide => ({
  participationId: side.participationId,
  competitorId: side.participation.competitorId,
  displayName: side.participation.competitor.displayName,
  // `recordedScore` n'est jamais lu ici ; `validatedScore` n'est publié que sur un match VALIDATED.
  score: validated ? side.validatedScore : null
})

/** Vainqueur unique d'un match VALIDATED ; null sinon (égalité, pas de score, match non validé). */
const findWinner = (sides: IMatchSide[]): string | null => {
  const scored = sides.filter((side): side is IMatchSide & { score: number } => side.score !== null)
  if (scored.length !== sides.length || scored.length < 2) {
    return null
  }
  const best = Math.max(...scored.map((side) => side.score))
  const leaders = scored.filter((side) => side.score === best)
  return leaders.length === 1 ? leaders[0]!.participationId : null
}

/**
 * DTO public d'un match. Liste blanche : ni `comment` (A13), ni `recordedScore`, ni version
 * ni auteur de validation. Le match doit être chargé avec `round`, `pool` et
 * `sides.participation.competitor`.
 */
export const toPublicMatch = (match: MatchEntity): IMatch => {
  const validated = match.status === MATCH_STATUS.VALIDATED
  const sides = [...match.sides]
    .sort((a, b) => a.position - b.position)
    .map((side) => toPublicSide(side, validated))
  return {
    id: match.id,
    sequence: match.sequence,
    roundKind: match.round.kind,
    poolRank: match.pool?.rank ?? null,
    purpose: match.purpose,
    targetScore: match.targetScore,
    status: toPublicMatchStatus(match.status),
    sides,
    winnerParticipationId: validated ? findWinner(sides) : null
  }
}

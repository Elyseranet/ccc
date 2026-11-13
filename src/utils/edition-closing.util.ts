import { CLOSING_STAGE_BY_ROUND_KIND, FINAL_STAGE_ORDER } from '../consts/edition-closing.const.js'
import { CENTS_PER_POINT } from '../consts/domain-rules.const.js'
import { API_ERROR_CODE } from '../enums/api-error-code.enum.js'
import { MATCH_PURPOSE } from '../enums/match.enum.js'
import { FINAL_STAGE } from '../enums/participation.enum.js'
import { ROUND_KIND } from '../enums/round.enum.js'
import type { IClosingPreview } from '../interfaces/edition-closing.interface.js'
import type { TClosingInput } from '../types/edition-closing.type.js'
import { computeParticipationPointsCents } from './points.util.js'

/**
 * RG1 à RG3 : stade final et points de chaque participation. Fonction pure, partagée navigateur et serveur : l'aperçu de la
 * clôture (F-26) et le gel des points (B-14) passent par elle, donc aucun écart possible (CLOSE-PREVIEW).
 *
 * Le stade se déduit des matchs de phase finale décidés : le perdant d'un tour prend le stade de ce tour, le vainqueur de la
 * finale est CHAMPION, un joueur sans match de phase finale reste POOL_ELIMINATED. N = nombre de participations.
 */
export const computeClosingPreview = (edition: TClosingInput): IClosingPreview => {
  const participantCount = edition.participants.length
  const knockout = edition.matches.filter((match) =>
    match.purpose === MATCH_PURPOSE.REGULAR && CLOSING_STAGE_BY_ROUND_KIND[match.roundKind] !== undefined)
  const finals = knockout.filter((match) => match.roundKind === ROUND_KIND.FINAL)
  if (finals.length === 0 || finals.some((match) => match.winnerParticipationId === null)) {
    return { participantCount, blockedBy: API_ERROR_CODE.FINAL_NOT_VALIDATED, results: [], playedStages: [] }
  }

  const reached = new Map<string, FINAL_STAGE>()
  const reach = (participationId: string, stage: FINAL_STAGE): void => {
    const current = reached.get(participationId) ?? FINAL_STAGE.POOL_ELIMINATED
    if (FINAL_STAGE_ORDER.indexOf(stage) > FINAL_STAGE_ORDER.indexOf(current)) {
      reached.set(participationId, stage)
    }
  }
  for (const match of knockout.filter((candidate) => candidate.winnerParticipationId !== null)) {
    for (const side of match.sides) {
      if (side.participationId !== match.winnerParticipationId) {
        reach(side.participationId, CLOSING_STAGE_BY_ROUND_KIND[match.roundKind]!)
      } else if (match.roundKind === ROUND_KIND.FINAL) {
        reach(side.participationId, FINAL_STAGE.CHAMPION)
      }
    }
  }

  // RG3 : un tour non disputé ne rapporte rien ; le vainqueur de la finale compte aussi comme finaliste.
  const playedStages = [...new Set([
    ...edition.rounds.map((round) => round.kind),
    ...knockout.map((match) => match.roundKind)
  ].flatMap((kind) => {
    const stage = CLOSING_STAGE_BY_ROUND_KIND[kind]
    return stage === undefined ? [] : kind === ROUND_KIND.FINAL ? [stage, FINAL_STAGE.CHAMPION] : [stage]
  }))]
  return {
    participantCount,
    blockedBy: null,
    playedStages,
    results: edition.participants.map((participant) => {
      const finalStage = reached.get(participant.participationId) ?? FINAL_STAGE.POOL_ELIMINATED
      return {
        participationId: participant.participationId,
        finalStage,
        points: computeParticipationPointsCents(finalStage, participantCount, playedStages) / CENTS_PER_POINT
      }
    })
  }
}

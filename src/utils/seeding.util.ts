import type { ISeedCandidate, ISeedRanking } from '../interfaces/draw.interface.js'
import type { IStagedParticipation } from '../interfaces/ranking.interface.js'
import type { TSeedCounters } from '../types/draw.type.js'
import { FINAL_STAGE } from '../enums/participation.enum.js'

/**
 * RG10 : compare deux candidats. Ordre : ACP, titres, finales, demies, quarts, huitièmes,
 * barrages (tous décroissants), puis nombre de participations CROISSANT. 0 = égalité parfaite.
 */
function compareSeedCandidates(a: ISeedCandidate, b: ISeedCandidate): number {
  return (
    b.acp - a.acp ||
    b.titles - a.titles ||
    b.finals - a.finals ||
    b.semis - a.semis ||
    b.quarters - a.quarters ||
    b.roundsOf16 - a.roundsOf16 ||
    b.playoffs - a.playoffs ||
    a.participations - b.participations
  )
}

/**
 * RG9, RG10 : classe les candidats aux têtes de série. Le classeur ne prévoit aucun critère
 * au-delà de RG10 : une égalité parfaite n'est jamais tranchée (ni par id, ni au hasard), elle
 * est remontée dans `unresolvedTies`. Au sein d'un groupe à égalité, l'ordre de `ranked` suit
 * l'ordre d'entrée et ne signifie rien.
 */
export function rankSeedCandidates(candidates: readonly ISeedCandidate[]): ISeedRanking {
  const ranked = [...candidates].sort(compareSeedCandidates)
  const unresolvedTies: string[][] = []
  let group: ISeedCandidate[] = []
  for (const candidate of ranked) {
    if (group.length > 0 && compareSeedCandidates(group[0]!, candidate) !== 0) {
      if (group.length > 1) {
        unresolvedTies.push(group.map((member) => member.playerId))
      }
      group = []
    }
    group.push(candidate)
  }
  if (group.length > 1) {
    unresolvedTies.push(group.map((member) => member.playerId))
  }
  return { ranked, unresolvedTies }
}

/**
 * Compteurs de RG10 pour un joueur, depuis ses tours atteints.
 * Interprétation (RG10 ne le précise pas) : « finales jouées » inclut les titres, « demies
 * jouées » inclut les finales, etc. Barrages : seul le tour PLAYOFF compte, car un qualifié
 * direct pour les huitièmes n'a pas joué de barrage. Participations croissantes : Je ne sais
 * pas si une participation sans classement final doit compter ; toutes sont comptées.
 */
export function countStagesReached(participations: readonly IStagedParticipation[]): TSeedCounters {
  const count = (...stages: FINAL_STAGE[]): number =>
    participations.filter((participation) => stages.includes(participation.finalStage)).length
  const finals = count(FINAL_STAGE.CHAMPION, FINAL_STAGE.FINALIST)
  const semis = finals + count(FINAL_STAGE.SEMI)
  const quarters = semis + count(FINAL_STAGE.QUARTER)
  return {
    titles: count(FINAL_STAGE.CHAMPION),
    finals,
    semis,
    quarters,
    roundsOf16: quarters + count(FINAL_STAGE.ROUND_OF_16),
    playoffs: count(FINAL_STAGE.PLAYOFF),
    participations: participations.length,
  }
}

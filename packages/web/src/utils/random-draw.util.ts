import { randomInt } from 'node:crypto'
import type { IDrawAssignmentInput } from '../interfaces/draw.interface.js'
import type { IRoundDrawAssignmentInput } from '../interfaces/qualification.interface.js'
import type { IPoolRandomDrawInput } from '../interfaces/random-draw.interface.js'
import type { TRandomInt } from '../types/random-draw.type.js'
import { poolSizes } from './pool-size.util.js'

/*********************************************************
 * Tirage au sort par le serveur (B-26, amendement A1 du 2026-11-16)
 *
 * @description
 * Fonctions pures hors du hasard : `random` est injecté (les tests le fixent). Le serveur n'a que `crypto.randomInt`
 * (uniforme, sans biais de modulo), jamais `Math.random`. Les affectations produites ont exactement le format de la saisie
 * du tirage physique : elles passent les mêmes contrôles que `PUT /tirages/{id}/affectations`.
 ********************************************************/
export const secureRandomInt: TRandomInt = (maxExclusive) => randomInt(maxExclusive)

/** Fisher-Yates : une permutation uniforme, la liste reçue n'est pas modifiée. */
export const shuffle = <T>(items: readonly T[], random: TRandomInt = secureRandomInt): T[] => {
  const result = [...items]
  for (let index = result.length - 1; index > 0; index -= 1) {
    const other = random(index + 1)
    ;[result[index], result[other]] = [result[other]!, result[index]!]
  }
  return result
}

/**
 * RG11 : les têtes de série d'abord, une par poule (poule tirée au hasard, `drawnOrder` conservé = rang dans la liste reçue),
 * puis les autres poule après poule, dans l'ordre du tirage (`drawnOrder` à la suite des têtes de série). Tailles des poules : RG16
 * (`poolSizes`, les plus grandes d'abord). Exige autant de têtes de série que de poules (RG9).
 */
export const drawPoolAssignments = (input: IPoolRandomDrawInput, random: TRandomInt = secureRandomInt): IDrawAssignmentInput[] => {
  const { seedIds, otherIds, poolCount } = input
  const sizes = poolSizes(seedIds.length + otherIds.length, poolCount)
  const seeds = shuffle(seedIds.map((participationId, index) => ({ participationId, drawnOrder: index + 1 })), random)
    .map((seed, index) => ({ ...seed, poolNumber: index + 1 }))
  const others = shuffle(otherIds, random)
  const drawn: IDrawAssignmentInput[] = []
  let cursor = 0
  for (let pool = 1; pool <= poolCount; pool += 1) {
    for (let slot = 1; slot < sizes[pool - 1]!; slot += 1) {
      drawn.push({ participationId: others[cursor]!, poolNumber: pool, drawnOrder: seedIds.length + cursor + 1 })
      cursor += 1
    }
  }
  return [...seeds, ...drawn]
}

/** RG13, RG14 : tirage global du tour, sur tout le vivier mélangé ; affiches 1..k, côtés 1 puis 2, dans l'ordre du tirage. */
export const drawRoundAssignments = (participationIds: readonly string[], random: TRandomInt = secureRandomInt): IRoundDrawAssignmentInput[] =>
  shuffle(participationIds, random).map((participationId, index) => ({
    participationId,
    pairingIndex: Math.floor(index / 2) + 1,
    sidePosition: index % 2 === 0 ? 1 : 2,
    drawnOrder: index + 1
  }))

import { randomInt } from 'node:crypto'
import type { IPoolStep, IPoolStepInput } from '../interfaces/random-draw.interface.js'
import type { TRandomInt } from '../types/random-draw.type.js'

/*********************************************************
 * Tirage au sort par le serveur, une étape à la fois (B-26, amendement A1 du 2026-11-16)
 *
 * @description
 * Chaque appel tire la prochaine étape parmi les joueurs restants : un tirage sans remise, donc l'étape d'un Fisher-Yates
 * (une position uniforme parmi les restants). `random` est injecté (les tests le fixent) ; la production n'a que
 * `crypto.randomInt` (uniforme, sans biais de modulo), jamais `Math.random`. Rien n'est connu à l'avance : aucun état n'est
 * conservé entre deux appels, l'étape suivante se déduit du brouillon.
 ********************************************************/
export const secureRandomInt: TRandomInt = (maxExclusive) => randomInt(maxExclusive)

/** Un élément tiré uniformément. */
export const pickRandom = <T>(items: readonly T[], random: TRandomInt = secureRandomInt): T => items[random(items.length)]!

/**
 * RG11, RG16 : le prochain joueur et sa poule. Les poules se remplissent dans l'ordre (la première qui n'est pas à sa taille), le
 * joueur est tiré parmi les restants. `null` quand toutes les poules sont à leur taille.
 */
export const drawPoolStep = (input: IPoolStepInput, random: TRandomInt = secureRandomInt): IPoolStep | null => {
  const poolIndex = input.sizes.findIndex((size, index) => (input.filled[index] ?? 0) < size)
  return poolIndex === -1 ? null : { participationId: pickRandom(input.remainingIds, random), poolNumber: poolIndex + 1 }
}

/** RG13, RG14 : `count` joueurs distincts tirés parmi les restants (2 pour une affiche, 1 pour compléter une affiche commencée), hasard pur. */
export const drawRoundStep = (remainingIds: readonly string[], count: 1 | 2, random: TRandomInt = secureRandomInt): string[] => {
  const left = [...remainingIds]
  return Array.from({ length: count }, () => left.splice(random(left.length), 1)[0]!)
}

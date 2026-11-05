import type { ISeedCandidate } from '../interfaces/draw.interface.js'

/** Côté d'une affiche d'un tirage de tour : 1 ou 2. */
export type TSidePosition = 1 | 2

export type TSeedCounters = Omit<ISeedCandidate, 'playerId' | 'acp'>

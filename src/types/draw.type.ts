import type { ISeedCandidate } from '../interfaces/draw.interface.js'

export type TSeedCounters = Omit<ISeedCandidate, 'playerId' | 'acp'>

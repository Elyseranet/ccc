import type { ISeedCandidate } from '../interfaces/draw.interface'

export type TSeedCounters = Omit<ISeedCandidate, 'playerId' | 'acp'>

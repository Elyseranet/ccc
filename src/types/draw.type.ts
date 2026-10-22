import type { ISeedCandidate } from '../server/interfaces/draw.interface'

export type TSeedCounters = Omit<ISeedCandidate, 'playerId' | 'acp'>

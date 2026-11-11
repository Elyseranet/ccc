import type { IUpdateDrawAssignmentsRequest, ISeedCandidate } from '../interfaces/draw.interface.js'
import type { IUpdateRoundDrawRequest } from '../interfaces/qualification.interface.js'

/** Corps de `PUT /tirages/{id}/affectations` : poules (`poolNumber`) ou tour (`pairingIndex`, `sidePosition`). */
export type TUpdateDrawRequest = IUpdateDrawAssignmentsRequest | IUpdateRoundDrawRequest

/** Côté d'une affiche d'un tirage de tour : 1 ou 2. */
export type TSidePosition = 1 | 2

export type TSeedCounters = Omit<ISeedCandidate, 'playerId' | 'acp'>

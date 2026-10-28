import type { IAddExistingParticipantRequest, IAddNewParticipantRequest } from '../interfaces/edition.interface.js'

/** Corps de `POST /editions/{id}/participants` : exactement l'une des deux formes. */
export type TAddParticipantRequest = IAddExistingParticipantRequest | IAddNewParticipantRequest

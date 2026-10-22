import type { CompetitorEntity } from '../server/db/typeorm/entities/competitor.entity.js'
import type { ICompetitorPublic } from '../interfaces/competitor.interface.js'

/** Liste blanche : un champ ajouté à l'entité (email, téléphone...) ne fuit jamais par défaut. */
export const toCompetitorPublic = (entity: CompetitorEntity): ICompetitorPublic => ({
  id: entity.id,
  displayName: entity.displayName,
  firstName: entity.firstName,
  lastName: entity.lastName,
  nickname: entity.nickname,
  avatarUrl: entity.avatarUrl
})

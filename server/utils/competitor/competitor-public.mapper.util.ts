import type { CompetitorEntity } from '../../database/entities/competitor.entity'
import type { ICompetitorPublic } from '../../../shared/interfaces/api/competitor.interface'

/** Liste blanche : un champ ajouté à l'entité (email, téléphone...) ne fuit jamais par défaut. */
export const toCompetitorPublic = (entity: CompetitorEntity): ICompetitorPublic => ({
  id: entity.id,
  displayName: entity.displayName,
  firstName: entity.firstName,
  lastName: entity.lastName,
  nickname: entity.nickname,
  avatarUrl: entity.avatarUrl
})

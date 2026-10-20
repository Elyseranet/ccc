import type { DataSource } from 'typeorm'
import type { IMe } from '../../../shared/interfaces/api/me.interface'
import { UserEntity } from '../../database/entities/user.entity'
import { notFound } from '../http/api-error.util'

/**
 * Construit `IMe` champ par champ : ni le hash ni aucun autre champ de l'entité ne peut fuiter
 * par sérialisation implicite.
 */
export const loadMe = async (dataSource: DataSource, userId: string): Promise<IMe> => {
  const user = await dataSource.getRepository(UserEntity).findOne({
    where: { id: userId },
    relations: { competitor: true }
  })
  if (!user) {
    throw notFound()
  }
  const competitor = user.competitor
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    competitor: competitor
      ? {
          id: competitor.id,
          displayName: competitor.displayName,
          firstName: competitor.firstName,
          lastName: competitor.lastName,
          nickname: competitor.nickname,
          avatarUrl: competitor.avatarUrl,
          phone: competitor.phone
        }
      : null
  }
}

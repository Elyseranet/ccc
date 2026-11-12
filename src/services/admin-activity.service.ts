import { IsNull, Not } from 'typeorm'
import type { DataSource } from 'typeorm'
import { ADMIN_DRAW_RELATIONS } from '../consts/draw.const.js'
import { ADMIN_MATCH_RELATIONS } from '../consts/match-score.const.js'
import type { IAdminActivityItem } from '../interfaces/admin-activity.interface.js'
import { DrawEntity } from '../server/db/typeorm/entities/draw.entity.js'
import { MatchEntity } from '../server/db/typeorm/entities/match.entity.js'
import {
  compareActivity,
  toDrawCreatedActivity,
  toDrawValidatedActivity,
  toMatchActivity
} from '../utils/admin-activity.mapper.util.js'
import { findEditionOrThrow } from './edition.service.js'

/*********************************************************
 * AdminActivityService
 *
 * @description
 * Flux d'activité du tableau de bord admin (A17, B-15), dérivé : aucune table d'audit. Trois sources, une requête
 * chacune, relations chargées en une passe : validations de match, créations et validations de tirage (brouillons
 * compris, C7). Chaque source est bornée à `limit` : les `limit` entrées les plus récentes du flux fusionné sont
 * forcément parmi les `limit` plus récentes de leur source.
 ********************************************************/
export const loadAdminActivity = async (dataSource: DataSource, idOrCode: string, limit: number): Promise<IAdminActivityItem[]> => {
  const { id: editionId } = await findEditionOrThrow(dataSource, idOrCode)
  const draws = dataSource.getRepository(DrawEntity)
  const [matches, created, validated] = await Promise.all([
    dataSource.getRepository(MatchEntity).find({
      where: { editionId, validatedAt: Not(IsNull()) },
      relations: ADMIN_MATCH_RELATIONS,
      order: { validatedAt: 'DESC', id: 'ASC' },
      take: limit
    }),
    draws.find({ where: { editionId }, relations: ADMIN_DRAW_RELATIONS, order: { createdAt: 'DESC', id: 'ASC' }, take: limit }),
    draws.find({
      where: { editionId, validatedAt: Not(IsNull()) },
      relations: ADMIN_DRAW_RELATIONS,
      order: { validatedAt: 'DESC', id: 'ASC' },
      take: limit
    })
  ])
  return [...matches.map(toMatchActivity), ...created.map(toDrawCreatedActivity), ...validated.map(toDrawValidatedActivity)]
    .sort(compareActivity)
    .slice(0, limit)
}

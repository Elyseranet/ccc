import type { DataSource } from 'typeorm'
import { AVATAR_VERSION_LENGTH } from '../consts/avatar.const.js'
import { CompetitorAvatarEntity } from '../server/db/typeorm/entities/competitor-avatar.entity.js'
import { CompetitorEntity } from '../server/db/typeorm/entities/competitor.entity.js'
import type { IProcessedAvatar, IStoredAvatar } from '../interfaces/avatar.interface.js'
import { buildAvatarUrl } from '../utils/avatar-url.util.js'
import { detectAvatarMimeType, processAvatarImage } from '../utils/avatar-image.util.js'
import { avatarUnsupportedType, competitorNotFound, notFound } from '../utils/api-error.util.js'

/**
 * Valide la signature (415), ré-encode (422 si illisible), puis remplace l'avatar du compétiteur
 * en une seule instruction (upsert). 404 si le compétiteur n'existe pas.
 */
export const replaceAvatar = async (dataSource: DataSource, competitorId: string, upload: Buffer): Promise<string> => {
  const mimeType = detectAvatarMimeType(upload)
  if (!mimeType) {
    throw avatarUnsupportedType()
  }
  if (!(await dataSource.getRepository(CompetitorEntity).exists({ where: { id: competitorId } }))) {
    throw competitorNotFound()
  }
  const processed: IProcessedAvatar = await processAvatarImage(upload, mimeType)
  await dataSource.getRepository(CompetitorAvatarEntity).upsert(
    { competitorId, ...processed, updatedAt: new Date() },
    ['competitorId']
  )
  return buildAvatarUrl(competitorId, processed.sha256.slice(0, AVATAR_VERSION_LENGTH))!
}

/** 404 `COMPETITOR_NOT_FOUND` si le compétiteur est inconnu, 404 si le compétiteur n'a pas d'avatar. */
export const removeAvatar = async (dataSource: DataSource, competitorId: string): Promise<void> => {
  const result = await dataSource.getRepository(CompetitorAvatarEntity).delete({ competitorId })
  if (!result.affected) {
    if (!(await dataSource.getRepository(CompetitorEntity).exists({ where: { id: competitorId } }))) {
      throw competitorNotFound()
    }
    throw notFound()
  }
}

/** Lit l'image seule : `null` si le compétiteur n'a pas d'avatar. */
export const findAvatar = async (dataSource: DataSource, competitorId: string): Promise<IStoredAvatar | null> =>
  dataSource.getRepository(CompetitorAvatarEntity).findOne({
    where: { competitorId },
    select: { competitorId: true, content: true, mimeType: true, sha256: true }
  }).then((row) => row && { content: row.content, mimeType: row.mimeType, sha256: row.sha256 })

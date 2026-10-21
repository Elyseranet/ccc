import type { DataSource } from 'typeorm'
import { CompetitorEntity } from '../../database/entities/competitor.entity'
import { LoginDeviceEntity } from '../../database/entities/login-device.entity'
import { UserEntity } from '../../database/entities/user.entity'
import type { IProfileChanges } from '../../interfaces/auth.interface'
import { revokeOtherSessions } from './session-store.util'

/**
 * Applique en UNE transaction les changements de `PATCH /moi`. Un changement de mot de passe, dans la
 * même transaction : met à jour le hash, supprime les appareils de confiance du compte (un cookie d'appareil
 * volé perd son passe-droit ; l'appareil courant le retrouvera à sa prochaine connexion réussie) et révoque
 * les autres sessions. Si une étape échoue, rien n'est appliqué.
 */
export const applyProfileChanges = async (dataSource: DataSource, changes: IProfileChanges, now = new Date()): Promise<void> => {
  await dataSource.transaction(async (manager) => {
    if (changes.competitorId && (changes.avatarUrl !== undefined || changes.phone !== undefined)) {
      await manager.getRepository(CompetitorEntity).update({ id: changes.competitorId }, {
        ...(changes.avatarUrl !== undefined ? { avatarUrl: changes.avatarUrl } : {}),
        ...(changes.phone !== undefined ? { phone: changes.phone } : {})
      })
    }
    if (changes.newPasswordHash) {
      await manager.getRepository(UserEntity).update({ id: changes.userId }, { passwordHash: changes.newPasswordHash })
      await manager.getRepository(LoginDeviceEntity).delete({ userId: changes.userId })
      await revokeOtherSessions(manager, changes.userId, changes.currentSessionId, now)
    }
  })
}

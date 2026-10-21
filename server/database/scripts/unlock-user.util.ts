import type { DataSource } from 'typeorm'
import { normalizeEmail } from '../../../shared/utils/email.util.js'
import { LoginDeviceEntity } from '../entities/login-device.entity.js'
import { UserEntity } from '../entities/user.entity.js'

/**
 * Remet à zéro le compteur d'échecs et le délai d'un compte, et révoque ses appareils de confiance
 * (SEC-A4) : leurs cookies deviennent « non reconnus ». Renvoie `false` si l'email est inconnu.
 */
export const unlockUser = async (dataSource: DataSource, email: string): Promise<boolean> => {
  const user = await dataSource.getRepository(UserEntity).findOne({
    where: { email: normalizeEmail(email) },
    select: { id: true }
  })
  if (!user) {
    return false
  }
  await dataSource.transaction(async (manager) => {
    await manager.getRepository(UserEntity).update({ id: user.id }, { failedLoginCount: 0, throttledUntil: null })
    await manager.getRepository(LoginDeviceEntity).delete({ userId: user.id })
  })
  return true
}

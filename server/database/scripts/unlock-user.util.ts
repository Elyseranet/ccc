import type { DataSource } from 'typeorm'
import { normalizeEmail } from '../../../shared/utils/email.util.js'
import { UserEntity } from '../entities/user.entity.js'

/** Remet à zéro le compteur d'échecs et le délai d'un compte. Renvoie `false` si l'email est inconnu. */
export const unlockUser = async (dataSource: DataSource, email: string): Promise<boolean> => {
  const result = await dataSource.getRepository(UserEntity).update(
    { email: normalizeEmail(email) },
    { failedLoginCount: 0, throttledUntil: null }
  )
  return (result.affected ?? 0) > 0
}

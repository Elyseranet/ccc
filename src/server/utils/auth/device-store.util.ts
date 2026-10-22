import { LessThan } from 'typeorm'
import type { DataSource } from 'typeorm'
import { DEVICE_COOKIE_TTL_SECONDS, MAX_DEVICES_PER_USER } from '../../../consts/auth.const'
import { LoginDeviceEntity } from '../../database/entities/login-device.entity'
import type { IDeviceCookiePayload } from '../../interfaces/auth.interface'
import { generateDeviceNonce } from './device-cookie.util'

/**
 * L'appareil est reconnu seulement si le cookie est signé ET que sa ligne existe encore, pour ce compte,
 * non expirée : supprimer la ligne (révocation, `user:unlock`) invalide le cookie sans toucher au navigateur.
 */
export const findTrustedDevice = async (
  dataSource: DataSource,
  claim: IDeviceCookiePayload,
  userId: string,
  now = new Date()
): Promise<LoginDeviceEntity | null> => {
  if (claim.userId !== userId) {
    return null
  }
  const device = await dataSource.getRepository(LoginDeviceEntity).findOne({ where: { nonce: claim.nonce, userId } })
  return device && device.expiresAt.getTime() > now.getTime() ? device : null
}

/** Enregistre un nouvel appareil de confiance (après une connexion réussie) et borne leur nombre par compte. */
export const registerDevice = async (
  dataSource: DataSource,
  userId: string,
  now = new Date()
): Promise<IDeviceCookiePayload> => {
  const repository = dataSource.getRepository(LoginDeviceEntity)
  const nonce = generateDeviceNonce()
  const expiresAt = new Date(now.getTime() + DEVICE_COOKIE_TTL_SECONDS * 1000)
  await repository.insert({ userId, nonce, expiresAt })

  const surplus = await repository.find({
    where: { userId },
    select: { id: true },
    order: { createdAt: 'DESC' },
    skip: MAX_DEVICES_PER_USER
  })
  if (surplus.length > 0) {
    await repository.delete(surplus.map((device) => device.id))
  }
  await repository.delete({ expiresAt: LessThan(now) })
  return { userId, nonce, expiresAt: Math.floor(expiresAt.getTime() / 1000) }
}

export const resetDeviceFailures = async (dataSource: DataSource, deviceId: string): Promise<void> => {
  await dataSource.getRepository(LoginDeviceEntity).update({ id: deviceId }, { failedLoginCount: 0, throttledUntil: null })
}

import { createHash, randomBytes } from 'node:crypto'
import { INVITATION_TOKEN_BYTES, INVITATION_TOKEN_PATTERN } from '../consts/invitation.const.js'

/**
 * 32 octets aléatoires en base64url ; seule l'empreinte SHA-256 (hexadécimal) est stockée. Autonome (aucune
 * dépendance Nitro) : la commande `user:create-admin` compile ce fichier avec la CLI TypeORM.
 */
export const hashInvitationToken = (token: string): string => createHash('sha256').update(token).digest('hex')

export const generateInvitationToken = (): { token: string, tokenHash: string } => {
  const token = randomBytes(INVITATION_TOKEN_BYTES).toString('base64url')
  return { token, tokenHash: hashInvitationToken(token) }
}

/** Un jeton mal formé est écarté avant toute requête en base. */
export const isWellFormedInvitationToken = (token: string | undefined): token is string =>
  token !== undefined && INVITATION_TOKEN_PATTERN.test(token)

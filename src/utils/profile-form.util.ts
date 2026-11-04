import type { IUpdateMeRequest } from '../interfaces/auth.interface.js'
import { PROFILE_FIELD } from '../enums/account.enum.js'
import type { IMe } from '../interfaces/me.interface.js'

/*********************************************************
 * Profil : ce qui change
 *
 * @description
 * `PATCH /moi` n'accepte que le téléphone et le mot de passe (A4). On n'envoie que ce qui a changé : un téléphone vidé devient
 * `null` (le serveur l'efface), un téléphone inchangé n'est pas renvoyé. Le mot de passe ne part qu'avec le mot de passe
 * actuel. Renvoie `null` quand il n'y a rien à enregistrer.
 ********************************************************/
export const buildProfileChanges = (
  me: IMe,
  values: { phone: string | null, currentPassword: string, newPassword: string }
): IUpdateMeRequest | null => {
  const changes: IUpdateMeRequest = {}
  if (me.competitor) {
    const phone = values.phone?.trim() || null
    if (phone !== me.competitor.phone) {
      changes.phone = phone
    }
  }
  if (values.newPassword) {
    changes.currentPassword = values.currentPassword
    changes.newPassword = values.newPassword
  }
  return Object.keys(changes).length > 0 ? changes : null
}

/** Email masqué pour l'affichage : `s•••••@•••••.fr` (première lettre, puis le domaine réduit à son extension). */
export const maskEmail = (email: string): string => {
  const [local = '', domain = ''] = email.split('@')
  const extension = domain.includes('.') ? domain.slice(domain.lastIndexOf('.')) : ''
  return `${local.slice(0, 1)}•••••@•••••${extension}`
}

/**
 * Un profil est « incomplet » quand une information facultative manque : pseudo, téléphone ou photo (décision utilisateur). Lu
 * uniquement sur l'`IMe`. Un compte sans fiche de joueur (un administrateur) n'a rien à compléter : la liste est vide.
 */
export const missingProfileFields = (me: IMe): PROFILE_FIELD[] => {
  const competitor = me.competitor
  if (!competitor) {
    return []
  }
  const missing: PROFILE_FIELD[] = []
  if (!competitor.nickname?.trim()) {
    missing.push(PROFILE_FIELD.NICKNAME)
  }
  if (!competitor.phone?.trim()) {
    missing.push(PROFILE_FIELD.PHONE)
  }
  if (!competitor.avatarUrl) {
    missing.push(PROFILE_FIELD.AVATAR)
  }
  return missing
}

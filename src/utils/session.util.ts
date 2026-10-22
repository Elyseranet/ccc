import type { IMe } from '../interfaces/me.interface.js'
import type { ISessionIdentity } from '../interfaces/session.interface.js'

/** Initiales affichées dans la coque admin : deux premiers mots du nom de compétiteur, sinon première lettre de l'email. */
export const toInitials = (me: IMe): string => {
  const words = (me.competitor?.displayName ?? '').trim().split(/\s+/).filter(Boolean)
  const letters = words.length > 0 ? words.slice(0, 2).map((word) => word[0]!) : [me.email[0] ?? '']
  return letters.join('').toUpperCase()
}

/** `GET /moi` -> session du store d'authentification. */
export const toSessionIdentity = (me: IMe): ISessionIdentity => ({ role: me.role, initials: toInitials(me) })

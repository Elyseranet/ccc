import type { USER_ROLE } from '../enums/user.enum.js'

/** Session du store d'authentification, dérivée de `GET /moi` (IMe) par `toSessionIdentity`. */
export interface ISessionIdentity {
  role: USER_ROLE | null
  initials: string | null
}

// TEMPORAIRE : à remplacer par IMe (B-08). Ne pas réutiliser ailleurs que dans MeService et le store d'authentification.
import type { USER_ROLE } from '#shared/enums/user.enum'

export interface ISessionIdentity {
  role: USER_ROLE | null
  initials: string | null
}

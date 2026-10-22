import { defineStore } from 'pinia'
import { USER_ROLE } from '~/enums/user.enum'
import type { ISessionIdentity } from '~/interfaces/session.interface'

/*********************************************************
 * Auth store
 *
 * @description
 * Session côté client : le rôle (`USER_ROLE`, enum partagé) et les initiales affichées dans la coque admin.
 * Il est alimenté par `GET /moi` via le composable `useMe` (ticket B-08 / F-10).
 * L'accès admin est contrôlé par le middleware `admin`.
 ********************************************************/
export const useAuthStore = defineStore('auth', {
  state: () => ({
    role: null as USER_ROLE | null,
    initials: null as string | null
  }),
  getters: {
    isAuthenticated: (state): boolean => state.role !== null,
    isAdmin: (state): boolean => state.role === USER_ROLE.ADMIN
  },
  actions: {
    setRole (role: USER_ROLE | null) {
      this.role = role
    },
    setSession (session: ISessionIdentity) {
      this.role = session.role
      this.initials = session.initials
    },
    clear () {
      this.role = null
      this.initials = null
    }
  }
})

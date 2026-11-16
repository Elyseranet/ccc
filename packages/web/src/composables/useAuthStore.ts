import { defineStore } from 'pinia'
import { USER_ROLE } from '~/enums/user.enum'
import type { IMe } from '~/interfaces/me.interface'
import { toInitials } from '~/utils/session.util'

/*********************************************************
 * Auth store
 *
 * @description
 * Le compte connecté, tel que `GET /moi` le renvoie (`IMe`, B-08) : c'est la seule source de l'état connecté, le cookie de
 * session étant httpOnly. `me` est `null` sans session. Le rôle et les initiales de la coque admin en sont dérivés.
 * L'accès admin est contrôlé par le middleware `admin`.
 ********************************************************/
export const useAuthStore = defineStore('auth', {
  state: () => ({
    me: null as IMe | null
  }),
  getters: {
    role: (state): USER_ROLE | null => state.me?.role ?? null,
    initials: (state): string | null => state.me ? toInitials(state.me) : null,
    isAuthenticated: (state): boolean => state.me !== null,
    isAdmin: (state): boolean => state.me?.role === USER_ROLE.ADMIN
  },
  actions: {
    setMe (me: IMe | null) {
      this.me = me
    },
    clear () {
      this.me = null
    }
  }
})

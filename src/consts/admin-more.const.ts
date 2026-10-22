import IconAccount from '~/components/icons/IconAccount.vue'
import IconExternal from '~/components/icons/IconExternal.vue'
import IconParticipants from '~/components/icons/IconParticipants.vue'
import { ROUTES } from './routes.const.js'
import type { IAdminMoreItem } from '../interfaces/admin-more.interface.js'

export const ADMIN_MORE_ITEMS: IAdminMoreItem[] = [
  {
    key: 'admin.more.participants',
    label: 'Participants',
    description: { key: 'admin.more.participants_description', label: 'Inscrire, inviter, renvoyer une invitation' },
    to: ROUTES.ADMIN_PARTICIPANTS,
    icon: IconParticipants
  },
  {
    key: 'admin.more.public_site',
    label: 'Voir le site public',
    description: { key: 'admin.more.public_site_description', label: 'Ce que voient les visiteurs' },
    to: ROUTES.HOME,
    icon: IconExternal
  },
  {
    key: 'admin.more.account',
    label: 'Mon compte',
    description: { key: 'admin.more.account_description', label: 'Mot de passe' },
    to: ROUTES.PROFILE,
    icon: IconAccount
  }
]

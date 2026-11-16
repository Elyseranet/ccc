import IconAccount from '~/components/icons/IconAccount.vue'
import IconCompetitors from '~/components/icons/IconCompetitors.vue'
import IconEditions from '~/components/icons/IconEditions.vue'
import IconExternal from '~/components/icons/IconExternal.vue'
import IconFinalPhase from '~/components/icons/IconFinalPhase.vue'
import IconParticipants from '~/components/icons/IconParticipants.vue'
import { ROUTES } from './routes.const.js'
import type { IAdminMoreItem } from '../interfaces/admin-more.interface.js'

export const ADMIN_MORE_ITEMS: IAdminMoreItem[] = [
  {
    key: 'admin.more.editions',
    label: 'Éditions',
    description: { key: 'admin.more.editions_description', label: 'Créer une édition, modifier ses informations' },
    to: ROUTES.ADMIN_EDITIONS,
    icon: IconEditions
  },
  {
    key: 'admin.more.competitors',
    label: 'Compétiteurs',
    description: { key: 'admin.more.competitors_description', label: 'Corriger une identité, gérer la photo' },
    to: ROUTES.ADMIN_COMPETITORS,
    icon: IconCompetitors
  },
  {
    key: 'admin.more.final_phase',
    label: 'Phase finale',
    description: { key: 'admin.more.final_phase_description', label: 'Qualification, tirage des tours, clôture' },
    to: ROUTES.ADMIN_FINAL_PHASE,
    icon: IconFinalPhase
  },
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

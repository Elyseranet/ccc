import IconDashboard from '~/components/icons/IconDashboard.vue'
import IconCompetitors from '~/components/icons/IconCompetitors.vue'
import IconFinalPhase from '~/components/icons/IconFinalPhase.vue'
import IconEditions from '~/components/icons/IconEditions.vue'
import IconDraws from '~/components/icons/IconDraws.vue'
import IconMatches from '~/components/icons/IconMatches.vue'
import IconMore from '~/components/icons/IconMore.vue'
import IconParticipants from '~/components/icons/IconParticipants.vue'
import { ROUTES } from './routes.const.js'
import type { INavigationGroup, INavigationItem } from '../interfaces/navigation.interface.js'
import { filterDeliveredGroups, filterDeliveredItems } from '../utils/page-delivery.util.js'

export const ADMIN_NAVIGATION: INavigationGroup[] = filterDeliveredGroups([
  {
    key: 'layout.admin.group_organisation',
    label: 'Organisation',
    items: [
      { key: 'layout.admin.nav_dashboard', label: 'Tableau de bord', to: ROUTES.ADMIN, icon: IconDashboard, exact: true },
      { key: 'layout.admin.nav_participants', label: 'Participants', to: ROUTES.ADMIN_PARTICIPANTS, icon: IconParticipants },
      { key: 'layout.admin.nav_draws', label: 'Tirages', to: ROUTES.ADMIN_DRAWS, icon: IconDraws },
      { key: 'layout.admin.nav_matches', label: 'Poules et matchs', to: ROUTES.ADMIN_MATCHES, icon: IconMatches },
      { key: 'layout.admin.nav_final_phase', label: 'Phase finale', to: ROUTES.ADMIN_FINAL_PHASE, icon: IconFinalPhase }
    ]
  },
  {
    key: 'layout.admin.group_reference',
    label: 'Référentiel',
    items: [
      { key: 'layout.admin.nav_editions', label: 'Éditions', to: ROUTES.ADMIN_EDITIONS, icon: IconEditions },
      { key: 'layout.admin.nav_competitors', label: 'Compétiteurs', to: ROUTES.ADMIN_COMPETITORS, icon: IconCompetitors }
    ]
  }
])

export const ADMIN_BOTTOM_NAVIGATION: INavigationItem[] = filterDeliveredItems([
  { key: 'layout.admin.bottom_dashboard', label: 'Tableau', to: ROUTES.ADMIN, icon: IconDashboard, exact: true },
  { key: 'layout.admin.bottom_matches', label: 'Matchs', to: ROUTES.ADMIN_MATCHES, icon: IconMatches },
  { key: 'layout.admin.bottom_draws', label: 'Tirages', to: ROUTES.ADMIN_DRAWS, icon: IconDraws },
  { key: 'layout.admin.bottom_more', label: 'Plus', to: ROUTES.ADMIN_MORE, icon: IconMore }
])

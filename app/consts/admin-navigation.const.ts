import IconDashboard from '~/components/icons/IconDashboard.vue'
import IconDraws from '~/components/icons/IconDraws.vue'
import IconMatches from '~/components/icons/IconMatches.vue'
import IconMore from '~/components/icons/IconMore.vue'
import IconParticipants from '~/components/icons/IconParticipants.vue'
import { ROUTES } from '~/consts/routes.const'
import type { INavigationGroup, INavigationItem } from '~/interfaces/navigation.interface'
import { filterDeliveredGroups, filterDeliveredItems } from '~/utils/page-delivery.util'

export const ADMIN_NAVIGATION: INavigationGroup[] = filterDeliveredGroups([
  {
    key: 'layout.admin.group_organisation',
    label: 'Organisation',
    items: [
      { key: 'layout.admin.nav_dashboard', label: 'Tableau de bord', to: ROUTES.ADMIN, icon: IconDashboard, exact: true },
      { key: 'layout.admin.nav_participants', label: 'Participants', to: ROUTES.ADMIN_PARTICIPANTS, icon: IconParticipants },
      { key: 'layout.admin.nav_draws', label: 'Tirages', to: ROUTES.ADMIN_DRAWS, icon: IconDraws },
      { key: 'layout.admin.nav_matches', label: 'Poules et matchs', to: ROUTES.ADMIN_MATCHES, icon: IconMatches }
    ]
  }
])

export const ADMIN_BOTTOM_NAVIGATION: INavigationItem[] = filterDeliveredItems([
  { key: 'layout.admin.bottom_dashboard', label: 'Tableau', to: ROUTES.ADMIN, icon: IconDashboard, exact: true },
  { key: 'layout.admin.bottom_matches', label: 'Matchs', to: ROUTES.ADMIN_MATCHES, icon: IconMatches },
  { key: 'layout.admin.bottom_draws', label: 'Tirages', to: ROUTES.ADMIN_DRAWS, icon: IconDraws },
  { key: 'layout.admin.bottom_more', label: 'Plus', to: ROUTES.ADMIN_MORE, icon: IconMore }
])

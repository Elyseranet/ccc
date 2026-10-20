import type { INavigationItem } from '~/interfaces/navigation.interface'

export const ADMIN_NAVIGATION: INavigationItem[] = [
  { key: 'admin_dashboard', label: 'Tableau de bord', to: '/admin' },
  { key: 'admin_competitors', label: 'Compétiteurs', to: '/admin/competitors' },
  { key: 'admin_participants', label: 'Participants', to: '/admin/participants' },
  { key: 'admin_draws', label: 'Tirage des poules', to: '/admin/draws' },
  { key: 'admin_groups', label: 'Poules & matchs', to: '/admin/groups' },
  { key: 'admin_bracket', label: 'Bracket', to: '/admin/bracket' },
  { key: 'admin_scores', label: 'Scores', to: '/admin/scores' },
  { key: 'admin_editions', label: 'Éditions', to: '/admin/editions' }
]

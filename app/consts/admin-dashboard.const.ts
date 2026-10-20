import type { INavigationItem } from '~/interfaces/navigation.interface'

export const ADMIN_STATS = [
  { key: 'archive_editions', label: 'ÉDITIONS', value: '16', captionKey: 'archive_source', caption: 'D’après les spécifications' },
  { key: 'archive_competitors', label: 'COMPÉTITEURS', value: '145', captionKey: 'profiles_to_reconcile', caption: 'Profils à rapprocher' },
  { key: 'archive_matches', label: 'MATCHS', value: '1 414', captionKey: 'historical_matches', caption: 'Référencés dans les archives' }
]

export const ADMIN_WORKFLOW = [
  { key: 'workflow_edition', label: 'Éditions', descriptionKey: 'workflow_edition_description', description: 'Créer une édition et choisir ses paramètres.' },
  { key: 'workflow_participants', label: 'Participants', descriptionKey: 'workflow_participants_description', description: 'Associer les compétiteurs à l’édition.' },
  { key: 'workflow_draw', label: 'Tirage', descriptionKey: 'workflow_draw_description', description: 'Placer les têtes de série et enregistrer les poules.' },
  { key: 'workflow_group_matches', label: 'Poules & matchs', descriptionKey: 'workflow_groups_description', description: 'Saisir et valider les résultats.' },
  { key: 'workflow_bracket', label: 'Bracket', descriptionKey: 'workflow_bracket_description', description: 'Tirer les tours et terminer le championnat.' }
]

export const ADMIN_QUICK_LINKS: INavigationItem[] = [
  { key: 'admin_participants', label: 'Participants', to: '/admin/participants' },
  { key: 'admin_draws', label: 'Tirage des poules', to: '/admin/draws' },
  { key: 'admin_groups', label: 'Poules & matchs', to: '/admin/groups' },
  { key: 'admin_bracket', label: 'Bracket', to: '/admin/bracket' }
]

/** Ce que le retrait fait d'un compte (B-31, `DELETE /admin/administrateurs/{id}`) : le texte de confirmation en dépend. */
export enum ADMIN_REVOKE_CASE {
  ACTIVE_WITH_COMPETITOR = 'ACTIVE_WITH_COMPETITOR',
  ACTIVE_WITHOUT_COMPETITOR = 'ACTIVE_WITHOUT_COMPETITOR',
  INVITED_WITH_COMPETITOR = 'INVITED_WITH_COMPETITOR',
  INVITED_WITHOUT_COMPETITOR = 'INVITED_WITHOUT_COMPETITOR'
}

/** Colonnes de la table des administrateurs : la clé est celle du champ de la ligne. */
export enum ADMINISTRATOR_COLUMN {
  EMAIL = 'email',
  STATE = 'state',
  ACTIONS = 'actions'
}

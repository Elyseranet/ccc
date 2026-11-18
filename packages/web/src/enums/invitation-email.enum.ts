/** Variante du mail d'invitation : le gabarit F-66 est partagé, seuls les textes (et la présence du lien) changent. */
export enum INVITATION_EMAIL_KIND {
  PARTICIPANT = 'PARTICIPANT',
  ADMIN = 'ADMIN',
  /** Joueur actif promu administrateur (B-31, Q5) : information seulement, sans lien de connexion. */
  ADMIN_PROMOTED = 'ADMIN_PROMOTED'
}

/**
 * Contrôle d'adresse email, côté formulaire (retour immédiat) et côté serveur (garde de configuration, `NUXT_MAIL_FROM`).
 * Dans un fichier autonome, sans import : la garde est compilée par la CLI TypeORM et vérifiée dans le projet serveur, qui
 * ne doivent pas tirer les types navigateur de `account.const.ts`.
 */
export const ACCOUNT_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

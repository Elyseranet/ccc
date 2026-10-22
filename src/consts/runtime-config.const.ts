/**
 * Valeurs par défaut du développement local (Mailpit) et garde-fou de configuration de production (PROD-1).
 * Fichier autonome, sans import : `nuxt.config.ts`, le plugin Nitro et `user:create-admin` (compilé par la CLI TypeORM) le partagent.
 */
export const DEFAULT_SITE_URL = 'http://localhost:3000'
export const DEFAULT_MAIL_TRANSPORT = 'smtp'
export const DEFAULT_MAIL_HOST = 'localhost'
export const DEFAULT_MAIL_FROM = 'CCC <no-reply@ccc.local>'

/** Hôtes qui désignent la machine locale : jamais acceptés en mode strict. */
export const LOCAL_HOSTNAMES = ['localhost', '127.0.0.1'] as const

/**
 * `NUXT_STRICT_RUNTIME_CONFIG` : seules ces valeurs désactivent le mode strict. Toute autre valeur l'active
 * (échec fermé : une faute de frappe ne coupe jamais le garde-fou).
 */
export const STRICT_RUNTIME_CONFIG_OFF_VALUES = ['', 'false', '0'] as const

/** Noms des variables d'environnement citées dans les messages d'erreur (jamais leurs valeurs). */
export const STRICT_CONFIG_VARIABLE = {
  SITE_URL: 'NUXT_PUBLIC_SITE_URL',
  MAIL_TRANSPORT: 'NUXT_MAIL_TRANSPORT',
  MAIL_HOST: 'NUXT_MAIL_HOST',
  MAIL_FROM: 'NUXT_MAIL_FROM'
} as const

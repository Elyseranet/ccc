/**
 * Valeurs par défaut du développement local (Mailpit) et garde-fou de configuration de production (PROD-1).
 * Fichier autonome, sans import : `nuxt.config.ts`, le plugin Nitro et `user:create-admin` (compilé par la CLI TypeORM) le partagent.
 */
export const DEFAULT_SITE_URL = 'http://localhost:3000'
export const DEFAULT_MAIL_TRANSPORT = 'smtp'
export const DEFAULT_MAIL_HOST = 'localhost'
export const DEFAULT_MAIL_FROM = 'CCC <no-reply@ccc.local>'
/** `NUXT_PUBLIC_SITE_INDEXABLE` (T-SEO-01) : faux par défaut, une instance non configurée (la dev) n'est jamais indexable. */
export const DEFAULT_SITE_INDEXABLE = false

/** Hôtes qui désignent la machine locale : jamais acceptés en mode strict (`URL.hostname` écrit l'IPv6 entre crochets). */
export const LOCAL_HOSTNAMES = ['localhost', '127.0.0.1', '::1', '[::1]', '0.0.0.0'] as const
/** Tout sous-domaine de `localhost` désigne aussi la machine locale. */
export const LOCAL_HOSTNAME_SUFFIX = '.localhost'
/** Domaine de l'expéditeur par défaut : un `from` qui en vient n'a jamais été configuré. */
export const DEFAULT_MAIL_FROM_DOMAIN = '@ccc.local'

/**
 * Marqueur posé par le Dockerfile (étage runner, propriété de root) : sa présence désigne l'image de production. Une
 * variable d'environnement ne peut pas le retirer, contrairement à `ENV NUXT_STRICT_RUNTIME_CONFIG=true` (T-SEC-06, Q1).
 * Le chemin est celui du `WORKDIR` de l'image.
 */
export const PRODUCTION_IMAGE_MARKER_PATH = '/app/.ccc-production-image'

/**
 * `NUXT_STRICT_RUNTIME_CONFIG` : seules ces valeurs désactivent le mode strict. Toute autre valeur l'active
 * (échec fermé : une faute de frappe ne coupe jamais le garde-fou).
 */
export const STRICT_RUNTIME_CONFIG_OFF_VALUES = ['', 'false', '0'] as const

/**
 * `NUXT_PUBLIC_SITE_INDEXABLE` : seules ces valeurs rendent le site indexable. Toute autre valeur le laisse non indexable
 * (échec fermé : `destr` change `"1"` en nombre, une faute de frappe n'ouvre jamais l'indexation).
 */
export const SITE_INDEXABLE_ON_VALUES = [true, 'true'] as const

/** Noms des variables d'environnement citées dans les messages d'erreur (jamais leurs valeurs). */
export const STRICT_CONFIG_VARIABLE = {
  SITE_URL: 'NUXT_PUBLIC_SITE_URL',
  MAIL_TRANSPORT: 'NUXT_MAIL_TRANSPORT',
  MAIL_HOST: 'NUXT_MAIL_HOST',
  MAIL_FROM: 'NUXT_MAIL_FROM',
  STRICT: 'NUXT_STRICT_RUNTIME_CONFIG',
  SECURE_COOKIE: 'NUXT_AUTH_SECURE_COOKIE',
  DEVICE_COOKIE_SECRET: 'NUXT_AUTH_DEVICE_COOKIE_SECRET'
} as const

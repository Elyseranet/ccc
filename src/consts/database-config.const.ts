/** Variable d'environnement attendue pour chaque champ de runtimeConfig.database. */
export const DATABASE_CONFIG_ENV_VARIABLES = {
  host: 'NUXT_DATABASE_HOST',
  username: 'NUXT_DATABASE_USERNAME',
  password: 'NUXT_DATABASE_PASSWORD',
  database: 'NUXT_DATABASE_DATABASE'
} as const

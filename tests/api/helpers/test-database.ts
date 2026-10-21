const REQUIRED_VARIABLES = [
  'NUXT_DATABASE_HOST',
  'NUXT_DATABASE_PORT',
  'NUXT_DATABASE_USERNAME',
  'NUXT_DATABASE_PASSWORD',
  'NUXT_DATABASE_DATABASE'
] as const

const TEST_DATABASE_SUFFIX = '_test'

export const TEST_DEVICE_COOKIE_SECRET = 'api-test-device-secret-api-test-device-secret'

/**
 * Variables d'environnement transmises au serveur de test. Refuse de tourner si le nom de la
 * base ne se termine pas par `_test` : les tests d'API ne doivent jamais toucher une base réelle.
 */
export const requireTestDatabaseEnv = (): Record<string, string> => {
  const env: Record<string, string> = {}
  for (const name of REQUIRED_VARIABLES) {
    const value = process.env[name]
    if (!value) {
      throw new Error(`Missing environment variable for API tests: ${name}`)
    }
    env[name] = value
  }
  if (!env.NUXT_DATABASE_DATABASE!.endsWith(TEST_DATABASE_SUFFIX)) {
    throw new Error(`NUXT_DATABASE_DATABASE must end with "${TEST_DATABASE_SUFFIX}" for API tests`)
  }
  // Le serveur de test est un build de production : il exige le secret du cookie d'appareil (SEC-A4).
  // Secret jetable de test, qui ne protège rien (base et serveur éphémères).
  env.NUXT_AUTH_DEVICE_COOKIE_SECRET = TEST_DEVICE_COOKIE_SECRET
  return env
}

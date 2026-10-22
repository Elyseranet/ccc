import { DATABASE_CONFIG_ENV_VARIABLES } from '../consts/database-config.const.js'
import { PRODUCTION_NODE_ENV } from '../consts/node-env.const.js'
import type { IDatabaseConfig } from '../interfaces/database-config.interface.js'

/**
 * En production, une configuration de base incomplète fait échouer le démarrage.
 * Le message nomme la variable manquante, jamais sa valeur.
 */
export const assertDatabaseConfig = (
  config: IDatabaseConfig,
  nodeEnv: string | undefined = process.env.NODE_ENV
): void => {
  if (nodeEnv !== PRODUCTION_NODE_ENV) {
    return
  }
  const missing = (Object.keys(DATABASE_CONFIG_ENV_VARIABLES) as (keyof typeof DATABASE_CONFIG_ENV_VARIABLES)[])
    .filter((field) => !config[field])
    .map((field) => DATABASE_CONFIG_ENV_VARIABLES[field])
  if (missing.length > 0) {
    throw new Error(`Missing required database configuration: ${missing.join(', ')}`)
  }
}

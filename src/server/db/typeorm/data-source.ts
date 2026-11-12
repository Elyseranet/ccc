import 'dotenv/config'
import 'reflect-metadata'
import { fileURLToPath } from 'node:url'
import { DataSource } from 'typeorm'
import { LOG_EVENT } from '../../../consts/log-event.const.js'
import { resolveDatabaseTimeouts } from '../../../utils/database-timeouts.util.js'
import { logger } from '../../../utils/logger.util.js'
import { buildDataSourceOptions } from './data-source-options.js'

const requireEnvironmentVariable = (name: string): string => {
  const value = process.env[name]

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }

  return value
}

const migrationsDirectory = fileURLToPath(new URL('../migrations/*{.ts,.js}', import.meta.url))

// T-SEC-17 : la CLI (migrations, seed, scripts) ne borne que la connexion (10 s), pour qu'une migration longue ne soit
// pas coupée. Un `statement_timeout` ou un `query_timeout` de CLI reste possible, mais seulement par variable explicite.
const { timeouts, invalidVariables } = resolveDatabaseTimeouts({
  connectionTimeoutMs: process.env.NUXT_DATABASE_CLI_CONNECTION_TIMEOUT_MS,
  statementTimeoutMs: process.env.NUXT_DATABASE_CLI_STATEMENT_TIMEOUT_MS,
  queryTimeoutMs: process.env.NUXT_DATABASE_CLI_QUERY_TIMEOUT_MS
}, 'cli')
if (invalidVariables.length > 0) {
  logger.warn(LOG_EVENT.DATABASE_TIMEOUT_CONFIG_INVALID, { variables: invalidVariables })
}

export default new DataSource(buildDataSourceOptions({
  host: requireEnvironmentVariable('NUXT_DATABASE_HOST'),
  port: Number(process.env.NUXT_DATABASE_PORT ?? 5432),
  username: requireEnvironmentVariable('NUXT_DATABASE_USERNAME'),
  password: requireEnvironmentVariable('NUXT_DATABASE_PASSWORD'),
  database: requireEnvironmentVariable('NUXT_DATABASE_DATABASE'),
  timeouts
}, [migrationsDirectory]))

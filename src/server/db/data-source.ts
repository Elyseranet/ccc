import 'dotenv/config'
import 'reflect-metadata'
import { fileURLToPath } from 'node:url'
import { DataSource } from 'typeorm'
import { buildDataSourceOptions } from './data-source-options'

const requireEnvironmentVariable = (name: string): string => {
  const value = process.env[name]

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }

  return value
}

const migrationsDirectory = fileURLToPath(new URL('./migrations/*{.ts,.js}', import.meta.url))

export default new DataSource(buildDataSourceOptions({
  host: requireEnvironmentVariable('NUXT_DATABASE_HOST'),
  port: Number(process.env.NUXT_DATABASE_PORT ?? 5432),
  username: requireEnvironmentVariable('NUXT_DATABASE_USERNAME'),
  password: requireEnvironmentVariable('NUXT_DATABASE_PASSWORD'),
  database: requireEnvironmentVariable('NUXT_DATABASE_DATABASE')
}, [migrationsDirectory]))

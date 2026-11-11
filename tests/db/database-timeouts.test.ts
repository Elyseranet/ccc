import 'reflect-metadata'
import { createServer } from 'node:net'
import type { Server, Socket } from 'node:net'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { DataSource } from 'typeorm'
import type { IDatabaseTimeouts } from '../../src/interfaces/database-config.interface'
import { buildDataSourceOptions } from '../../src/server/db/typeorm/data-source-options'
import { isDatabaseTimeout } from '../../src/utils/database-timeouts.util'
import { cleanup, resetSchema } from './helpers/test-database'

/*********************************************************
 * Délais de la base (T-SEC-17)
 *
 * @description
 * Sur une vraie base : `statement_timeout` annule l'instruction côté PostgreSQL (57014), `query_timeout` est le filet côté
 * client, `connectionTimeoutMillis` borne une connexion qui ne répond jamais. Une attente de verrou compte dans
 * `statement_timeout` ; une attente légitime plus courte que le délai aboutit.
 ********************************************************/
const connection = () => ({
  host: process.env.NUXT_DATABASE_HOST!,
  port: Number(process.env.NUXT_DATABASE_PORT ?? 5432),
  username: process.env.NUXT_DATABASE_USERNAME!,
  password: process.env.NUXT_DATABASE_PASSWORD!,
  database: process.env.NUXT_DATABASE_DATABASE!
})

const RUNTIME_LIKE: IDatabaseTimeouts = { connectionTimeoutMs: 3000, statementTimeoutMs: 300, queryTimeoutMs: 0 }
const opened: DataSource[] = []

const open = async (timeouts: IDatabaseTimeouts, override: Partial<ReturnType<typeof connection>> = {}): Promise<DataSource> => {
  const dataSource = new DataSource(buildDataSourceOptions({ ...connection(), ...override, timeouts }))
  opened.push(dataSource)
  await dataSource.initialize()
  return dataSource
}

const timed = async <T>(work: Promise<T>): Promise<{ error: unknown, value?: T, elapsedMs: number }> => {
  const startedAt = Date.now()
  try {
    const value = await work
    return { error: undefined, value, elapsedMs: Date.now() - startedAt }
  } catch (error) {
    return { error, elapsedMs: Date.now() - startedAt }
  }
}

let blackHole: Server
const blackHoleSockets = new Set<Socket>()
let blackHolePort: number
let schemaSource: DataSource

beforeAll(async () => {
  schemaSource = await resetSchema()
  await schemaSource.query('CREATE TABLE "t_sec17_lock" ("id" integer PRIMARY KEY)')
  await schemaSource.query('INSERT INTO "t_sec17_lock" VALUES (1)')
  // Accepte la connexion TCP et ne répond jamais : le démarrage du protocole PostgreSQL reste en suspens.
  blackHole = createServer((socket) => { blackHoleSockets.add(socket) })
  await new Promise<void>((resolve) => blackHole.listen(0, '127.0.0.1', resolve))
  blackHolePort = (blackHole.address() as { port: number }).port
})

afterAll(async () => {
  await Promise.all(opened.filter((dataSource) => dataSource.isInitialized).map((dataSource) => dataSource.destroy()))
  // close() attend la fin des connexions ouvertes : le pilote abandonne la sienne au délai sans forcément la fermer.
  blackHoleSockets.forEach((socket) => socket.destroy())
  await new Promise<void>((resolve) => blackHole.close(() => resolve()))
  await schemaSource.query('DROP TABLE IF EXISTS "t_sec17_lock"')
  await cleanup()
})

describe('statement_timeout', () => {
  it('cancels a slow statement on the server side (SQLSTATE 57014), within the delay', async () => {
    const dataSource = await open(RUNTIME_LIKE)
    const { error, elapsedMs } = await timed(dataSource.query('SELECT pg_sleep(5)'))
    expect(isDatabaseTimeout(error)).toBe(true)
    expect(JSON.stringify((error as { driverError?: { code?: string } }).driverError?.code)).toBe('"57014"')
    expect(elapsedMs).toBeLessThan(2500)
  })

  it('lets a fast statement through with the same delay', async () => {
    const dataSource = await open(RUNTIME_LIKE)
    expect(await dataSource.query('SELECT 1 AS ok')).toEqual([{ ok: 1 }])
  })
})

describe('query_timeout (client-side net)', () => {
  it('rejects a query the server has not answered in time with the pg read timeout', async () => {
    const dataSource = await open({ connectionTimeoutMs: 3000, statementTimeoutMs: 0, queryTimeoutMs: 300 })
    const { error, elapsedMs } = await timed(dataSource.query('SELECT pg_sleep(1.5)'))
    expect(isDatabaseTimeout(error)).toBe(true)
    expect(elapsedMs).toBeLessThan(1400)
  })
})

describe('lock waits count in statement_timeout, and a short legitimate wait succeeds', () => {
  // Renvoie un objet, pas la promesse nue : une fonction async qui renvoie une promesse l'aplatit, et l'appelant attendrait
  // alors la libération du verrou avant de lancer sa requête.
  const holdLock = async (holdMs: number): Promise<{ released: Promise<void> }> => {
    const holder = await open({ connectionTimeoutMs: 3000, statementTimeoutMs: 0, queryTimeoutMs: 0 })
    const runner = holder.createQueryRunner()
    await runner.connect()
    await runner.startTransaction()
    await runner.query('SELECT * FROM "t_sec17_lock" WHERE "id" = 1 FOR UPDATE')
    const released = new Promise<void>((resolve) => setTimeout(() => {
      void runner.commitTransaction().then(() => runner.release()).then(() => resolve())
    }, holdMs))
    return { released }
  }

  it('turns a lock wait longer than the delay into a database timeout', async () => {
    const { released } = await holdLock(1200)
    const waiter = await open(RUNTIME_LIKE)
    const { error, elapsedMs } = await timed(waiter.query('SELECT * FROM "t_sec17_lock" WHERE "id" = 1 FOR UPDATE'))
    expect(isDatabaseTimeout(error)).toBe(true)
    expect(elapsedMs).toBeLessThan(1000)
    await released
  })

  it('lets a lock wait shorter than the delay finish, like two simultaneous draw validations', async () => {
    const { released } = await holdLock(150)
    const waiter = await open({ connectionTimeoutMs: 3000, statementTimeoutMs: 3000, queryTimeoutMs: 3500 })
    const { error, value } = await timed(waiter.query('SELECT * FROM "t_sec17_lock" WHERE "id" = 1 FOR UPDATE'))
    expect(error).toBeUndefined()
    expect(value).toHaveLength(1)
    await released
  })
})

describe('connectionTimeoutMillis', () => {
  it('bounds a connection that never answers', async () => {
    const dataSource = new DataSource(buildDataSourceOptions({
      ...connection(), host: '127.0.0.1', port: blackHolePort, timeouts: { connectionTimeoutMs: 500, statementTimeoutMs: 0, queryTimeoutMs: 0 }
    }))
    const { error, elapsedMs } = await timed(dataSource.initialize())
    expect(isDatabaseTimeout(error)).toBe(true)
    expect(elapsedMs).toBeLessThan(2500)
  })
})

describe('CLI-style delays (migrations and seed are not cut)', () => {
  it('lets a statement run past what the runtime delay would allow when only the connection is bounded', async () => {
    const dataSource = await open({ connectionTimeoutMs: 10000, statementTimeoutMs: 0, queryTimeoutMs: 0 })
    const { error } = await timed(dataSource.query('SELECT pg_sleep(0.8)'))
    expect(error).toBeUndefined()
  })
})

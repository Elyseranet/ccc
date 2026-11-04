import type { DataSource } from 'typeorm'
import {
  HEALTH_VERSION_PATTERN,
  MIGRATION_FILE_PATTERN,
  MIGRATIONS_TABLE_QUERY,
  PG_UNDEFINED_TABLE
} from '../consts/health.const.js'
import type { IHealthMigrations } from '../interfaces/health.interface.js'

/** La version vient de l'environnement : on ne la renvoie que si elle a la forme d'un SHA, d'un tag ou d'un numéro. */
export const normalizeAppVersion = (raw: unknown): string | null => {
  const value = typeof raw === 'string' ? raw.trim() : ''
  return HEALTH_VERSION_PATTERN.test(value) ? value : null
}

/** Horodatages des migrations livrées, d'après les noms de fichiers (`1793180000000-Nom.ts`). Les autres fichiers sont ignorés. */
export const parseMigrationTimestamps = (fileNames: readonly string[]): number[] =>
  fileNames.flatMap((name) => {
    const match = MIGRATION_FILE_PATTERN.exec(name.split(/[/:]/).pop() ?? '')
    return match ? [Number(match[1])] : []
  })

/** Migrations livrées qui ne figurent pas encore dans la table de suivi. */
export const countPendingMigrations = (shipped: readonly number[], executed: readonly number[]): number => {
  const done = new Set(executed)
  return shipped.filter((timestamp) => !done.has(timestamp)).length
}

export const toHealthMigrations = (pendingCount: number): IHealthMigrations => ({ upToDate: pendingCount === 0, pendingCount })

/**
 * État des migrations, en lecture seule (une requête sur la table de suivi, quelques lignes) : ni `showMigrations()` ni
 * `getPendingMigrations()`, qui créent la table de suivi si elle manque. Une base neuve sans table : tout est en attente.
 * `null` quand la liste des migrations livrées est vide, car « à jour » serait alors une affirmation sans preuve.
 */
export const loadMigrationsHealth = async (dataSource: DataSource, shipped: readonly number[]): Promise<IHealthMigrations | null> => {
  if (shipped.length === 0) {
    return null
  }
  let executed: number[]
  try {
    const rows = await dataSource.query(MIGRATIONS_TABLE_QUERY) as Array<{ timestamp: string | number }>
    executed = rows.map((row) => Number(row.timestamp))
  } catch (error) {
    if ((error as { code?: string } | null)?.code !== PG_UNDEFINED_TABLE) {
      throw error
    }
    executed = []
  }
  return toHealthMigrations(countPendingMigrations(shipped, executed))
}

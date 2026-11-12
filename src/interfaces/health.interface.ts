import type { HEALTH_STATUS } from '../enums/health-status.enum.js'

/** État des migrations. Ni nom, ni liste : seulement de quoi savoir si la base est à jour. */
export interface IHealthMigrations {
  upToDate: boolean
  pendingCount: number
}

/**
 * `GET /api/v1/health` (T-OPS-03). `version` : SHA du commit injecté au build de l'image, `null` s'il n'est pas fourni
 * (jamais une valeur inventée). `migrations` : `null` quand la base est injoignable ou quand la liste des migrations
 * livrées est inconnue. Aucun détail d'infrastructure.
 */
export interface IHealth {
  status: HEALTH_STATUS
  version: string | null
  migrations: IHealthMigrations | null
}

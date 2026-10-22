import type { DataSource, EntityManager } from 'typeorm'
import { ARCHIVES_SEED_GUARD_TABLES, ARCHIVES_SEED_NOT_EMPTY_MESSAGE } from '../consts/archives-seed.const.js'
import { MATCH_STATUS } from '../enums/match.enum.js'
import type { IArchivesSeedCounts } from '../interfaces/archives-seed.interface.js'

const count = async (manager: EntityManager, sql: string, parameters: unknown[] = []): Promise<number> =>
  Number((await manager.query(sql, parameters))[0].n)

/**
 * Applique le dump SQL figé des archives (ARCH-5) dans une seule transaction : tout ou rien.
 * Refuse une base qui contient déjà des éditions, des compétiteurs ou un import du classeur : le dump porte des
 * identifiants fixes et n'est pas fait pour fusionner avec des données existantes.
 */
export const applyArchivesSeed = (dataSource: DataSource, sql: string): Promise<IArchivesSeedCounts> =>
  dataSource.transaction(async (manager) => {
    for (const table of ARCHIVES_SEED_GUARD_TABLES) {
      if (await count(manager, `SELECT count(*)::int AS n FROM ${table}`) > 0) {
        throw new Error(ARCHIVES_SEED_NOT_EMPTY_MESSAGE)
      }
    }
    await manager.query(sql)
    return {
      editions: await count(manager, 'SELECT count(*)::int AS n FROM editions'),
      competitors: await count(manager, 'SELECT count(*)::int AS n FROM competitors'),
      matches: await count(manager, 'SELECT count(*)::int AS n FROM matches'),
      validatedMatches: await count(manager, 'SELECT count(*)::int AS n FROM matches WHERE status = $1', [MATCH_STATUS.VALIDATED])
    }
  })

import type { DataSource } from 'typeorm'
import { EDITION_STATUS } from '../../../src/enums/edition.enum'
import { MATCH_STATUS } from '../../../src/enums/match.enum'
import { PARTICIPATION_STATUS } from '../../../src/enums/participation.enum'
import { ROUND_KIND, ROUND_STATUS } from '../../../src/enums/round.enum'
import { E2E_IN_PROGRESS_EDITION_CODE, E2E_POOL_REWIND_DENOMINATOR, E2E_POOL_REWIND_NUMERATOR } from './e2e.const'

export interface IInProgressEditionState {
  code: string
  status: string
  rounds: Array<{ kind: string, status: string }>
  matches: { scheduled: number, validated: number, poolScheduled: number, poolValidated: number }
  scheduledMatchIds: string[]
}

/*********************************************************
 * Édition 2026 en phase de poules (QA-2, T-QA-03)
 *
 * @description
 * Appelé par `prepare-database.ts` juste après le dump d'archives. Uniquement des UPDATE, dans une transaction : aucune
 * ligne créée ni supprimée (ARCH-8). La sélection des matchs de poule est déterministe : pour chaque poule, les matchs
 * sont classés par numéro de séquence décroissant, et les `floor(n × numérateur / dénominateur)` premiers repassent à
 * « programmé » (constantes de `e2e.const.ts`). Les matchs des tours de phase finale repassent tous à « programmé ».
 ********************************************************/
export const rewindEditionToPoolsPhase = async (dataSource: DataSource): Promise<IInProgressEditionState> => {
  await dataSource.transaction(async (manager) => {
    const editions: Array<{ id: string }> = await manager.query('SELECT id FROM editions WHERE code = $1', [E2E_IN_PROGRESS_EDITION_CODE])
    if (editions.length !== 1) {
      throw new Error(`Édition ${E2E_IN_PROGRESS_EDITION_CODE} introuvable dans le dump d'archives`)
    }
    const editionId = editions[0]!.id
    await manager.query('UPDATE editions SET status = $2, closed_at = NULL WHERE id = $1', [editionId, EDITION_STATUS.POOLS_PLAYING])
    await manager.query(
      'UPDATE rounds SET status = CASE WHEN kind = $2 THEN $3::round_status ELSE $4::round_status END WHERE edition_id = $1',
      [editionId, ROUND_KIND.POOLS, ROUND_STATUS.PLAYING, ROUND_STATUS.PENDING]
    )
    const rewound: Array<{ id: string }> = await manager.query(
      `SELECT m.id FROM matches m JOIN rounds r ON r.id = m.round_id
       WHERE m.edition_id = $1 AND r.kind <> $2
       UNION
       SELECT id FROM (
         SELECT m.id,
                row_number() OVER (PARTITION BY m.pool_id ORDER BY m.sequence DESC) AS position,
                count(*) OVER (PARTITION BY m.pool_id) AS total
         FROM matches m JOIN rounds r ON r.id = m.round_id
         WHERE m.edition_id = $1 AND r.kind = $2
       ) ranked
       WHERE position <= floor(total * $3::numeric / $4::numeric)
       ORDER BY id`,
      [editionId, ROUND_KIND.POOLS, E2E_POOL_REWIND_NUMERATOR, E2E_POOL_REWIND_DENOMINATOR]
    )
    const ids = rewound.map(row => row.id)
    await manager.query(
      'UPDATE matches SET status = $2, recorded_at = NULL, validated_at = NULL, validated_by_user_id = NULL WHERE id = ANY($1::uuid[])',
      [ids, MATCH_STATUS.SCHEDULED]
    )
    await manager.query('UPDATE match_sides SET recorded_score = NULL, validated_score = NULL WHERE match_id = ANY($1::uuid[])', [ids])
    await manager.query(
      'UPDATE participations SET final_stage = NULL, points = NULL, pool_rank = NULL, status = $2 WHERE edition_id = $1',
      [editionId, PARTICIPATION_STATUS.IN_POOL]
    )
  })
  return readInProgressEditionState(dataSource)
}

/** État produit, lu en base : sert à la sortie JSON de `prepare-database` et aux tests. */
export const readInProgressEditionState = async (dataSource: DataSource): Promise<IInProgressEditionState> => {
  const [edition]: Array<{ id: string, status: string }> = await dataSource.query('SELECT id, status FROM editions WHERE code = $1', [E2E_IN_PROGRESS_EDITION_CODE])
  const rounds: Array<{ kind: string, status: string }> = await dataSource.query('SELECT kind, status FROM rounds WHERE edition_id = $1 ORDER BY sequence', [edition!.id])
  const matches: Array<{ id: string, status: string, kind: string }> = await dataSource.query(
    'SELECT m.id, m.status, r.kind FROM matches m JOIN rounds r ON r.id = m.round_id WHERE m.edition_id = $1 ORDER BY m.id', [edition!.id]
  )
  const scheduled = matches.filter(match => match.status === MATCH_STATUS.SCHEDULED)
  const validated = matches.filter(match => match.status === MATCH_STATUS.VALIDATED)
  const pools = matches.filter(match => match.kind === ROUND_KIND.POOLS)
  return {
    code: E2E_IN_PROGRESS_EDITION_CODE,
    status: edition!.status,
    rounds,
    matches: {
      scheduled: scheduled.length,
      validated: validated.length,
      poolScheduled: pools.filter(match => match.status === MATCH_STATUS.SCHEDULED).length,
      poolValidated: pools.filter(match => match.status === MATCH_STATUS.VALIDATED).length
    },
    scheduledMatchIds: scheduled.map(match => match.id)
  }
}

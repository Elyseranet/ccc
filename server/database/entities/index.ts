import { CompetitorAliasEntity } from './competitor-alias.entity.js'
import { CompetitorEntity } from './competitor.entity.js'
import { DrawAssignmentEntity } from './draw-assignment.entity.js'
import { DrawEntity } from './draw.entity.js'
import { EditionEntity } from './edition.entity.js'
import { LegacyWorkbookImportEntity } from './legacy-workbook-import.entity.js'
import { LegacyWorkbookRowEntity } from './legacy-workbook-row.entity.js'
import { MatchSideEntity } from './match-side.entity.js'
import { MatchEntity } from './match.entity.js'
import { ParticipationEntity } from './participation.entity.js'
import { PoolEntity } from './pool.entity.js'
import { RoundEntity } from './round.entity.js'

/**
 * Registre explicite des entités, partagé par la CLI TypeORM et le runtime Nitro
 * (le bundle Nitro ne résout pas les globs). Toute nouvelle entité s'ajoute ici.
 */
export const ENTITIES = [
  LegacyWorkbookImportEntity,
  LegacyWorkbookRowEntity,
  CompetitorEntity,
  CompetitorAliasEntity,
  EditionEntity,
  PoolEntity,
  RoundEntity,
  ParticipationEntity,
  MatchEntity,
  MatchSideEntity,
  DrawEntity,
  DrawAssignmentEntity
]

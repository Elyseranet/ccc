import { CompetitorAliasEntity } from './competitor-alias.entity'
import { CompetitorEntity } from './competitor.entity'
import { DrawAssignmentEntity } from './draw-assignment.entity'
import { DrawEntity } from './draw.entity'
import { EditionEntity } from './edition.entity'
import { LegacyWorkbookImportEntity } from './legacy-workbook-import.entity'
import { LegacyWorkbookRowEntity } from './legacy-workbook-row.entity'
import { LoginDeviceEntity } from './login-device.entity'
import { MatchSideEntity } from './match-side.entity'
import { MatchEntity } from './match.entity'
import { ParticipationEntity } from './participation.entity'
import { PoolEntity } from './pool.entity'
import { RoundEntity } from './round.entity'
import { SessionEntity } from './session.entity'
import { UserEntity } from './user.entity'

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
  DrawAssignmentEntity,
  UserEntity,
  SessionEntity,
  LoginDeviceEntity
]

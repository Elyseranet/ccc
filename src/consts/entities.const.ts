import { CompetitorAliasEntity } from '../server/db/typeorm/entities/competitor-alias.entity.js'
import { CompetitorEntity } from '../server/db/typeorm/entities/competitor.entity.js'
import { DrawAssignmentEntity } from '../server/db/typeorm/entities/draw-assignment.entity.js'
import { DrawEntity } from '../server/db/typeorm/entities/draw.entity.js'
import { EditionEntity } from '../server/db/typeorm/entities/edition.entity.js'
import { InvitationEntity } from '../server/db/typeorm/entities/invitation.entity.js'
import { LegacyWorkbookImportEntity } from '../server/db/typeorm/entities/legacy-workbook-import.entity.js'
import { LegacyWorkbookRowEntity } from '../server/db/typeorm/entities/legacy-workbook-row.entity.js'
import { LoginDeviceEntity } from '../server/db/typeorm/entities/login-device.entity.js'
import { MatchSideEntity } from '../server/db/typeorm/entities/match-side.entity.js'
import { MatchEntity } from '../server/db/typeorm/entities/match.entity.js'
import { ParticipationEntity } from '../server/db/typeorm/entities/participation.entity.js'
import { PoolEntity } from '../server/db/typeorm/entities/pool.entity.js'
import { RoundEntity } from '../server/db/typeorm/entities/round.entity.js'
import { SessionEntity } from '../server/db/typeorm/entities/session.entity.js'
import { UserEntity } from '../server/db/typeorm/entities/user.entity.js'

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
  LoginDeviceEntity,
  InvitationEntity
]

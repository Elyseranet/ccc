import { Column, Entity, Index, JoinColumn, ManyToOne, type Relation, Unique } from 'typeorm'
import { FINAL_STAGE, PARTICIPATION_STATUS } from '../../../../enums/participation.enum.js'
import { nullableNumericTransformer } from '../numeric.transformer.js'
import { CompetitorEntity } from './competitor.entity.js'
import { EditionEntity } from './edition.entity.js'
import { PoolEntity } from './pool.entity.js'
import { UuidPrimaryEntity } from './uuid-primary.entity.js'

/** Invariant 1 : un compétiteur n'apparaît qu'une fois par édition. Le `pool_id` doit appartenir à la même édition (contrôlé par le service). */
@Entity({ name: 'participations' })
@Unique('uq_participations_edition_competitor', ['editionId', 'competitorId'])
export class ParticipationEntity extends UuidPrimaryEntity {
  @Column({ type: 'uuid' })
  editionId!: string

  @Index('idx_participations_competitor_id')
  @Column({ type: 'uuid' })
  competitorId!: string

  @Index('idx_participations_pool_id')
  @Column({ type: 'uuid', nullable: true })
  poolId!: string | null

  @Column({ type: 'boolean', default: false })
  isSeed!: boolean

  @Column({ type: 'integer', nullable: true })
  seedRank!: number | null

  @Column({ type: 'enum', enum: PARTICIPATION_STATUS, enumName: 'participation_status', default: PARTICIPATION_STATUS.REGISTERED })
  status!: PARTICIPATION_STATUS

  @Column({ type: 'enum', enum: FINAL_STAGE, enumName: 'final_stage', nullable: true })
  finalStage!: FINAL_STAGE | null

  /** Points figés à la clôture. numeric(7,2) est exact : base x N / 50 tombe toujours sur deux décimales (RG2). */
  @Column({ type: 'numeric', precision: 7, scale: 2, nullable: true, transformer: nullableNumericTransformer })
  points!: number | null

  @Column({ type: 'integer', nullable: true })
  poolRank!: number | null

  @ManyToOne(() => EditionEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'edition_id', foreignKeyConstraintName: 'fk_participations_edition' })
  edition!: Relation<EditionEntity>

  @ManyToOne(() => CompetitorEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'competitor_id', foreignKeyConstraintName: 'fk_participations_competitor' })
  competitor!: Relation<CompetitorEntity>

  @ManyToOne(() => PoolEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'pool_id', foreignKeyConstraintName: 'fk_participations_pool' })
  pool!: Relation<PoolEntity> | null
}

import { Check, Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, type Relation, Unique } from 'typeorm'
import { DrawEntity } from './draw.entity.js'
import { ParticipationEntity } from './participation.entity.js'
import { PoolEntity } from './pool.entity.js'
import { UuidPrimaryEntity } from './uuid-primary.entity.js'

/** `drawn_order` conserve l'ordre du tirage « poule après poule » (RG11). */
@Entity({ name: 'draw_assignments' })
@Unique('uq_draw_assignments_draw_participation', ['drawId', 'participationId'])
@Check('ck_draw_assignments_pool_number', '"pool_number" IS NULL OR "pool_number" >= 1')
export class DrawAssignmentEntity extends UuidPrimaryEntity {
  @Column({ type: 'uuid' })
  drawId!: string

  @Index('idx_draw_assignments_participation_id')
  @Column({ type: 'uuid' })
  participationId!: string

  @Column({ type: 'uuid', nullable: true })
  poolId!: string | null

  /**
   * Poule de destination (1-based) d'un tirage de poules, connue dès le brouillon alors que `pool_id` reste NULL tant que
   * les poules ne sont pas créées (validation, B-11). NULL pour un tirage de tour et pour les tirages repris de l'archive.
   */
  @Column({ type: 'integer', nullable: true })
  poolNumber!: number | null

  @Column({ type: 'integer', nullable: true })
  pairingIndex!: number | null

  @Column({ type: 'integer', nullable: true })
  sidePosition!: number | null

  @Column({ type: 'integer' })
  drawnOrder!: number

  @CreateDateColumn({ type: 'timestamptz' })
  assignedAt!: Date

  @ManyToOne(() => DrawEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'draw_id', foreignKeyConstraintName: 'fk_draw_assignments_draw' })
  draw!: Relation<DrawEntity>

  @ManyToOne(() => ParticipationEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'participation_id', foreignKeyConstraintName: 'fk_draw_assignments_participation' })
  participation!: Relation<ParticipationEntity>

  @ManyToOne(() => PoolEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'pool_id', foreignKeyConstraintName: 'fk_draw_assignments_pool' })
  pool!: Relation<PoolEntity> | null
}

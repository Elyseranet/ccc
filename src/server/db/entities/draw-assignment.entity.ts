import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, type Relation, Unique } from 'typeorm'
import { DrawEntity } from './draw.entity'
import { ParticipationEntity } from './participation.entity'
import { PoolEntity } from './pool.entity'
import { UuidPrimaryEntity } from './uuid-primary.entity'

/** `drawn_order` conserve l'ordre du tirage « poule après poule » (RG11). */
@Entity({ name: 'draw_assignments' })
@Unique('uq_draw_assignments_draw_participation', ['drawId', 'participationId'])
export class DrawAssignmentEntity extends UuidPrimaryEntity {
  @Column({ type: 'uuid' })
  drawId!: string

  @Index('idx_draw_assignments_participation_id')
  @Column({ type: 'uuid' })
  participationId!: string

  @Column({ type: 'uuid', nullable: true })
  poolId!: string | null

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

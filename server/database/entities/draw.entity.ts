import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, type Relation } from 'typeorm'
import { DRAW_KIND, DRAW_STATUS } from '../../../shared/enums/draw.enum.js'
import type { IDrawParameters } from '../../../shared/interfaces/api/draw.interface.js'
import { EditionEntity } from './edition.entity.js'
import { RoundEntity } from './round.entity.js'
import { UserEntity } from './user.entity.js'
import { UuidPrimaryEntity } from './uuid-primary.entity.js'

/**
 * Un seul brouillon par (édition, kind, round). `round_id` pouvant être NULL (tirage de poules),
 * l'unicité est portée par deux index partiels.
 */
@Entity({ name: 'draws' })
@Index('uq_draws_draft_with_round', ['editionId', 'kind', 'roundId'], {
  unique: true,
  where: `"status" = '${DRAW_STATUS.DRAFT}' AND "round_id" IS NOT NULL`
})
@Index('uq_draws_draft_without_round', ['editionId', 'kind'], {
  unique: true,
  where: `"status" = '${DRAW_STATUS.DRAFT}' AND "round_id" IS NULL`
})
export class DrawEntity extends UuidPrimaryEntity {
  @Column({ type: 'uuid' })
  editionId!: string

  @Column({ type: 'enum', enum: DRAW_KIND, enumName: 'draw_kind' })
  kind!: DRAW_KIND

  @Column({ type: 'uuid', nullable: true })
  roundId!: string | null

  @Column({ type: 'enum', enum: DRAW_STATUS, enumName: 'draw_status', default: DRAW_STATUS.DRAFT })
  status!: DRAW_STATUS

  @Column({ type: 'jsonb' })
  parameters!: IDrawParameters

  @Column({ type: 'uuid', nullable: true })
  createdByUserId!: string | null

  @ManyToOne(() => UserEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'created_by_user_id', foreignKeyConstraintName: 'fk_draws_created_by_user' })
  createdBy!: Relation<UserEntity> | null

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date

  @Column({ type: 'timestamptz', nullable: true })
  validatedAt!: Date | null

  @Column({ type: 'uuid', nullable: true })
  validatedByUserId!: string | null

  @ManyToOne(() => UserEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'validated_by_user_id', foreignKeyConstraintName: 'fk_draws_validated_by_user' })
  validatedBy!: Relation<UserEntity> | null

  @ManyToOne(() => EditionEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'edition_id', foreignKeyConstraintName: 'fk_draws_edition' })
  edition!: Relation<EditionEntity>

  @ManyToOne(() => RoundEntity, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'round_id', foreignKeyConstraintName: 'fk_draws_round' })
  round!: Relation<RoundEntity> | null
}

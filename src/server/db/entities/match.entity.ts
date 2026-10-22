import { Check, Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, type Relation, Unique, VersionColumn } from 'typeorm'
import { MATCH_PURPOSE, MATCH_STATUS } from '../../../enums/match.enum'
import { MATCH_TARGET_SCORES } from '../../../consts/match.const'
import { EditionEntity } from './edition.entity'
import { MatchSideEntity } from './match-side.entity'
import { PoolEntity } from './pool.entity'
import { RoundEntity } from './round.entity'
import { UserEntity } from './user.entity'
import { UuidPrimaryEntity } from './uuid-primary.entity'

@Entity({ name: 'matches' })
@Unique('uq_matches_edition_sequence', ['editionId', 'sequence'])
@Unique('uq_matches_legacy_code', ['legacyCode'])
@Check('ck_matches_target_score', `"target_score" IN (${MATCH_TARGET_SCORES.join(', ')})`)
export class MatchEntity extends UuidPrimaryEntity {
  @Column({ type: 'uuid' })
  editionId!: string

  @Index('idx_matches_round_id')
  @Column({ type: 'uuid' })
  roundId!: string

  @Index('idx_matches_pool_id')
  @Column({ type: 'uuid', nullable: true })
  poolId!: string | null

  /** Rang continu sur l'édition (RG24). */
  @Column({ type: 'integer' })
  sequence!: number

  @Column({ type: 'varchar', length: 32, nullable: true })
  legacyCode!: string | null

  @Column({ type: 'enum', enum: MATCH_PURPOSE, enumName: 'match_purpose', default: MATCH_PURPOSE.REGULAR })
  purpose!: MATCH_PURPOSE

  @Column({ type: 'integer' })
  targetScore!: number

  @Column({ type: 'enum', enum: MATCH_STATUS, enumName: 'match_status', default: MATCH_STATUS.SCHEDULED })
  status!: MATCH_STATUS

  /** Visible par l'administrateur uniquement (A13). */
  @Column({ type: 'text', nullable: true })
  comment!: string | null

  @Column({ type: 'timestamptz', nullable: true })
  recordedAt!: Date | null

  @Column({ type: 'timestamptz', nullable: true })
  validatedAt!: Date | null

  @Column({ type: 'uuid', nullable: true })
  validatedByUserId!: string | null

  @ManyToOne(() => UserEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'validated_by_user_id', foreignKeyConstraintName: 'fk_matches_validated_by_user' })
  validatedBy!: Relation<UserEntity> | null

  @VersionColumn()
  version!: number

  @ManyToOne(() => EditionEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'edition_id', foreignKeyConstraintName: 'fk_matches_edition' })
  edition!: Relation<EditionEntity>

  @ManyToOne(() => RoundEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'round_id', foreignKeyConstraintName: 'fk_matches_round' })
  round!: Relation<RoundEntity>

  @ManyToOne(() => PoolEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'pool_id', foreignKeyConstraintName: 'fk_matches_pool' })
  pool!: Relation<PoolEntity> | null

  @OneToMany(() => MatchSideEntity, (side) => side.match)
  sides!: Relation<MatchSideEntity>[]
}

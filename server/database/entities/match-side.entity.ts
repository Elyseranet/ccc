import { Check, Column, Entity, Index, JoinColumn, ManyToOne, type Relation, Unique } from 'typeorm'
import { MATCH_SIDE_MAX_POSITION, MATCH_SIDE_MIN_POSITION } from '../consts/match.const.js'
import { MatchEntity } from './match.entity.js'
import { ParticipationEntity } from './participation.entity.js'
import { UuidPrimaryEntity } from './uuid-primary.entity.js'

/** Un côté par ligne, pour couvrir le match à trois côtés (A11). Le public ne lit que `validated_score`. */
@Entity({ name: 'match_sides' })
@Unique('uq_match_sides_match_position', ['matchId', 'position'])
@Unique('uq_match_sides_match_participation', ['matchId', 'participationId'])
@Check('ck_match_sides_position', `"position" BETWEEN ${MATCH_SIDE_MIN_POSITION} AND ${MATCH_SIDE_MAX_POSITION}`)
@Check('ck_match_sides_recorded_score', '"recorded_score" >= 0')
@Check('ck_match_sides_validated_score', '"validated_score" >= 0')
export class MatchSideEntity extends UuidPrimaryEntity {
  @Column({ type: 'uuid' })
  matchId!: string

  @Column({ type: 'integer' })
  position!: number

  @Index('idx_match_sides_participation_id')
  @Column({ type: 'uuid' })
  participationId!: string

  @Column({ type: 'integer', nullable: true })
  recordedScore!: number | null

  @Column({ type: 'integer', nullable: true })
  validatedScore!: number | null

  @ManyToOne(() => MatchEntity, (match) => match.sides, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'match_id', foreignKeyConstraintName: 'fk_match_sides_match' })
  match!: Relation<MatchEntity>

  @ManyToOne(() => ParticipationEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'participation_id', foreignKeyConstraintName: 'fk_match_sides_participation' })
  participation!: Relation<ParticipationEntity>
}

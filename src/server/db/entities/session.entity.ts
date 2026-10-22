import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, type Relation, Unique } from 'typeorm'
import { UserEntity } from './user.entity'
import { UuidPrimaryEntity } from './uuid-primary.entity'

/** Session serveur (A2). Seul le SHA-256 du jeton est stocké : une fuite de la base n'expose aucune session. */
@Entity({ name: 'sessions' })
@Unique('uq_sessions_token_hash', ['tokenHash'])
export class SessionEntity extends UuidPrimaryEntity {
  @Index('idx_sessions_user_id')
  @Column({ type: 'uuid' })
  userId!: string

  @Column({ type: 'char', length: 64 })
  tokenHash!: string

  @Column({ type: 'timestamptz' })
  expiresAt!: Date

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date

  @Column({ type: 'timestamptz' })
  lastSeenAt!: Date

  @Column({ type: 'timestamptz', nullable: true })
  revokedAt!: Date | null

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id', foreignKeyConstraintName: 'fk_sessions_user' })
  user!: Relation<UserEntity>
}

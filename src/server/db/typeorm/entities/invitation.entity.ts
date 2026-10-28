import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, type Relation, Unique } from 'typeorm'
import { UserEntity } from './user.entity.js'
import { UuidPrimaryEntity } from './uuid-primary.entity.js'

/**
 * Invitation de première connexion (A3, A14). Seul le SHA-256 du jeton est stocké : le jeton en clair
 * n'existe que dans l'email. Un renvoi invalide les anciennes lignes en ramenant `expires_at` à l'instant du renvoi.
 */
@Entity({ name: 'invitations' })
@Unique('uq_invitations_token_hash', ['tokenHash'])
export class InvitationEntity extends UuidPrimaryEntity {
  @Index('idx_invitations_user_id')
  @Column({ type: 'uuid' })
  userId!: string

  @Column({ type: 'char', length: 64 })
  tokenHash!: string

  @Column({ type: 'timestamptz' })
  expiresAt!: Date

  @Column({ type: 'timestamptz', nullable: true })
  consumedAt!: Date | null

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id', foreignKeyConstraintName: 'fk_invitations_user' })
  user!: Relation<UserEntity>
}

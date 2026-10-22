import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, type Relation, Unique } from 'typeorm'
import { UserEntity } from './user.entity'
import { UuidPrimaryEntity } from './uuid-primary.entity'

/**
 * Appareil de confiance d'un compte (SEC-A4). Il porte son propre compteur d'échecs de connexion,
 * indépendant du compteur du compte. Supprimer la ligne révoque l'appareil.
 */
@Entity({ name: 'login_devices' })
@Unique('uq_login_devices_nonce', ['nonce'])
export class LoginDeviceEntity extends UuidPrimaryEntity {
  @Index('idx_login_devices_user_id')
  @Column({ type: 'uuid' })
  userId!: string

  /** Identifiant aléatoire de l'appareil (hex), contenu dans le cookie signé. */
  @Column({ type: 'char', length: 32 })
  nonce!: string

  @Column({ type: 'integer', default: 0 })
  failedLoginCount!: number

  @Column({ type: 'timestamptz', nullable: true })
  throttledUntil!: Date | null

  @Column({ type: 'timestamptz' })
  expiresAt!: Date

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id', foreignKeyConstraintName: 'fk_login_devices_user' })
  user!: Relation<UserEntity>
}

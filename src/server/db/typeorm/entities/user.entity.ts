import { Check, Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, type Relation, Unique } from 'typeorm'
import { USER_ROLE, USER_STATUS } from '../../../../enums/user.enum.js'
import { CompetitorEntity } from './competitor.entity.js'
import { UuidPrimaryEntity } from './uuid-primary.entity.js'

@Entity({ name: 'users' })
@Unique('uq_users_email', ['email'])
@Unique('uq_users_competitor_id', ['competitorId'])
@Check('ck_users_email_lowercase', '"email" = lower("email")')
export class UserEntity extends UuidPrimaryEntity {
  /** Toujours en minuscules (contrainte en base). */
  @Column({ type: 'varchar', length: 254 })
  email!: string

  /** `select: false` : le hash ne sort d'une requête que sur demande explicite (login, changement de mot de passe). */
  @Column({ type: 'varchar', length: 255, nullable: true, select: false })
  passwordHash!: string | null

  @Column({ type: 'enum', enum: USER_ROLE, enumName: 'user_role' })
  role!: USER_ROLE

  @Column({ type: 'enum', enum: USER_STATUS, enumName: 'user_status', default: USER_STATUS.INVITED })
  status!: USER_STATUS

  @Column({ type: 'uuid', nullable: true })
  competitorId!: string | null

  /** SEC-A2 : échecs de connexion consécutifs ; remis à zéro par un succès ou par `user:unlock`. */
  @Column({ type: 'integer', default: 0 })
  failedLoginCount!: number

  /** Fin du délai imposé après trop d'échecs ; pendant ce délai le login répond 429 sans vérifier le mot de passe. */
  @Column({ type: 'timestamptz', nullable: true })
  throttledUntil!: Date | null

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date

  @Column({ type: 'timestamptz', nullable: true })
  lastLoginAt!: Date | null

  /** Relation 1-1 portée par `uq_users_competitor_id` (ManyToOne : évite la contrainte `rel_*` anonyme en double). */
  @ManyToOne(() => CompetitorEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'competitor_id', foreignKeyConstraintName: 'fk_users_competitor' })
  competitor!: Relation<CompetitorEntity> | null
}

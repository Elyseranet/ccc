import { Column, CreateDateColumn, Entity, UpdateDateColumn, VersionColumn, VirtualColumn } from 'typeorm'
import { UuidPrimaryEntity } from './uuid-primary.entity.js'

@Entity({ name: 'competitors' })
export class CompetitorEntity extends UuidPrimaryEntity {
  @Column({ type: 'varchar', length: 160 })
  displayName!: string

  @Column({ type: 'varchar', length: 80, nullable: true })
  firstName!: string | null

  @Column({ type: 'varchar', length: 80, nullable: true })
  lastName!: string | null

  @Column({ type: 'varchar', length: 80, nullable: true })
  nickname!: string | null

  /**
   * Empreinte de l'avatar (16 premiers caractères du SHA-256), `null` sans avatar. Calculée par sous-requête :
   * aucune colonne sur `competitors`, et `competitor_avatars.content` n'est jamais chargé avec le compétiteur.
   */
  @VirtualColumn({
    type: 'varchar',
    query: (alias) => `SELECT LEFT(a.sha256, 16) FROM competitor_avatars a WHERE a.competitor_id = ${alias}.id`
  })
  avatarVersion!: string | null

  /** Donnée privée : jamais exposée par un DTO public. */
  @Column({ type: 'varchar', length: 32, nullable: true })
  phone!: string | null

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date

  /**
   * Version de l'IDENTITÉ (nom affiché, prénom, nom, pseudo), base du contrôle `If-Match` du PATCH admin (T-SEC-10 L1).
   * Les écritures qui ne touchent pas l'identité (avatar, téléphone) la figent avec `COMPETITOR_KEEP_VERSION`.
   */
  @VersionColumn()
  version!: number
}

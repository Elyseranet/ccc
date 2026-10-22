import { Column, CreateDateColumn, Entity, UpdateDateColumn } from 'typeorm'
import { UuidPrimaryEntity } from './uuid-primary.entity'

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

  @Column({ type: 'text', nullable: true })
  avatarUrl!: string | null

  /** Donnée privée : jamais exposée par un DTO public. */
  @Column({ type: 'varchar', length: 32, nullable: true })
  phone!: string | null

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date
}

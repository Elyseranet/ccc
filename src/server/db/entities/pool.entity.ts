import { Column, Entity, JoinColumn, ManyToOne, type Relation, Unique } from 'typeorm'
import { EditionEntity } from './edition.entity'
import { UuidPrimaryEntity } from './uuid-primary.entity'

@Entity({ name: 'pools' })
@Unique('uq_pools_edition_rank', ['editionId', 'rank'])
export class PoolEntity extends UuidPrimaryEntity {
  @Column({ type: 'uuid' })
  editionId!: string

  /** Entier libre, sans enum : jusqu'à 10 poules. */
  @Column({ type: 'integer' })
  rank!: number

  @ManyToOne(() => EditionEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'edition_id', foreignKeyConstraintName: 'fk_pools_edition' })
  edition!: Relation<EditionEntity>
}

import { Column, Entity, JoinColumn, ManyToOne, type Relation, Unique } from 'typeorm'
import { ROUND_KIND, ROUND_STATUS } from '../../../../enums/round.enum.js'
import { EditionEntity } from './edition.entity.js'
import { UuidPrimaryEntity } from './uuid-primary.entity.js'

@Entity({ name: 'rounds' })
@Unique('uq_rounds_edition_kind', ['editionId', 'kind'])
@Unique('uq_rounds_edition_sequence', ['editionId', 'sequence'])
export class RoundEntity extends UuidPrimaryEntity {
  @Column({ type: 'uuid' })
  editionId!: string

  @Column({ type: 'enum', enum: ROUND_KIND, enumName: 'round_kind' })
  kind!: ROUND_KIND

  @Column({ type: 'integer' })
  sequence!: number

  @Column({ type: 'enum', enum: ROUND_STATUS, enumName: 'round_status', default: ROUND_STATUS.PENDING })
  status!: ROUND_STATUS

  @ManyToOne(() => EditionEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'edition_id', foreignKeyConstraintName: 'fk_rounds_edition' })
  edition!: Relation<EditionEntity>
}

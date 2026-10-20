import { Column, Entity, Unique } from 'typeorm'
import { EDITION_ORIGIN, EDITION_STATUS } from '../../../shared/enums/edition.enum.js'
import { UuidPrimaryEntity } from './uuid-primary.entity.js'

/** `year` n'est pas unique : 2012 porte deux éditions (2012a, 2012b). */
@Entity({ name: 'editions' })
@Unique('uq_editions_code', ['code'])
@Unique('uq_editions_chronological_rank', ['chronologicalRank'])
export class EditionEntity extends UuidPrimaryEntity {
  @Column({ type: 'varchar', length: 16 })
  code!: string

  @Column({ type: 'integer' })
  year!: number

  @Column({ type: 'integer' })
  chronologicalRank!: number

  @Column({ type: 'varchar', length: 160, nullable: true })
  name!: string | null

  @Column({ type: 'date', nullable: true })
  heldOn!: string | null

  @Column({ type: 'varchar', length: 160, nullable: true })
  location!: string | null

  @Column({ type: 'text', nullable: true })
  description!: string | null

  /** Commentaire d'édition du classeur : non exposé publiquement tant que sa visibilité n'est pas tranchée. */
  @Column({ type: 'text', nullable: true })
  comment!: string | null

  @Column({ type: 'enum', enum: EDITION_STATUS, enumName: 'edition_status', default: EDITION_STATUS.CREATED })
  status!: EDITION_STATUS

  @Column({ type: 'enum', enum: EDITION_ORIGIN, enumName: 'edition_origin' })
  origin!: EDITION_ORIGIN

  /** N figé à la clôture (RG2). */
  @Column({ type: 'integer', nullable: true })
  participantCount!: number | null

  @Column({ type: 'timestamptz', nullable: true })
  closedAt!: Date | null
}

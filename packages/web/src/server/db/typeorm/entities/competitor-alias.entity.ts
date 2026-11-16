import { Column, Entity, Index, JoinColumn, ManyToOne, type Relation, Unique } from 'typeorm'
import { COMPETITOR_ALIAS_SOURCE } from '../../../../enums/competitor.enum.js'
import { CompetitorEntity } from './competitor.entity.js'
import { UuidPrimaryEntity } from './uuid-primary.entity.js'

@Entity({ name: 'competitor_aliases' })
@Unique('uq_competitor_aliases_alias', ['alias'])
export class CompetitorAliasEntity extends UuidPrimaryEntity {
  @Index('idx_competitor_aliases_competitor_id')
  @Column({ type: 'uuid' })
  competitorId!: string

  /** Graphie source exacte, telle qu'elle apparaît dans le classeur. */
  @Column({ type: 'varchar', length: 160 })
  alias!: string

  @Column({ type: 'enum', enum: COMPETITOR_ALIAS_SOURCE, enumName: 'competitor_alias_source' })
  source!: COMPETITOR_ALIAS_SOURCE

  @ManyToOne(() => CompetitorEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'competitor_id', foreignKeyConstraintName: 'fk_competitor_aliases_competitor' })
  competitor!: Relation<CompetitorEntity>
}

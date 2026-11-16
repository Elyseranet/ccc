import { Check, Column, Entity, JoinColumn, OneToOne, PrimaryColumn, type Relation, UpdateDateColumn } from 'typeorm'
import { AVATAR_MIME_TYPE } from '../../../../enums/avatar.enum.js'
import { CompetitorEntity } from './competitor.entity.js'

/**
 * Photo d'un compétiteur (AV-1 : stockée en base), ré-encodée sans métadonnées. Une ligne par
 * compétiteur ; la supprimer remet l'avatar à `null`. `content` n'est lu que par la route de service.
 */
@Entity({ name: 'competitor_avatars' })
@Check('chk_competitor_avatars_byte_size', '"byte_size" <= 2097152')
export class CompetitorAvatarEntity {
  @PrimaryColumn({ type: 'uuid' })
  competitorId!: string

  @Column({ type: 'bytea' })
  content!: Buffer

  @Column({ type: 'enum', enum: AVATAR_MIME_TYPE, enumName: 'avatar_mime_type' })
  mimeType!: AVATAR_MIME_TYPE

  @Column({ type: 'integer' })
  byteSize!: number

  @Column({ type: 'char', length: 64 })
  sha256!: string

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date

  @OneToOne(() => CompetitorEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'competitor_id', foreignKeyConstraintName: 'fk_competitor_avatars_competitor' })
  competitor!: Relation<CompetitorEntity>
}

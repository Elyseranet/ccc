import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm'
import { LegacyWorkbookImportEntity } from './legacy-workbook-import.entity.js'

@Entity({ name: 'legacy_workbook_rows' })
export class LegacyWorkbookRowEntity {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  sourceSha256!: string

  @PrimaryColumn({ type: 'text' })
  sheetName!: string

  @PrimaryColumn({ type: 'integer' })
  rowNumber!: number

  @Column({ type: 'jsonb' })
  cellValues!: Array<string | number | boolean | null>

  @Column({ type: 'jsonb', default: () => "'{}'::jsonb" })
  formulas!: Record<string, { expression: string; attributes: Record<string, string> }>

  @Column({ type: 'jsonb', default: () => "'{}'::jsonb" })
  styleIds!: Record<string, number>

  @ManyToOne(() => LegacyWorkbookImportEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'source_sha256', referencedColumnName: 'sourceSha256' })
  import!: LegacyWorkbookImportEntity
}

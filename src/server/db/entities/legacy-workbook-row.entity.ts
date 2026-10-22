import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm'
import { LegacyWorkbookImportEntity } from './legacy-workbook-import.entity'

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

  @Column({ type: 'jsonb', default: () => "'{}'" })
  formulas!: Record<string, { expression: string; attributes: Record<string, string> }>

  @Column({ type: 'jsonb', default: () => "'{}'" })
  styleIds!: Record<string, number>

  @ManyToOne(() => LegacyWorkbookImportEntity, { onDelete: 'CASCADE' })
  // Nom de FK et défauts alignés sur la migration M0 (T-DB-01) : `migration:generate` ne doit proposer aucune ligne.
  @JoinColumn({ name: 'source_sha256', referencedColumnName: 'sourceSha256', foreignKeyConstraintName: 'FK_legacy_workbook_rows_import' })
  import!: LegacyWorkbookImportEntity
}

import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm'
import type { ILegacyWorkbookSheetMetadata } from '../interfaces/legacy-workbook.interface.js'

@Entity({ name: 'legacy_workbook_imports' })
export class LegacyWorkbookImportEntity {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  sourceSha256!: string

  @Column({ type: 'text' })
  sourceFilename!: string

  @Column({ type: 'jsonb' })
  sheets!: ILegacyWorkbookSheetMetadata[]

  @CreateDateColumn({ type: 'timestamptz' })
  importedAt!: Date
}

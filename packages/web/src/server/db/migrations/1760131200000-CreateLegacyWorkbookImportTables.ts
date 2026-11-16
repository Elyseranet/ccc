import type { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateLegacyWorkbookImportTables1760131200000 implements MigrationInterface {
  name = 'CreateLegacyWorkbookImportTables1760131200000'

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "legacy_workbook_imports" (
        "source_sha256" character varying(64) NOT NULL,
        "source_filename" text NOT NULL,
        "sheets" jsonb NOT NULL,
        "imported_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_legacy_workbook_imports_source_sha256" PRIMARY KEY ("source_sha256")
      )
    `)

    await queryRunner.query(`
      CREATE TABLE "legacy_workbook_rows" (
        "source_sha256" character varying(64) NOT NULL,
        "sheet_name" text NOT NULL,
        "row_number" integer NOT NULL,
        "cell_values" jsonb NOT NULL,
        "formulas" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "style_ids" jsonb NOT NULL DEFAULT '{}'::jsonb,
        CONSTRAINT "PK_legacy_workbook_rows" PRIMARY KEY ("source_sha256", "sheet_name", "row_number"),
        CONSTRAINT "FK_legacy_workbook_rows_import" FOREIGN KEY ("source_sha256")
          REFERENCES "legacy_workbook_imports" ("source_sha256") ON DELETE CASCADE
      )
    `)
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "legacy_workbook_rows"')
    await queryRunner.query('DROP TABLE "legacy_workbook_imports"')
  }
}

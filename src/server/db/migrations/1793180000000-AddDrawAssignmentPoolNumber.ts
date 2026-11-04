import type { MigrationInterface, QueryRunner } from 'typeorm'

/**
 * M6 : numéro de poule d'une affectation de brouillon (B-11, A1). Généré par `db:migration:generate`, puis relu.
 *
 * Ajoute `draw_assignments.pool_number` (nullable, `>= 1`) : le tirage physique est enregistré avant que les poules
 * existent, donc avant que `pool_id` puisse être renseigné. Aucune donnée n'est réécrite : la colonne est NULL pour
 * les lignes existantes, et le DTO public retombe sur le rang de la poule (`pools.rank`).
 *
 * Rollback : `down` supprime la colonne et sa contrainte. Les numéros de poule des brouillons en cours sont perdus
 * (les tirages validés gardent leur `pool_id`, donc leur poule).
 */
export class AddDrawAssignmentPoolNumber1793180000000 implements MigrationInterface {
  name = 'AddDrawAssignmentPoolNumber1793180000000'

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "draw_assignments" ADD "pool_number" integer`)
    await queryRunner.query(`ALTER TABLE "draw_assignments" ADD CONSTRAINT "ck_draw_assignments_pool_number" CHECK ("pool_number" IS NULL OR "pool_number" >= 1)`)
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "draw_assignments" DROP CONSTRAINT "ck_draw_assignments_pool_number"`)
    await queryRunner.query(`ALTER TABLE "draw_assignments" DROP COLUMN "pool_number"`)
  }
}

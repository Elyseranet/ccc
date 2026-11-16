import type { MigrationInterface, QueryRunner } from 'typeorm'

/**
 * M3 : ralentissement progressif des connexions par compte (SEC-A2, B-08). Généré par
 * `db:migration:generate`, puis relu : les lignes relatives à `legacy_workbook_rows` (dérive
 * préexistante de M0, hors périmètre) ont été retirées.
 *
 * Ajoute `users.failed_login_count` (défaut 0) et `users.throttled_until` (nullable).
 *
 * Rollback : `down` supprime les deux colonnes. Il perd seulement les compteurs d'échecs en cours
 * (aucune donnée métier) ; les comptes, les mots de passe et les sessions ne sont pas touchés.
 */
export class AddLoginThrottle1792525528748 implements MigrationInterface {
  name = 'AddLoginThrottle1792525528748'

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD "failed_login_count" integer NOT NULL DEFAULT '0'`)
    await queryRunner.query(`ALTER TABLE "users" ADD "throttled_until" TIMESTAMP WITH TIME ZONE`)
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "throttled_until"`)
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "failed_login_count"`)
  }
}

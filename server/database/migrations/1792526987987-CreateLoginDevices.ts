import type { MigrationInterface, QueryRunner } from 'typeorm'

/**
 * M4 : appareils de confiance (SEC-A4, B-08). Généré par `db:migration:generate`, puis relu : les lignes
 * relatives à `legacy_workbook_rows` (dérive préexistante de M0, hors périmètre) ont été retirées.
 *
 * Crée `login_devices` (compteur d'échecs propre à chaque appareil), avec FK vers `users` en CASCADE.
 *
 * Rollback : `down` supprime la table. Il perd les appareils de confiance et leurs compteurs : les cookies
 * d'appareil déjà émis deviennent « non reconnus » et chaque client repasse sous le délai par compte, rien d'autre.
 */
export class CreateLoginDevices1792526987987 implements MigrationInterface {
  name = 'CreateLoginDevices1792526987987'

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "login_devices" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "user_id" uuid NOT NULL, "nonce" character(32) NOT NULL, "failed_login_count" integer NOT NULL DEFAULT '0', "throttled_until" TIMESTAMP WITH TIME ZONE, "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "uq_login_devices_nonce" UNIQUE ("nonce"), CONSTRAINT "pk_bc16579b5e7e6cb70759302fbfc" PRIMARY KEY ("id"))`)
    await queryRunner.query(`CREATE INDEX "idx_login_devices_user_id" ON "login_devices" ("user_id") `)
    await queryRunner.query(`ALTER TABLE "login_devices" ADD CONSTRAINT "fk_login_devices_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`)
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "login_devices" DROP CONSTRAINT "fk_login_devices_user"`)
    await queryRunner.query(`DROP INDEX "public"."idx_login_devices_user_id"`)
    await queryRunner.query(`DROP TABLE "login_devices"`)
  }
}

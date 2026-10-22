import type { MigrationInterface, QueryRunner } from 'typeorm'

/**
 * M2 : identité (B-08). Généré par `db:migration:generate`, puis relu : les lignes relatives à
 * `legacy_workbook_rows` (dérive préexistante de M0, hors périmètre) ont été retirées.
 *
 * Crée `users` et `sessions`, puis pose les FK vers `users` des colonnes `created_by_user_id` /
 * `validated_by_user_id` (draws) et `validated_by_user_id` (matches) créées par M1, en SET NULL.
 *
 * Rollback : `down` retire ces FK puis supprime `sessions`, `users` et leurs deux types enum. Il DÉTRUIT
 * les comptes et les sessions (les colonnes `*_by_user_id` repassent à de simples uuid sans FK, leurs valeurs
 * sont conservées). Les comptes se recréent par `npm run user:create-admin` puis par les invitations (B-09).
 */
export class CreateIdentitySchema1792509943930 implements MigrationInterface {
    name = 'CreateIdentitySchema1792509943930'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."user_role" AS ENUM('ADMIN', 'PARTICIPANT')`);
        await queryRunner.query(`CREATE TYPE "public"."user_status" AS ENUM('INVITED', 'ACTIVE')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "email" character varying(254) NOT NULL, "password_hash" character varying(255), "role" "public"."user_role" NOT NULL, "status" "public"."user_status" NOT NULL DEFAULT 'INVITED', "competitor_id" uuid, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "last_login_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "uq_users_competitor_id" UNIQUE ("competitor_id"), CONSTRAINT "uq_users_email" UNIQUE ("email"), CONSTRAINT "ck_users_email_lowercase" CHECK ("email" = lower("email")), CONSTRAINT "pk_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "sessions" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "user_id" uuid NOT NULL, "token_hash" character(64) NOT NULL, "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "last_seen_at" TIMESTAMP WITH TIME ZONE NOT NULL, "revoked_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "uq_sessions_token_hash" UNIQUE ("token_hash"), CONSTRAINT "pk_3238ef96f18b355b671619111bc" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_sessions_user_id" ON "sessions" ("user_id") `);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "fk_users_competitor" FOREIGN KEY ("competitor_id") REFERENCES "competitors"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "draws" ADD CONSTRAINT "fk_draws_created_by_user" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "draws" ADD CONSTRAINT "fk_draws_validated_by_user" FOREIGN KEY ("validated_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "matches" ADD CONSTRAINT "fk_matches_validated_by_user" FOREIGN KEY ("validated_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "sessions" ADD CONSTRAINT "fk_sessions_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "sessions" DROP CONSTRAINT "fk_sessions_user"`);
        await queryRunner.query(`ALTER TABLE "matches" DROP CONSTRAINT "fk_matches_validated_by_user"`);
        await queryRunner.query(`ALTER TABLE "draws" DROP CONSTRAINT "fk_draws_validated_by_user"`);
        await queryRunner.query(`ALTER TABLE "draws" DROP CONSTRAINT "fk_draws_created_by_user"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "fk_users_competitor"`);
        await queryRunner.query(`DROP INDEX "public"."idx_sessions_user_id"`);
        await queryRunner.query(`DROP TABLE "sessions"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."user_status"`);
        await queryRunner.query(`DROP TYPE "public"."user_role"`);
    }

}

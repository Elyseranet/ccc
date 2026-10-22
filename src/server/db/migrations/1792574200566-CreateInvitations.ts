import type { MigrationInterface, QueryRunner } from 'typeorm'

/**
 * M5 : invitations de première connexion (A3, A14, B-09). Généré par `db:migration:generate`, puis mis en forme.
 *
 * Crée `invitations` (SHA-256 du jeton, échéance, consommation), avec FK vers `users` en CASCADE.
 *
 * Rollback : `down` supprime la table. Les liens d'invitation en attente cessent de fonctionner (le jeton en clair
 * n'existe que dans l'email) ; un administrateur les renvoie après remontée de la migration. Aucune autre donnée n'est perdue.
 */
export class CreateInvitations1792574200566 implements MigrationInterface {
  name = 'CreateInvitations1792574200566'

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "invitations" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "user_id" uuid NOT NULL, "token_hash" character(64) NOT NULL, "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, "consumed_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "uq_invitations_token_hash" UNIQUE ("token_hash"), CONSTRAINT "pk_5dec98cfdfd562e4ad3648bbb07" PRIMARY KEY ("id"))`)
    await queryRunner.query(`CREATE INDEX "idx_invitations_user_id" ON "invitations" ("user_id") `)
    await queryRunner.query(`ALTER TABLE "invitations" ADD CONSTRAINT "fk_invitations_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`)
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "invitations" DROP CONSTRAINT "fk_invitations_user"`)
    await queryRunner.query(`DROP INDEX "public"."idx_invitations_user_id"`)
    await queryRunner.query(`DROP TABLE "invitations"`)
  }
}

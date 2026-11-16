import type { MigrationInterface, QueryRunner } from 'typeorm'

/**
 * M5 : avatars téléversés (B-16, AV-1). Généré par `db:migration:generate`, puis relu.
 *
 * Crée `competitor_avatars` (une ligne par compétiteur, FK en CASCADE, taille plafonnée à 2 Mio par un `check`)
 * et supprime `competitors.avatar_url` : l'avatar ne se pose plus que par téléversement.
 *
 * Garde-fou : `up` refuse de s'exécuter si une URL d'avatar est encore renseignée, plutôt que de la perdre en silence.
 * L'import réel doit les avoir toutes à null.
 *
 * Rollback : `down` recrée `avatar_url` (vide) et supprime la table. Les images téléversées sont perdues.
 */
export class CreateCompetitorAvatars1792574239790 implements MigrationInterface {
  name = 'CreateCompetitorAvatars1792574239790'

  async up(queryRunner: QueryRunner): Promise<void> {
    const rows = await queryRunner.query(`SELECT count(*)::int AS "filled" FROM "competitors" WHERE "avatar_url" IS NOT NULL`) as Array<{ filled: number }>
    const filled = rows[0]?.filled ?? 0
    if (filled > 0) {
      throw new Error(`Refusing to drop competitors.avatar_url: ${filled} competitor(s) still have a value`)
    }
    await queryRunner.query(`CREATE TYPE "public"."avatar_mime_type" AS ENUM('image/jpeg', 'image/png', 'image/webp')`)
    await queryRunner.query(`CREATE TABLE "competitor_avatars" ("competitor_id" uuid NOT NULL, "content" bytea NOT NULL, "mime_type" "public"."avatar_mime_type" NOT NULL, "byte_size" integer NOT NULL, "sha256" character(64) NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "chk_competitor_avatars_byte_size" CHECK ("byte_size" <= 2097152), CONSTRAINT "pk_05130eb0c35b75c54e6635a5a35" PRIMARY KEY ("competitor_id"))`)
    await queryRunner.query(`ALTER TABLE "competitors" DROP COLUMN "avatar_url"`)
    await queryRunner.query(`ALTER TABLE "competitor_avatars" ADD CONSTRAINT "fk_competitor_avatars_competitor" FOREIGN KEY ("competitor_id") REFERENCES "competitors"("id") ON DELETE CASCADE ON UPDATE NO ACTION`)
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "competitor_avatars" DROP CONSTRAINT "fk_competitor_avatars_competitor"`)
    await queryRunner.query(`ALTER TABLE "competitors" ADD "avatar_url" text`)
    await queryRunner.query(`DROP TABLE "competitor_avatars"`)
    await queryRunner.query(`DROP TYPE "public"."avatar_mime_type"`)
  }
}

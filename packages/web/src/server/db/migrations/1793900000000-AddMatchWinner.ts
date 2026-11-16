import type { MigrationInterface, QueryRunner } from 'typeorm'

/**
 * B-21 (R-5 bis) : les matchs d'archives sans score ont un vainqueur importé du classeur (le joueur listé en premier, soit le côté
 * `position = 1`). Ajoute `matches.winner_participation_id` et rend VALIDATED les matchs REGULAR qui étaient RESULT_UNKNOWN : leurs
 * scores restent NULL, aucun score n'est inventé.
 *
 * Cohérence : la clé étrangère composite (id, winner_participation_id) vers `match_sides (match_id, participation_id)` impose que le
 * vainqueur soit l'un des côtés du match. Elle est DEFERRABLE INITIALLY DEFERRED : le dump d'archives insère les matchs avant leurs
 * côtés, la vérification se fait à la validation de la transaction. Un vainqueur n'existe que sur un match VALIDATED.
 *
 * Rollback : `down` repasse en RESULT_UNKNOWN les matchs VALIDATED qui ont un vainqueur et aucun score validé (exactement ceux
 * de `up`), puis supprime la colonne et ses contraintes. Aucune autre ligne n'est touchée.
 */
export class AddMatchWinner1793900000000 implements MigrationInterface {
  name = 'AddMatchWinner1793900000000'

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "matches" ADD "winner_participation_id" uuid`)
    await queryRunner.query(`ALTER TABLE "matches" ADD CONSTRAINT "fk_matches_winner_side" FOREIGN KEY ("id", "winner_participation_id") REFERENCES "match_sides" ("match_id", "participation_id") DEFERRABLE INITIALLY DEFERRED`)
    await queryRunner.query(`ALTER TABLE "matches" ADD CONSTRAINT "ck_matches_winner_validated" CHECK ("winner_participation_id" IS NULL OR "status" = 'VALIDATED')`)
    await queryRunner.query(`UPDATE "matches" m SET "winner_participation_id" = s."participation_id", "status" = 'VALIDATED'
      FROM "match_sides" s
      WHERE s."match_id" = m."id" AND s."position" = 1 AND m."status" = 'RESULT_UNKNOWN' AND m."purpose" = 'REGULAR'`)
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`UPDATE "matches" m SET "status" = 'RESULT_UNKNOWN', "winner_participation_id" = NULL
      WHERE m."status" = 'VALIDATED' AND m."winner_participation_id" IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM "match_sides" s WHERE s."match_id" = m."id" AND s."validated_score" IS NOT NULL)`)
    await queryRunner.query(`ALTER TABLE "matches" DROP CONSTRAINT "ck_matches_winner_validated"`)
    await queryRunner.query(`ALTER TABLE "matches" DROP CONSTRAINT "fk_matches_winner_side"`)
    await queryRunner.query(`ALTER TABLE "matches" DROP COLUMN "winner_participation_id"`)
  }
}

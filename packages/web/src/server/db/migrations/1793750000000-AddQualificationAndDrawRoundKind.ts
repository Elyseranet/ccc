import type { MigrationInterface, QueryRunner } from 'typeorm'

/**
 * B-13 : qualification, barrages et tirage de tour.
 * - `editions.qualification` (jsonb, nullable) : la configuration `{ topPerPool, bestNextCount, withPlayoff }` figée par
 *   `POST /editions/{id}/qualification` (RG18). Null tant que la liste des qualifiés n'est pas arrêtée.
 * - `draws.round_kind` (enum `round_kind` existant, nullable) : le type du tour visé par un tirage de TOUR, posé dès le
 *   brouillon (le tour n'existe qu'à la validation, B-18). La garde R-3 de B-12 s'en sert. Null pour un tirage de poules.
 *
 * Rollback : `down` supprime les deux colonnes. Il perd la configuration de qualification des éditions déjà arrêtées
 * (leurs participations gardent leurs statuts) et le type de tour des tirages de tour : à ne faire qu'avec le code précédent.
 * Les lignes existantes restent valides (colonnes nullables, aucune valeur par défaut requise).
 */
export class AddQualificationAndDrawRoundKind1793750000000 implements MigrationInterface {
  name = 'AddQualificationAndDrawRoundKind1793750000000'

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "editions" ADD "qualification" jsonb`)
    await queryRunner.query(`ALTER TABLE "draws" ADD "round_kind" "public"."round_kind"`)
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "draws" DROP COLUMN "round_kind"`)
    await queryRunner.query(`ALTER TABLE "editions" DROP COLUMN "qualification"`)
  }
}

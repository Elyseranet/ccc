import type { MigrationInterface, QueryRunner } from 'typeorm'

/**
 * Contrôle de version obligatoire sur la correction d'identité (T-SEC-08, T-SEC-10 L1) : ajoute `competitors.version`
 * (`@VersionColumn`, 1 pour les lignes existantes). C'est la version de l'identité ; l'avatar et le téléphone la figent.
 *
 * Rollback : `down` supprime la colonne. Il perd uniquement le compteur de version (les identités restent) : le
 * `PATCH /competiteurs/{id}` ne pourrait plus lire de version, donc ce rollback n'a de sens qu'avec le code précédent.
 */
export class AddCompetitorVersion1793491200000 implements MigrationInterface {
  name = 'AddCompetitorVersion1793491200000'

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "competitors" ADD "version" integer NOT NULL DEFAULT '1'`)
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "competitors" DROP COLUMN "version"`)
  }
}

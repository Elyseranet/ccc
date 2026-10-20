import { PrimaryGeneratedColumn } from 'typeorm'

/**
 * Clé `uuid` générée par la base. Le DataSource pose `uuidExtension: 'pgcrypto'` et
 * `installExtensions: false` : le défaut est `gen_random_uuid()`, natif en PostgreSQL 13+.
 */
export abstract class UuidPrimaryEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string
}

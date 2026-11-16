import 'reflect-metadata'
import { createHash } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { DataSource } from 'typeorm'
import { AVATAR_MIME_TYPE } from '../../src/enums/avatar.enum'
import { CompetitorAvatarEntity } from '../../src/server/db/typeorm/entities/competitor-avatar.entity'
import { CompetitorEntity } from '../../src/server/db/typeorm/entities/competitor.entity'
import { cleanup, resetSchema, revertMigrationsUntil } from './helpers/test-database'

let dataSource: DataSource

const columnsOf = async (table: string): Promise<string[]> => {
  const rows: Array<{ column_name: string }> = await dataSource.query(
    `SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1`,
    [table]
  )
  return rows.map((row) => row.column_name).sort()
}

const tableExists = async (table: string): Promise<boolean> =>
  (await columnsOf(table)).length > 0

const saveCompetitor = (displayName: string) => dataSource.getRepository(CompetitorEntity).save({ displayName })

const avatarRow = (competitorId: string, content = Buffer.from('bytes'), byteSize = content.length) => ({
  competitorId,
  content,
  mimeType: AVATAR_MIME_TYPE.PNG,
  byteSize,
  sha256: createHash('sha256').update(content).digest('hex')
})

beforeAll(async () => {
  dataSource = await resetSchema()
})

afterAll(async () => {
  await cleanup()
})

describe('migration CreateCompetitorAvatars (B-16)', () => {
  it('creates competitor_avatars and drops competitors.avatar_url', async () => {
    expect(await columnsOf('competitor_avatars')).toEqual(['byte_size', 'competitor_id', 'content', 'mime_type', 'sha256', 'updated_at'])
    expect(await columnsOf('competitors')).not.toContain('avatar_url')
  })

  it('refuses more than 2 MiB (check constraint) and an unknown MIME type (enum)', async () => {
    const competitor = await saveCompetitor('Check')
    await expect(dataSource.getRepository(CompetitorAvatarEntity).insert(avatarRow(competitor.id, Buffer.from('x'), 2097153)))
      .rejects.toThrow(/chk_competitor_avatars_byte_size/)
    await expect(dataSource.query(
      `INSERT INTO competitor_avatars (competitor_id, content, mime_type, byte_size, sha256) VALUES ($1, 'x', 'image/gif', 1, repeat('a', 64))`,
      [competitor.id]
    )).rejects.toThrow(/avatar_mime_type/)
  })

  it('exposes the fingerprint (16 first sha256 characters) through avatarVersion, and null without avatar', async () => {
    const withAvatar = await saveCompetitor('Avec')
    const without = await saveCompetitor('Sans')
    const row = avatarRow(withAvatar.id)
    await dataSource.getRepository(CompetitorAvatarEntity).insert(row)

    const repository = dataSource.getRepository(CompetitorEntity)
    expect((await repository.findOneByOrFail({ id: withAvatar.id })).avatarVersion).toBe(row.sha256.slice(0, 16))
    expect((await repository.findOneByOrFail({ id: without.id })).avatarVersion).toBeNull()
  })

  it('deletes the avatar with its competitor (ON DELETE CASCADE)', async () => {
    const competitor = await saveCompetitor('Cascade')
    await dataSource.getRepository(CompetitorAvatarEntity).insert(avatarRow(competitor.id))
    await dataSource.getRepository(CompetitorEntity).delete({ id: competitor.id })
    expect(await dataSource.getRepository(CompetitorAvatarEntity).countBy({ competitorId: competitor.id })).toBe(0)
  })

  it('reverts (table and enum gone, avatar_url back and empty) then re-applies', async () => {
    const competitor = await saveCompetitor('Revert')
    await dataSource.getRepository(CompetitorAvatarEntity).insert(avatarRow(competitor.id))

    await revertMigrationsUntil(dataSource, 'CreateInvitations')
    expect(await tableExists('competitor_avatars')).toBe(false)
    expect(await columnsOf('competitors')).toContain('avatar_url')
    const [{ filled }] = await dataSource.query(`SELECT count(avatar_url)::int AS filled FROM competitors`)
    expect(filled).toBe(0)
    const types: Array<{ typname: string }> = await dataSource.query(`SELECT typname FROM pg_type WHERE typname = 'avatar_mime_type'`)
    expect(types).toEqual([])

    await dataSource.runMigrations()
    expect(await columnsOf('competitors')).not.toContain('avatar_url')
    expect(await tableExists('competitor_avatars')).toBe(true)
  })

  it('up refuses to drop avatar_url while a value remains, and applies once it is cleared', async () => {
    await revertMigrationsUntil(dataSource, 'CreateInvitations')
    await dataSource.query(`INSERT INTO competitors (display_name, avatar_url) VALUES ('Legacy', 'https://img.test/a.png')`)

    await expect(dataSource.runMigrations()).rejects.toThrow(/still have a value/)
    expect(await columnsOf('competitors')).toContain('avatar_url')

    await dataSource.query(`UPDATE competitors SET avatar_url = NULL`)
    await dataSource.runMigrations()
    expect(await columnsOf('competitors')).not.toContain('avatar_url')
  })
})

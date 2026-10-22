import { afterEach, describe, expect, it, vi } from 'vitest'
import type { DataSource } from 'typeorm'
import { LOG_EVENT } from '../../src/consts/log-event.const.js'
import { runMigrationsCommand } from '../../src/utils/run-migrations.util.js'
import { logger } from '../../src/utils/logger.util.js'

const fakeDataSource = (overrides: Record<string, unknown>): DataSource => overrides as unknown as DataSource

afterEach(() => {
  vi.restoreAllMocks()
})

describe('runMigrationsCommand', () => {
  it('up : journalise migrations_applied avec la liste des noms et renvoie 0', async () => {
    const info = vi.spyOn(logger, 'info').mockImplementation(() => undefined)
    const dataSource = fakeDataSource({ runMigrations: vi.fn().mockResolvedValue([{ name: 'A1' }, { name: 'B2' }]) })

    expect(await runMigrationsCommand(dataSource, 'up')).toBe(0)
    expect(info).toHaveBeenCalledExactlyOnceWith(LOG_EVENT.MIGRATIONS_APPLIED, { count: 2, migrations: ['A1', 'B2'] })
  })

  it('up : journalise migrations_up_to_date quand rien n\'est à appliquer', async () => {
    const info = vi.spyOn(logger, 'info').mockImplementation(() => undefined)
    const dataSource = fakeDataSource({ runMigrations: vi.fn().mockResolvedValue([]) })

    expect(await runMigrationsCommand(dataSource, 'up')).toBe(0)
    expect(info).toHaveBeenCalledExactlyOnceWith(LOG_EVENT.MIGRATIONS_UP_TO_DATE)
  })

  it('up : journalise migrations_failed et renvoie 1 si une migration échoue', async () => {
    const info = vi.spyOn(logger, 'info').mockImplementation(() => undefined)
    const error = vi.spyOn(logger, 'error').mockImplementation(() => undefined)
    const dataSource = fakeDataSource({ runMigrations: vi.fn().mockRejectedValue(new Error('relation already exists')) })

    expect(await runMigrationsCommand(dataSource, 'up')).toBe(1)
    expect(error).toHaveBeenCalledExactlyOnceWith(LOG_EVENT.MIGRATIONS_FAILED, { message: 'relation already exists' })
    expect(info).not.toHaveBeenCalled()
  })

  it('revert : annule la dernière migration, journalise son nom et renvoie 0', async () => {
    const info = vi.spyOn(logger, 'info').mockImplementation(() => undefined)
    const undoLastMigration = vi.fn().mockResolvedValue(undefined)
    const dataSource = fakeDataSource({ query: vi.fn().mockResolvedValue([{ name: 'B2' }]), undoLastMigration })

    expect(await runMigrationsCommand(dataSource, 'revert')).toBe(0)
    expect(undoLastMigration).toHaveBeenCalledOnce()
    expect(info).toHaveBeenCalledExactlyOnceWith(LOG_EVENT.MIGRATIONS_REVERTED, { migrations: ['B2'] })
  })

  it('revert : renvoie 1 et journalise migrations_failed si l\'annulation échoue', async () => {
    const error = vi.spyOn(logger, 'error').mockImplementation(() => undefined)
    const dataSource = fakeDataSource({
      query: vi.fn().mockResolvedValue([]),
      undoLastMigration: vi.fn().mockRejectedValue(new Error('down failed'))
    })

    expect(await runMigrationsCommand(dataSource, 'revert')).toBe(1)
    expect(error).toHaveBeenCalledExactlyOnceWith(LOG_EVENT.MIGRATIONS_FAILED, { message: 'down failed' })
  })

  it('refuse une sous-commande inconnue sans toucher à la base', async () => {
    const error = vi.spyOn(logger, 'error').mockImplementation(() => undefined)
    const runMigrations = vi.fn()

    expect(await runMigrationsCommand(fakeDataSource({ runMigrations }), 'drop')).toBe(1)
    expect(runMigrations).not.toHaveBeenCalled()
    expect(error).toHaveBeenCalledOnce()
  })
})

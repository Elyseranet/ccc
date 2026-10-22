import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/*********************************************************
 * Rangement de l'arborescence (T-ARCH-01 et T-ARCH-03, ARCH-1 à ARCH-14)
 *
 * @description
 * Garde automatique des règles de `~/CLAUDE.md` et des décisions ARCH-1 à ARCH-7 : un dossier par nature, à plat,
 * et chaque symbole dans son dossier dédié. Un échec nomme les fichiers en cause.
 ********************************************************/
const walk = (dir: string): string[] => readdirSync(dir).flatMap((name) => {
  const path = join(dir, name)
  return statSync(path).isDirectory() ? walk(path) : [path]
})
const subdirectories = (dir: string): string[] => readdirSync(dir).filter((name) => statSync(join(dir, name)).isDirectory())

const FLAT_DIRECTORIES = ['utils', 'services', 'interfaces', 'types', 'enums', 'consts', 'composables', 'themes', 'server/schemas']
const sourceFiles = walk('src').filter((file) => /\.(ts|vue)$/.test(file))
const read = (file: string): string => readFileSync(file, 'utf8')

describe('arborescence (ARCH-1 à ARCH-14)', () => {
  it('aucun sous-dossier dans les dossiers par nature', () => {
    const offenders = FLAT_DIRECTORIES.flatMap((name) => subdirectories(join('src', name)).map((sub) => `src/${name}/${sub}`))
    expect(offenders).toEqual([])
  })

  it('ni src/stores ni src/schemas : les stores sont des composables (ARCH-14), les schémas sont côté serveur (ARCH-13)', () => {
    expect(readdirSync('src').filter((name) => ['stores', 'schemas'].includes(name))).toEqual([])
    expect(readdirSync('src/composables').filter((name) => !/^use[A-Z][A-Za-z0-9]*\.ts$/.test(name))).toEqual([])
  })

  it('src/server ne contient que ce que Nitro impose (api, middleware, plugins), la base (ARCH-6) et les schémas (ARCH-13)', () => {
    expect(subdirectories('src/server').sort()).toEqual(['api', 'db', 'middleware', 'plugins', 'schemas'])
    expect(subdirectories('src/server/db').sort()).toEqual(['migrations', 'typeorm'])
    expect(subdirectories('src/server/db/typeorm')).toEqual(['entities'])
  })

  it('les interfaces ne sont déclarées que dans src/interfaces', () => {
    const offenders = sourceFiles.filter((file) => !file.startsWith('src/interfaces/') && !/^src\/types\/[^/]+\.d\.ts$/.test(file) && /^\s*(export\s+)?interface\s/m.test(read(file)))
    expect(offenders).toEqual([])
  })

  it('les types ne sont déclarés que dans src/types', () => {
    const offenders = sourceFiles.filter((file) => !file.startsWith('src/types/') && /^\s*(export\s+)?type\s+[A-Za-z]\w*\s*(<[^>]*>)?\s*=/m.test(read(file)))
    expect(offenders).toEqual([])
  })

  it('les enums ne sont déclarés que dans src/enums', () => {
    const offenders = sourceFiles.filter((file) => !file.startsWith('src/enums/') && /^\s*(export\s+)?(const\s+)?enum\s/m.test(read(file)))
    expect(offenders).toEqual([])
  })

  it('les constantes (SCREAMING_SNAKE) ne sont déclarées que dans src/consts, ou src/themes pour le thème (ARCH-7)', () => {
    const offenders = sourceFiles.filter((file) => !/^src\/(consts|themes)\//.test(file)
      && /^(export\s+)?const\s+[A-Z][A-Z0-9_]*\s*[:=]/m.test(read(file)))
    expect(offenders).toEqual([])
  })

  it('les schémas zod ne sont déclarés que dans src/server/schemas (ARCH-13)', () => {
    const offenders = sourceFiles.filter((file) => !file.startsWith('src/server/schemas/') && /^(export\s+)?const\s+\w+\s*=\s*z\s*\./m.test(read(file)))
    expect(offenders).toEqual([])
  })

  it('aucun alias #shared ni dossier shared (ARCH-4)', () => {
    const offenders = sourceFiles.filter((file) => /['"]#shared\//.test(read(file)))
    expect(offenders).toEqual([])
    expect(readdirSync('src')).not.toContain('shared')
  })
})

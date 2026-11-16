import { readFileSync, readdirSync } from 'node:fs'
import { builtinModules } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/*********************************************************
 * Dépendances de la CLI compilée (migrations, user:*, db:seed:archives)
 *
 * @description
 * L'image de production n'installe que les `dependencies` de package.json (Dockerfile, étage prod-deps) : la CLI compilée
 * (`.typeorm-dist`, lancée par `ccc-ops migrate` avant le serveur) ne doit importer aucun autre paquet. Une dépendance de
 * dev (h3 par exemple) empêche le conteneur de démarrer (constaté sur T-SEC-17 le 2026-11-12). On parcourt les imports
 * relatifs depuis chaque point d'entrée de la CLI ; les `import type`, effacés à la compilation, ne comptent pas.
 ********************************************************/
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const UTILS = join(ROOT, 'src/utils')
const ENTRY_POINTS = [
  join(ROOT, 'src/server/db/typeorm/data-source.ts'),
  ...readdirSync(UTILS).filter((file) => file.endsWith('-cli.util.ts')).map((file) => join(UTILS, file))
]
const PRODUCTION_PACKAGES = new Set(Object.keys(JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')).dependencies as Record<string, string>))
const IMPORT_PATTERN = /(?:^|\n)\s*(?:import|export)\s+(?!type\b)(?:[^'"]*?\sfrom\s+)?['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)/g

const packageName = (specifier: string): string =>
  specifier.startsWith('@') ? specifier.split('/').slice(0, 2).join('/') : specifier.split('/')[0]!

const collectPackages = (): Map<string, string> => {
  const seen = new Set<string>()
  const packages = new Map<string, string>()
  const queue = [...ENTRY_POINTS]
  while (queue.length > 0) {
    const file = queue.pop()!
    if (seen.has(file)) {
      continue
    }
    seen.add(file)
    for (const match of readFileSync(file, 'utf8').matchAll(IMPORT_PATTERN)) {
      const specifier = (match[1] ?? match[2])!
      if (specifier.startsWith('.')) {
        queue.push(resolve(dirname(file), specifier.replace(/\.js$/, '.ts')))
      } else if (!specifier.startsWith('node:') && !builtinModules.includes(specifier)) {
        packages.set(packageName(specifier), file.slice(ROOT.length + 1))
      }
    }
  }
  return packages
}

describe('compiled CLI dependencies (production image)', () => {
  it('imports only packages listed in package.json dependencies', () => {
    const outside = [...collectPackages()].filter(([name]) => !PRODUCTION_PACKAGES.has(name)).map(([name, file]) => `${name} (${file})`)
    expect(outside).toEqual([])
  })

  it('sees the migration packages, so the walk really follows the imports', () => {
    expect([...collectPackages().keys()]).toEqual(expect.arrayContaining(['typeorm', 'reflect-metadata']))
  })
})

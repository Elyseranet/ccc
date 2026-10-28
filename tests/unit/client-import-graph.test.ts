import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, normalize, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/**
 * Garde du graphe d'import navigateur, en complément de `test:bundle` (qui vérifie le build de production, élagué).
 * En `nuxt dev`, rien n'est élagué : un import STATIQUE de `node:*` (ou d'une librairie Node seule) atteint depuis un
 * fichier chargé par le navigateur fait planter la page, car Vite remplace le module par un objet vide et l'export
 * nommé est introuvable (ex. `createHash` de `node:crypto`). Les imports `import type` et les imports dynamiques
 * (`await import(...)`, réservés au code serveur) ne comptent pas.
 */
const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const SRC = join(ROOT, 'src')
const BROWSER_ENTRY_DIRS = ['composables', 'components', 'pages', 'layouts', 'plugins', 'middleware', 'stores']
const NODE_ONLY_PACKAGES = ['sharp', 'nodemailer', 'pg']
const STATIC_IMPORT = /^\s*(import|export)\s+(?!type\s)[^'"]*?from\s+['"]([^'"]+)['"]|^\s*import\s+['"]([^'"]+)['"]/gm

const listFiles = (dir: string): string[] => existsSync(dir)
  ? readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? listFiles(path) : [path]
  })
  : []

const scriptOf = (file: string): string => {
  const source = readFileSync(file, 'utf8')
  return file.endsWith('.vue') ? [...source.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map((match) => match[1]).join('\n') : source
}

const resolveLocal = (from: string, specifier: string): string | undefined => {
  const base = specifier.startsWith('~/')
    ? join(SRC, specifier.slice(2))
    : specifier.startsWith('.') ? normalize(join(dirname(from), specifier)) : undefined
  if (base === undefined) {
    return undefined
  }
  const stem = base.replace(/\.js$/, '')
  return [stem, `${stem}.ts`, `${stem}.vue`, join(stem, 'index.ts')].find((candidate) => existsSync(candidate) && statSync(candidate).isFile())
}

const isNodeOnly = (specifier: string): boolean => specifier.startsWith('node:') || NODE_ONLY_PACKAGES.includes(specifier)

/** Chaînes (entrée navigateur → … → fichier) qui importent statiquement un module Node seul. */
const findNodeOnlyChains = (): string[] => {
  const entries = BROWSER_ENTRY_DIRS
    .flatMap((dir) => listFiles(join(SRC, dir)))
    .filter((file) => /\.(ts|vue)$/.test(file) && !file.endsWith('.server.ts'))
  const visited = new Set<string>()
  const chains: string[] = []
  const stack = entries.map((file) => [file])
  while (stack.length > 0) {
    const path = stack.pop()!
    const file = path[path.length - 1]!
    if (visited.has(file)) {
      continue
    }
    visited.add(file)
    for (const match of scriptOf(file).matchAll(STATIC_IMPORT)) {
      const specifier = match[2] ?? match[3]!
      if (isNodeOnly(specifier)) {
        chains.push(`${[...path].map((step) => relative(SRC, step)).join(' -> ')} -> ${specifier}`)
        continue
      }
      const next = resolveLocal(file, specifier)
      if (next !== undefined && !visited.has(next)) {
        stack.push([...path, next])
      }
    }
  }
  return chains
}

describe('client import graph (nuxt dev)', () => {
  it('no browser-loaded file statically reaches a Node-only module', () => {
    expect(findNodeOnlyChains()).toEqual([])
  })
})

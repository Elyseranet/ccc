import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { useT } from '~/composables/useT'

const SEGMENT = /^[a-z0-9]+(_[a-z0-9]+)*$/

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) {
      return walk(path)
    }
    return path.endsWith('.vue') || path.endsWith('.ts') ? [path] : []
  })

const read = (file: string): Record<string, string> => JSON.parse(readFileSync(file, 'utf8'))
const fr = read('app/locales/fr.json')
const en = read('app/locales/en.json')

describe('i18n (skill i18n-keys)', () => {
  it('chaque segment de clé est en snake_case', () => {
    const bad = Object.keys(en).flatMap(key => key.split('.').filter(segment => !SEGMENT.test(segment)).map(segment => `${key} -> ${segment}`))
    expect(bad).toEqual([])
  })

  it('fr.json et en.json portent exactement les mêmes clés', () => {
    expect(Object.keys(fr).sort()).toEqual(Object.keys(en).sort())
  })

  it('aucune séquence d’échappement vue-i18n dans les valeurs', () => {
    const offenders = Object.entries({ ...fr, ...en }).filter(([, value]) => /\{'.*'\}|\|/.test(value)).map(([key]) => key)
    expect(offenders).toEqual([])
  })

  it('toute clé utilisée dans le code existe dans en.json, et toute clé de en.json est utilisée', () => {
    const files = walk('app')
    const used = new Set<string>()
    for (const file of files) {
      const source = readFileSync(file, 'utf8')
      for (const match of source.matchAll(/\bt\('([a-z0-9_.]+)'/g)) {
        used.add(match[1]!)
      }
      for (const match of source.matchAll(/\bkey: '([a-z0-9_.]+)'/g)) {
        used.add(match[1]!)
      }
    }
    const missing = [...used].filter(key => !(key in en))
    const dead = Object.keys(en).filter(key => !used.has(key))
    expect(missing).toEqual([])
    expect(dead).toEqual([])
  })

  it('useT remplace les paramètres {param} et retombe sur le repli', () => {
    const { t } = useT()
    expect(t('layout.admin.edition_current', 'Edition {year} · {status}', { year: 2026, status: 'phase de poules' })).toBe('Édition 2026 · phase de poules')
    expect(t('cle.inconnue', 'Repli {n}', { n: 3 })).toBe('Repli 3')
  })
})

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const walk = (dir: string, extensions: string[]): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) {
      return walk(path, extensions)
    }
    return extensions.some(extension => path.endsWith(extension)) ? [path] : []
  })

const APP = 'app'
const vueFiles = walk(APP, ['.vue'])
const styleFiles = walk(APP, ['.vue', '.css', '.scss'])
const sourceFiles = walk(APP, ['.vue', '.ts'])

const templateOf = (source: string): string => source.match(/<template>([\s\S]*)<\/template>\s*<script/)?.[1] ?? ''

describe('conventions vue (skill vue-conventions)', () => {
  it('aucun interface / type / enum déclaré dans un .vue', () => {
    const offenders = vueFiles.filter(file => /^\s*(export\s+)?(interface|type|enum)\s/m.test(readFileSync(file, 'utf8')))
    expect(offenders).toEqual([])
  })

  it('pas de préfixe props. dans le template', () => {
    const offenders = vueFiles.filter(file => /props\./.test(templateOf(readFileSync(file, 'utf8'))))
    expect(offenders).toEqual([])
  })

  it('composants en kebab-case dans le template', () => {
    const offenders = vueFiles.filter(file => /<[A-Z][A-Za-z]*/.test(templateOf(readFileSync(file, 'utf8'))))
    expect(offenders).toEqual([])
  })

  it('aucun attribut texte en dur (aria-label, title, placeholder, alt)', () => {
    const offenders = vueFiles.filter(file => /\s(aria-label|title|placeholder|alt)="[^"{]/.test(templateOf(readFileSync(file, 'utf8'))))
    expect(offenders).toEqual([])
  })

  it('aucun commentaire HTML ni CSS', () => {
    const offenders = vueFiles.filter((file) => {
      const source = readFileSync(file, 'utf8')
      const styles = source.slice(source.indexOf('<style') >= 0 ? source.indexOf('<style') : source.length)
      return /<!--/.test(templateOf(source)) || /\/\*/.test(styles)
    })
    expect(offenders).toEqual([])
  })

  it('l’ordre des blocs est template, script, style scoped, style', () => {
    const order = (source: string): string[] => [...source.matchAll(/^<(template|script|style)[^>]*>/gm)].map(match => match[0].startsWith('<style') ? (match[0].includes('scoped') ? 'style-scoped' : 'style') : match[1]!)
    for (const file of vueFiles) {
      const blocks = order(readFileSync(file, 'utf8'))
      const expected = ['template', 'script', 'style-scoped', 'style'].filter(block => blocks.includes(block))
      expect(blocks, file).toEqual(expected)
    }
  })

  it('aucune couleur hexadécimale en dehors du thème', () => {
    const withoutComments = (source: string): string => source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
    const offenders = styleFiles.filter(file => /#[0-9a-fA-F]{3,8}\b/.test(withoutComments(readFileSync(file, 'utf8'))))
    expect(offenders).toEqual([])
  })
})

describe('règles du projet', () => {
  it('aucun appel $fetch ni import de service dans un composant ou une page', () => {
    const offenders = vueFiles.filter(file => !file.includes('layouts') && /\$fetch|~\/services\//.test(readFileSync(file, 'utf8')))
    expect(offenders).toEqual([])
  })

  it('le chiffre faux « 1 414 » n’apparaît nulle part (A16)', () => {
    const offenders = sourceFiles.filter(file => /1[\s  ]?414/.test(readFileSync(file, 'utf8')))
    expect(offenders).toEqual([])
  })

  it('aucune interface, enum ou type du contrat redéclaré côté app', () => {
    const contractNames = ['IApiError', 'IPaginated', 'ICompetitorPublic', 'IEditionSummary', 'IEditionDetail', 'IMatch', 'IMatchSide', 'IPool', 'IRound', 'IDraw', 'IRankingRow', 'IHeadToHead', 'USER_ROLE', 'EDITION_STATUS', 'MATCH_STATUS', 'ROUND_KIND']
    const declared = walk(APP, ['.ts', '.vue']).filter(file => contractNames.some(name => new RegExp(`(interface|type|enum)\\s+${name}\\b`).test(readFileSync(file, 'utf8'))))
    expect(declared).toEqual([])
  })
})

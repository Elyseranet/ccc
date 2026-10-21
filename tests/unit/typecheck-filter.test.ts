import { describe, expect, it } from 'vitest'
import { diagnosticPath, isOrigamDiagnostic, splitDiagnostics, summarize } from '../../scripts/typecheck.util.mjs'

const ORIGAM_RELATIVE = 'node_modules/origam/dist/components/Btn.vue(12,5): error TS2322: Type mismatch.'
const ORIGAM_WORKTREE = '../../../node_modules/origam/dist/components/Btn.vue(12,5): error TS2322: Type mismatch.'
const ORIGAM_ABSOLUTE = '/Users/dev/Projects/CCC/node_modules/origam/dist/components/Btn.vue(12,5): error TS2322: Type mismatch.'
const ORIGAM_WINDOWS = 'C:\\Projects\\CCC\\node_modules\\origam\\dist\\Btn.vue(12,5): error TS2322: Type mismatch.'
const ORIGAM_COLON_FORMAT = '../../../node_modules/origam/dist/Btn.vue:12:5 - error TS2322: Type mismatch.'
const OURS = 'app/components/players/PlayersSearch.vue(10,3): error TS2322: Type mismatch.'
const OURS_ABSOLUTE = '/Users/dev/Projects/CCC/app/pages/joueurs/index.vue(8,1): error TS2304: Cannot find name.'
const OTHER_PACKAGE = '../../../node_modules/origam-autre/index.ts(1,1): error TS2322: Type mismatch.'
const OTHER_NESTED = '../../../node_modules/vue/node_modules/origam/index.ts(1,1): error TS2322: Type mismatch.'

describe('typecheck : filtre des diagnostics d\'Origam (#1133)', () => {
  it('reconnaît node_modules/origam/ en relatif, depuis un worktree, en absolu et sous Windows', () => {
    for (const line of [ORIGAM_RELATIVE, ORIGAM_WORKTREE, ORIGAM_ABSOLUTE, ORIGAM_WINDOWS, ORIGAM_COLON_FORMAT]) {
      expect(isOrigamDiagnostic(line), line).toBe(true)
    }
  })

  it('garde les diagnostics de notre code, en relatif comme en absolu', () => {
    expect(isOrigamDiagnostic(OURS)).toBe(false)
    expect(isOrigamDiagnostic(OURS_ABSOLUTE)).toBe(false)
  })

  it('ne confond pas origam avec un autre paquet dont le nom commence pareil', () => {
    expect(isOrigamDiagnostic(OTHER_PACKAGE)).toBe(false)
  })

  it('reconnaît un origam imbriqué (segments, pas préfixe)', () => {
    expect(isOrigamDiagnostic(OTHER_NESTED)).toBe(true)
  })

  it('extrait le chemin des deux formats de vue-tsc', () => {
    expect(diagnosticPath(OURS)).toBe('app/components/players/PlayersSearch.vue')
    expect(diagnosticPath(ORIGAM_COLON_FORMAT)).toBe('../../../node_modules/origam/dist/Btn.vue')
  })

  it('sépare les diagnostics écartés des diagnostics conservés, sans doublon', () => {
    const output = [ORIGAM_WORKTREE, OURS, OURS, 'bruit sans diagnostic', ORIGAM_ABSOLUTE].join('\n')
    const { diagnostics, ignored, kept } = splitDiagnostics(output)
    expect(diagnostics).toHaveLength(4)
    expect(ignored).toHaveLength(2)
    expect(kept).toEqual([OURS])
  })

  it('imprime une synthèse dans tous les cas', () => {
    expect(summarize({ keptCount: 0, ignoredCount: 2600, exitCode: 0 })).toBe('typecheck: VERT, 0 erreur hors Origam (2600 diagnostic(s) d\'Origam écarté(s), #1133)')
    expect(summarize({ keptCount: 0, ignoredCount: 0, exitCode: 0 })).toContain('VERT')
    expect(summarize({ keptCount: 3, ignoredCount: 5, exitCode: 1 })).toContain('ROUGE, 3 erreur(s)')
    expect(summarize({ keptCount: 0, ignoredCount: 0, exitCode: 2 })).toContain('ROUGE, nuxi a quitté avec le code 2')
  })
})

import { describe, expect, it } from 'vitest'
// @ts-ignore le garde-fou est un script Node .mjs sans déclaration de types
import { parseDiscoveredFiles, verifyReport } from '../../scripts/test-run.util.mjs'

const CWD = '/repo'
const fileResult = (name: string, statuses: string[], status = 'passed', message = '') => ({
  name: `${CWD}/${name}`,
  status,
  message,
  assertionResults: statuses.map(s => ({ status: s }))
})
const reportOf = (results: ReturnType<typeof fileResult>[]) => ({
  numTotalTests: results.reduce((sum, result) => sum + result.assertionResults.length, 0),
  testResults: results
})
const DISCOVERED = new Set(['tests/unit/a.test.ts', 'tests/nuxt/front/b.test.ts'])

describe('garde-fou test:run', () => {
  it('extrait les fichiers découverts de la sortie de vitest list', () => {
    const files = parseDiscoveredFiles('[unit] tests/unit/a.test.ts\n[front] tests/nuxt/front/b.test.ts\n', CWD)
    expect([...files]).toEqual(['tests/unit/a.test.ts', 'tests/nuxt/front/b.test.ts'])
  })

  it('passe quand tous les fichiers découverts sont exécutés', () => {
    const report = reportOf([fileResult('tests/unit/a.test.ts', ['passed', 'passed']), fileResult('tests/nuxt/front/b.test.ts', ['passed', 'skipped'])])
    const { problems, stats } = verifyReport({ discovered: DISCOVERED, report, exitStatus: 0, cwd: CWD })
    expect(problems).toEqual([])
    expect(stats).toEqual({ discovered: 2, executed: 2, passed: 3, skipped: 1, failed: 0 })
  })

  it('signale un fichier découvert mais absent du rapport, même avec un code de sortie 0', () => {
    // worker jamais démarré : le fichier disparaît des compteurs, Vitest n'affiche aucun test en échec
    const report = reportOf([fileResult('tests/unit/a.test.ts', ['passed'])])
    const { problems } = verifyReport({ discovered: DISCOVERED, report, exitStatus: 0, cwd: CWD })
    expect(problems).toEqual(['tests/nuxt/front/b.test.ts : découvert mais absent du rapport (jamais exécuté)'])
  })

  it('signale un fichier dont le hook a expiré : statut failed, tests ignorés', () => {
    const report = reportOf([
      fileResult('tests/unit/a.test.ts', ['passed']),
      fileResult('tests/nuxt/front/b.test.ts', ['skipped', 'skipped'], 'failed', 'Hook timed out in 60000ms.')
    ])
    const { problems } = verifyReport({ discovered: DISCOVERED, report, exitStatus: 1, cwd: CWD })
    expect(problems).toContain('tests/nuxt/front/b.test.ts : fichier en échec (Hook timed out in 60000ms.)')
    expect(problems).toContain('vitest a quitté avec le code 1')
  })

  it('signale un test en échec et un fichier sans aucun test', () => {
    const report = reportOf([fileResult('tests/unit/a.test.ts', ['passed', 'failed']), fileResult('tests/nuxt/front/b.test.ts', [])])
    const { problems } = verifyReport({ discovered: DISCOVERED, report, exitStatus: 0, cwd: CWD })
    expect(problems).toContain('tests/unit/a.test.ts : 1 test(s) en échec')
    expect(problems).toContain('tests/nuxt/front/b.test.ts : aucun test dans le rapport')
  })

  it('signale un total de tests incohérent avec la somme par fichier', () => {
    const report = { ...reportOf([fileResult('tests/unit/a.test.ts', ['passed']), fileResult('tests/nuxt/front/b.test.ts', ['passed'])]), numTotalTests: 5 }
    const { problems } = verifyReport({ discovered: DISCOVERED, report, exitStatus: 0, cwd: CWD })
    expect(problems).toEqual(['total incohérent : 5 tests annoncés, 2 dans les fichiers'])
  })

  it('échoue quand le rapport JSON est absent', () => {
    const { problems } = verifyReport({ discovered: DISCOVERED, report: null, exitStatus: 0, cwd: CWD })
    expect(problems).toEqual(['rapport JSON absent ou illisible : le run s\'est arrêté avant la fin'])
  })
})

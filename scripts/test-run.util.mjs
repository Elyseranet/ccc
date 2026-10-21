import { relative, resolve } from 'node:path'

/*********************************************************
 * Contrôles du garde-fou `test:run` (T-QA-01), isolés de tout processus pour être testables.
 * Voir `scripts/test-run.mjs` pour le contexte.
 ********************************************************/

export const toRelativePath = (file, cwd = process.cwd()) => relative(cwd, resolve(cwd, file))

/**
 * Extrait les fichiers de test de la sortie de `vitest list --filesOnly` (une ligne « [projet] chemin » par fichier).
 */
export const parseDiscoveredFiles = (stdout, cwd = process.cwd()) => new Set(
  stdout.split('\n')
    .map(line => line.match(/^\[[^\]]+\]\s+(.+)$/)?.[1])
    .filter(Boolean)
    .map(file => toRelativePath(file, cwd))
)

/**
 * Compare les fichiers découverts au rapport JSON de Vitest.
 *
 * @param discovered Set de chemins relatifs, source de vérité (ce que Vitest découvre)
 * @param report rapport JSON de Vitest (`null` si absent ou illisible)
 * @param exitStatus code de sortie de Vitest
 * @returns problèmes bloquants et bilan chiffré
 */
export const verifyReport = ({ discovered, report, exitStatus, cwd = process.cwd() }) => {
  const problems = []
  const stats = { discovered: discovered.size, executed: 0, passed: 0, skipped: 0, failed: 0 }

  if (!report) {
    problems.push('rapport JSON absent ou illisible : le run s\'est arrêté avant la fin')
  } else {
    const byFile = new Map(report.testResults.map(result => [toRelativePath(result.name, cwd), result]))
    for (const file of discovered) {
      const result = byFile.get(file)
      if (!result) {
        problems.push(`${file} : découvert mais absent du rapport (jamais exécuté)`)
        continue
      }
      stats.executed += 1
      const statuses = result.assertionResults.map(test => test.status)
      const failedTests = statuses.filter(status => status === 'failed').length
      if (statuses.length === 0) problems.push(`${file} : aucun test dans le rapport`)
      if (result.status === 'failed') {
        const reason = result.message ? ` (${result.message.split('\n')[0].slice(0, 160)})` : ''
        problems.push(`${file} : fichier en échec${reason}`)
      }
      if (failedTests > 0) problems.push(`${file} : ${failedTests} test(s) en échec`)
      stats.passed += statuses.filter(status => status === 'passed').length
      stats.skipped += statuses.filter(status => ['skipped', 'pending', 'todo'].includes(status)).length
      stats.failed += failedTests
    }
    const reportedTotal = report.testResults.reduce((sum, result) => sum + result.assertionResults.length, 0)
    if (reportedTotal !== report.numTotalTests) {
      problems.push(`total incohérent : ${report.numTotalTests} tests annoncés, ${reportedTotal} dans les fichiers`)
    }
  }

  if (exitStatus !== 0) problems.push(`vitest a quitté avec le code ${exitStatus}`)
  return { problems, stats }
}

import { spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { parseDiscoveredFiles, verifyReport } from './test-run.util.mjs'

/*********************************************************
 * test-run (T-QA-01)
 *
 * @description
 * Enveloppe `vitest run` et fait échouer la commande quand des tests n'ont pas été exécutés, même si Vitest
 * n'affiche aucun test en échec.
 *
 * Pourquoi : quand un worker ne démarre pas (`[vitest-pool]: Failed to start forks worker … Timeout waiting for
 * worker to respond`, délai figé à 60 s dans Vitest) ou quand le hook de l'environnement nuxt expire
 * (`Hook timed out in 60000ms`), Vitest range l'incident dans « Unhandled Errors » ou « Failed Suites ». Les fichiers
 * touchés disparaissent des compteurs : « Tests 222 passed » au lieu de 235, sans aucune ligne « failed » dans le
 * compteur de tests (observé : 223 tests pour 235, 24 fichiers pour 26).
 *
 * Source de vérité : les fichiers que Vitest découvre lui-même (`vitest list --filesOnly`, mêmes arguments que le
 * run) contre les fichiers présents dans le rapport JSON du run. Aucun nombre n'est écrit en dur.
 *
 * Contrôles, tous bloquants (voir `test-run.util.mjs`) :
 * - code de sortie de Vitest différent de 0 ;
 * - fichier découvert absent du rapport (jamais collecté, worker jamais démarré) ;
 * - fichier au statut `failed`, ou contenant un test `failed` ;
 * - fichier sans aucun test dans le rapport ;
 * - total de tests du rapport différent de la somme des tests par fichier.
 * Un test explicitement ignoré (`skip`) reste toléré, il est compté dans le bilan.
 *
 * Usage : `node scripts/test-run.mjs [arguments vitest]`, par ex. `--project front tests/nuxt/front/x.test.ts`.
 * La config est `vitest.config.ts` sauf si `--config`/`-c` est passé.
 ********************************************************/
const DEFAULT_CONFIG = 'vitest.config.ts'
const MAX_BUFFER = 64 * 1024 * 1024

const userArgs = process.argv.slice(2)
const hasConfig = userArgs.some(arg => arg === '--config' || arg === '-c' || arg.startsWith('--config='))
const baseArgs = hasConfig ? userArgs : ['--config', DEFAULT_CONFIG, ...userArgs]

// 1. Fichiers découverts par Vitest
const listing = spawnSync('npx', ['vitest', 'list', '--filesOnly', ...baseArgs], { encoding: 'utf8', maxBuffer: MAX_BUFFER })
if (listing.status !== 0) {
  console.error(`${listing.stdout ?? ''}${listing.stderr ?? ''}`)
  console.error('test-run: la découverte des fichiers de test a échoué (vitest list).')
  process.exit(listing.status ?? 1)
}
const discovered = parseDiscoveredFiles(listing.stdout ?? '')
if (discovered.size === 0) {
  console.error('test-run: aucun fichier de test découvert, un run vide n\'est pas un run vert.')
  process.exit(1)
}

// 2. Run : sortie console normale + rapport JSON dans un dossier temporaire
const workDir = mkdtempSync(join(tmpdir(), 'ccc-test-run-'))
const reportFile = join(workDir, 'report.json')
const run = spawnSync(
  'npx',
  ['vitest', 'run', ...baseArgs, '--reporter=default', '--reporter=json', `--outputFile.json=${reportFile}`],
  { stdio: 'inherit' }
)

// 3. Contrôles
let report = null
try {
  report = JSON.parse(readFileSync(reportFile, 'utf8'))
} catch {
  report = null
} finally {
  rmSync(workDir, { recursive: true, force: true })
}
const exitStatus = run.status ?? 1
const { problems, stats } = verifyReport({ discovered, report, exitStatus })

console.log(`\ntest-run: ${stats.executed}/${stats.discovered} fichiers exécutés, ${stats.passed} tests réussis, ${stats.skipped} ignorés, ${stats.failed} en échec`)
if (problems.length > 0) {
  console.error(`test-run: ÉCHEC, ${problems.length} problème(s) :`)
  for (const problem of problems) console.error(`  - ${problem}`)
  process.exit(exitStatus || 1)
}

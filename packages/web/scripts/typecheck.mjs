import { spawnSync } from 'node:child_process'
import { splitDiagnostics, summarize } from './typecheck.util.mjs'

/*********************************************************
 * typecheck
 *
 * @description
 * `nuxi typecheck` (vue-tsc) analyse aussi les sources `.vue` livrées par `origam` (le paquet n'expose pas de .d.ts
 * pour ses composants). Ces fichiers produisent des diagnostics qui ne nous appartiennent pas.
 * Contournement Origam #1133 (temporaire, jusqu'à la livraison de .d.ts par le paquet) : on écarte UNIQUEMENT
 * les fichiers sous un segment `node_modules/origam/`, à n'importe quelle profondeur (voir `typecheck.util.mjs`).
 * Tout autre diagnostic, front comme `server/`, fait échouer la commande.
 * Une ligne de synthèse est imprimée dans TOUS les cas, succès compris : VERT ou ROUGE, avec le nombre de diagnostics écartés.
 ********************************************************/
const result = spawnSync('npx', ['nuxi', 'typecheck'], { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 })
const output = `${result.stdout ?? ''}${result.stderr ?? ''}`
const { diagnostics, ignored, kept } = splitDiagnostics(output)

if (kept.length > 0) {
  console.error(kept.join('\n'))
}

const exitCode = result.status ?? 1
console.log(summarize({ keptCount: kept.length, ignoredCount: ignored.length, exitCode }))

if (kept.length === 0 && diagnostics.length === 0 && exitCode !== 0) {
  console.error(output)
  process.exit(exitCode)
}
process.exit(kept.length > 0 ? 1 : 0)

import { spawnSync } from 'node:child_process'

/*********************************************************
 * typecheck
 *
 * @description
 * `nuxi typecheck` (vue-tsc) analyse aussi les sources `.vue` livrées par `origam` (le paquet n'expose pas de .d.ts
 * pour ses composants). Ces fichiers produisent des diagnostics qui ne nous appartiennent pas.
 * Contournement Origam #1133 (temporaire, jusqu'à la livraison de .d.ts par le paquet) : on écarte UNIQUEMENT
 * `node_modules/origam/`. Tout autre diagnostic, front comme `server/`, fait échouer la commande.
 * Le nombre de diagnostics écartés est affiché pour rester visible.
 ********************************************************/
const IGNORED_PREFIX = 'node_modules/origam/'

const result = spawnSync('npx', ['nuxi', 'typecheck'], { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 })
const output = `${result.stdout ?? ''}${result.stderr ?? ''}`
const diagnostics = output.split('\n').filter(line => /error TS\d+/.test(line))
const ignored = diagnostics.filter(line => line.startsWith(IGNORED_PREFIX))
const kept = [...new Set(diagnostics.filter(line => !line.startsWith(IGNORED_PREFIX)))]

if (kept.length > 0) {
  console.error(kept.join('\n'))
}
console.log(`typecheck: ${kept.length} erreur(s), ${ignored.length} diagnostic(s) d'origam écarté(s) (#1133)`)

if (kept.length === 0 && diagnostics.length === 0 && result.status !== 0) {
  console.error(output)
  process.exit(result.status ?? 1)
}
process.exit(kept.length > 0 ? 1 : 0)

/*********************************************************
 * typecheck.util
 *
 * @description
 * Logique pure du script `typecheck.mjs`, séparée pour être testée.
 * Un diagnostic de vue-tsc commence par le chemin du fichier : `chemin(12,5): error TS2322: …` ou `chemin:12:5 - error TS…`.
 * Dans un worktree sous `.claude/worktrees/`, le chemin d'un fichier d'Origam sort en `../../../node_modules/origam/…`
 * (ou en absolu) : le filtre reconnaît donc `node_modules/origam/` comme SEGMENTS de chemin, à n'importe quelle profondeur,
 * et jamais `node_modules/origam-autre/`.
 ********************************************************/
const DIAGNOSTIC = /error TS\d+/

const LOCATION = /^(.*?)(?:\(\d+,\d+\)|:\d+:\d+)/

const ORIGAM_SEGMENTS = /(?:^|[\\/])node_modules[\\/]origam[\\/]/

export const isDiagnostic = line => DIAGNOSTIC.test(line)

export const diagnosticPath = (line) => {
  const match = LOCATION.exec(line)
  return match ? match[1] : ''
}

export const isOrigamDiagnostic = line => ORIGAM_SEGMENTS.test(diagnosticPath(line))

export const splitDiagnostics = (output) => {
  const diagnostics = output.split('\n').filter(isDiagnostic)
  const ignored = diagnostics.filter(isOrigamDiagnostic)
  const kept = [...new Set(diagnostics.filter(line => !isOrigamDiagnostic(line)))]
  return { diagnostics, ignored, kept }
}

export const summarize = ({ keptCount, ignoredCount, exitCode }) => {
  if (keptCount > 0) {
    return `typecheck: ROUGE, ${keptCount} erreur(s) hors Origam (${ignoredCount} diagnostic(s) d'Origam écarté(s), #1133)`
  }
  if (ignoredCount === 0 && exitCode !== 0) {
    return `typecheck: ROUGE, nuxi a quitté avec le code ${exitCode} sans diagnostic exploitable`
  }
  return `typecheck: VERT, 0 erreur hors Origam (${ignoredCount} diagnostic(s) d'Origam écarté(s), #1133)`
}

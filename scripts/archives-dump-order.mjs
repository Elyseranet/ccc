import { readFileSync } from 'node:fs'

/*********************************************************
 * archives-dump-order (B-21, SEED-1)
 *
 * @description
 * Filtre la sortie brute de `pg_dump --data-only --column-inserts` (stdin) pour régénérer `src/assets/seeds/archives.sql` :
 * ne garde que les `INSERT`, dans l'ordre des tables et des lignes du dump actuel (argument 1), pour que le diff ne montre que
 * les colonnes et les lignes réellement modifiées. Échoue si les deux dumps n'ont pas exactement les mêmes lignes (même table,
 * même identifiant : première valeur, plus la feuille et le numéro de ligne pour `legacy_workbook_rows`). Le contenu des lignes n'est jamais réécrit : les colonnes ajoutées au schéma depuis le dump actuel figurent donc dans le nouveau.
 *
 * Usage : `pg_dump … | node scripts/archives-dump-order.mjs <dump actuel> > <nouveau dump>`
 ********************************************************/
const INSERT_PATTERN = /^INSERT INTO public\.(\w+) \(.*?\) VALUES \(('[^']*')(, '[^']*', \d+)?/

const parse = (text) => text.split('\n').flatMap((line) => {
  const match = INSERT_PATTERN.exec(line)
  return match ? [{ table: match[1], key: `${match[1]}|${match[2]}${match[3] ?? ''}`, line }] : []
})

const oldRows = parse(readFileSync(process.argv[2], 'utf8'))
const newRows = parse(readFileSync(0, 'utf8'))
const newByKey = new Map(newRows.map((row) => [row.key, row.line]))
if (newByKey.size !== newRows.length) {
  throw new Error('Clés de ligne non uniques dans le nouveau dump')
}
const lines = oldRows.map((row) => {
  const line = newByKey.get(row.key)
  if (line === undefined) {
    throw new Error(`Ligne du dump actuel absente du nouveau dump : ${row.key.slice(0, 80)}`)
  }
  newByKey.delete(row.key)
  return line
})
if (newByKey.size > 0) {
  throw new Error(`${newByKey.size} ligne(s) du nouveau dump absentes du dump actuel`)
}
process.stdout.write(`${lines.join('\n')}\n`)

// Régénère `docs/design/ui/happy-hour/tokens.css` depuis `docs/design/ui/happy-hour/theme.ts`.
//
// `tokens.css` est un fichier GÉNÉRÉ (« Ne pas éditer à la main ») : le baseline Origam
// (`:root` light + dark) puis les tokens de la marque, produits par `themeToCss` du DS
// (`resolveThemeVars` + `themeSelector`). Les maquettes HTML de `docs/design/ui/happy-hour/`
// l'importent : après tout changement de `theme.ts` (rethème, nouveau jeton), exécuter
// `npm run docs:tokens` pour que la référence visuelle reste alignée sur le thème applicatif.
//
// Node ≥ 22.18 requis (type stripping pour l'import de `theme.ts`).

import { writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const require = createRequire(resolve(here, 'package.json'))

const origamVersion = require('origam/package.json').version

// Import par chemin direct (le fichier dist n'est pas exposé par la carte `exports` du paquet).
const { themeToCss } = await import(resolve(here, '../node_modules/origam/dist/src/utils/Commons/apply-theme.util.js'))
const { origamTheme } = await import(resolve(here, '../node_modules/origam/dist/src/themes/origam.theme.js'))
const { CCC_HH_BASE, CCC_HH_DARK } = await import(resolve(here, '../docs/design/ui/happy-hour/theme.ts'))

const blocks = [...origamTheme, CCC_HH_BASE, CCC_HH_DARK].map(themeToCss).join('\n')
const out = `/* GÉNÉRÉ depuis theme.ts par resolveThemeVars/themeSelector d'origam ${origamVersion} (packages/ds/src).
   Baseline origam (light :root + dark) puis la marque. Ne pas éditer à la main. */

${blocks}`

const target = resolve(here, '../docs/design/ui/happy-hour/tokens.css')
writeFileSync(target, out)
console.log(`tokens.css régénéré (origam ${origamVersion}) → docs/design/ui/happy-hour/tokens.css`)

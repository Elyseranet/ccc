# Tickets Origam ouverts depuis CCC

| Ticket | Sujet | Contournement CCC |
|---|---|---|
| #1212 | slot de police `display` | classe locale `.font-display` |
| #1133 (commentaire) | composants sans `.d.ts`, vue-tsc | script `typecheck` filtré (temporaire) |
| #1222 | `btn` variante `text` transparente à l'état actif | entrée active en `flat` |
| #1223 | `drawer` sans `attach` : hydratation SSR en 500 | `aside` CSS, ou `:attach="true"` |
| #1224 | `field` : attributs `isactive`/`isfocused` sur `<input>` | aucun |
| #1225 | `select` : `aria-controls` absent menu fermé | aucun |
| #1226 | `text-field`/`select` : id d'input différent SSR/client | aucun |
| #1227 | thème : clé `components.global` → avertissements | retirer `global: { density }` du thème CCC |
| #1228 | évolution : option `icons` dans le module Nuxt | plugin manuel si besoin |
| #1230 | `list-item` : opacité de l'overlay actif codée en dur (0,12), sans token | aucun (tiroir en `origam-btn` dans un `aside`) |
| #1245 | évolution : tokens de typographie des en-têtes de tableau (casse, interlettrage) | règle `:where(.origam-table) th` dans `main.css` (F-00g) |
| #1246 | `data-table` hérite d'une prop `item` requise (« Missing required prop: item ») | aucun (avertissement en dev seulement) |
| #1249 | `list-item` lien : `role="listitem"` sur l'`<a>`, rôle de lien perdu (WCAG 4.1.2) | aucun (axe passe ; test F-12 cible `listitem`) |
| #1250 | `data-table` : `items` typé `IDataTableItem[]` (ligne interne), TS2322 sur un usage normal | cast unique dans `AppDataTable` (F-00j, DT-1) |
| #1251 | `select` : `aria-label`/`title` « Ouvrir » de repli écrasent un `<label for>` externe (WCAG 4.1.2) | aucun pour l'instant (F-12) |
| #1252 | évolution : token `line-height` des onglets (`line-height: 1` en dur) | règle `:where(.origam-tab__label)` dans `main.css` (F-00l) |
| #1253 | `tabs` pills : la prop `color` n'agit pas sur l'onglet actif (repli `action.primary` en dur) | cssVars `--origam-tabs__item--pills--active---*` dans le thème (F-00l) |
| #1254 | `field` : `--origam-field---corner-clearance` déclaré sur l'élément, non thémable (champ pilule) | règle `.origam-field.origam-field.origam-field` dans `main.css` (F-00m) |
| #1261 | `btn` outlined : la bordure s'ajoute au padding, aucune variable propre à la variante | règle centralisée dans `main.css` (F-00o) |
| #1262 | `table` : séparateur de ligne en `border-bottom` des `td`, côté non thémable | règle `border-top` dans `main.css` (F-00g bis) |
| #1265 | évolution : `line-height: 1.6` en dur sur `.origam-breadcrumb__items`, sans token | règle `.origam-breadcrumb .origam-breadcrumb__items.origam-breadcrumb__items` dans `main.css` (F-00p) |
| #1266 | `field` : couleur du placeholder figée à `currentColor` 50 %, sans variable | règle `text.tertiary` à opacité 1 dans `main.css` (F-00s) |

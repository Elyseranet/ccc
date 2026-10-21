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

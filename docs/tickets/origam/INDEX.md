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
| #1267 | évolution : ligne `kv` de `data-list` (grille, fond, rayon, écart, filet) et casse de la clé non thémables | `:deep` restreint dans `HeadToHeadSummary.vue` (F-05) |
| #1276 | `card` cliquable : `.origam-card > *` écrase l opacité de l overlay, carte noire au repos | règle `.origam-card > .origam-card__overlay.origam-card__overlay` dans `main.css` (F-00t) |
| #1278 | `pagination` : précédent/suivant non masquables, `with-info` limité à la page courante, page courante illisible en neutre, couleurs par règle à identifiant | règles `main.css` (dont un `!important`) et compteur local (F-04, F-04-PAG) |
| #1280 | `field` : retrait de 2 px de l'`<input>` jamais remis à zéro, hauteur minimale avec un interligne en `1.5rem` | règle `.origam-field.origam-field.origam-field input` dans `main.css` et variables du thème (F-15) |
| #1282 | évolution : `bracket`, largeur et hauteur de tour en style en ligne, titre centré en dur, slot `connector` vide sans effet | tableau maison conservé (F-03b, F-03-BRK) |
| #1283 | évolution : `table`, la légende visible n'a pas de variable de graisse | aucun contournement, zone poules-tableau à 0,94 % (F-03b) |
| #1284 | évolution : `chip-group`, pas de retour à la ligne, prop `column` sans effet | `:deep` limité à `.origam-slide-group__container` dans EditionMatches (F-03b) |
| #1304 | évolution : alignement du contenu de `btn` (`justify-content`, `text-align` avec `wrap`) en dur, sans token | `:deep(.origam-btn__content)` dans `PlayerLink.vue` (F-01) |
| #1307 | `alert` : au repos, l'alerte prend les états survol et actif, fond assombri | thème : `feedback.*.bgHover` et `bgActive` égaux à `bg` (F-10) |
| #1327 | `number-field` : retrait vide de 27 px avec `hideControls` ; valeur bornée au montage et à la sortie, sans pouvoir le désactiver | champ « Année » en `origam-text-field` `inputmode="numeric"`, number-field non utilisé (F-13, 87eea8e) |
| #1331 | `select` : deux `role="combobox"` imbriqués (champ et saisie) et `role="menu"` sur un overlay qui contient un `listbox` (menu ouvert) | les 2 règles axe tolérées sur le menu ouvert seulement, restreintes aux 2 éléments (F-09) |
| #1334 | `password-field` : règle de longueur toujours ajoutée à la validation, même champ vide et sans `requirements` ; message non surchargeable par champ | `minLength: 0` + `requirementRules` + `rules` (F-10) |
| #1317 | `chart` : surface de dessin figée à 600 x 360 (le viewBox ne suit pas la largeur), étiquettes d'axe qui se chevauchent | tracé du graphique exclu de la mesure visuelle (F-02, F-02-CHART) |
| #1318 | `chart` : points et barres `role="button"` focusables dans un `<svg role="img">` (axe `nested-interactive`) | règle désactivée sur l'onglet Évolution (F-02, F-02-AXE) |
| à déposer | `data-table` : `text-align: end` de `--align-end` sans effet sur le `th` (style calculé `start`) | `:deep(th.origam-data-table-cell--align-end)` dans `AppDataTable.vue` (F-13) |

# ds(pagination) : pas de prop pour masquer précédent/suivant, mode `with-info` limité à la page courante, page courante illisible en mode neutre, texte des pages non réglable

Ticket Origam : #1278.

## Constat

Mesuré sur `/joueurs` (F-04, liste des joueurs, 146 compétiteurs, 8 pages), contre `docs/design/ui/happy-hour/joueurs.html` (`.pager`).

1. **Précédent / suivant** : `OrigamPagination.vue` rend toujours les `<li class="origam-pagination__prev">` et `__next` (seul `showFirstLastPage` masque les extrêmes). La maquette n'a que les numéros de page. Aucune prop (`showPrevNext`, `hidePrev`…) ne permet de les retirer.
2. **Info sur la même ligne que la liste** : `withInfo` affiche le compteur (« 1–20 sur 146 »), mais `range` renvoie alors `[page]` : la liste ne contient plus que la page courante entre « Précédent » et « Suivant » (OrigamPagination.vue, `if (props.withInfo) return [page.value]`). On ne peut donc pas avoir le compteur et les numéros de page ensemble.
3. **Page courante en mode neutre** (sans `color` / `bgColor`) : le bouton est en variante `text`, dont le fond est forcé à `transparent !important`. Origam peint l'état actif avec `.origam-btn__overlay` (position absolue, au-dessus du contenu non positionné) et la directive `v-contrast` mesure le fond du bouton (transparent), donc la surface de la page : elle écrit sur le bouton `style="color: rgb(255, 255, 255) !important"` (blanc sur fond sombre). Le numéro est blanc sur l'overlay ambre, voire masqué par lui : illisible. Le jeton `--origam-pagination__item--is-active---color` est sans effet, l'attribut en ligne gagne.
4. **Mode coloré** (`color` + `bgColor`) : le seul qui contourne la directive (`data-origam-color-locked`). Mais le bouton reçoit alors les classes utilitaires `origam--bg-primary` / `origam--color-primary` sur **chaque** page, qui peignent toutes les pages en ambre plein. Les jetons `--origam-pagination--primary---background-color` / `---color`, qui devraient donner la teinte des pages inactives (`--bg-base` / `--fg-base`), sont lus mais ne gagnent pas. Cause mesurée : Origam injecte, pour chaque bouton portant `color` / `bgColor`, une règle à sélecteur d'identifiant (`#origam-btn-v-0-0-219 { background-color: var(--origam-color__action--primary---bg) }` et `{ color: var(--origam-color__action--primary---fg) }`, spécificité (1,0,0)), en plus des classes utilitaires `.origam--bg-primary` / `.origam--color-primary` (sans `!important`, spécificité (0,1,0)). Aucun sélecteur de classe ne peut battre un identifiant : seul `!important` y parvient.
5. **Taille et typographie** : `size` et `density` sont propagés aux boutons, pas `fontSize` (réservé au compteur). Le texte d'une page suit la classe de taille du bouton (`size="large"` → 16 px), sans jeton racine possible : `--origam-btn---font-size` est redéclaré sur l'élément par `.origam-btn--size-large`.
6. **Marges** : chaque `<li>` porte `margin: var(--origam-pagination---gap, 4px)` des quatre côtés. L'espace entre deux pages vaut donc 2 × la valeur du jeton, et la liste gagne 2 × la valeur en hauteur ; le jeton ne peut pas exprimer « 4 px entre deux pages, 0 en haut et en bas ».
7. **Retour à la ligne** : la liste est `inline-flex` sans `flex-wrap` et centrée ; 8 pages ne tiennent pas dans 358 px (390 px d'écran) et débordent au lieu de passer à la ligne.

## Mesure (CCC, F-04, base develop fd76ba2)

Zone `joueurs-pagination` du test visuel, seuil de 1 % par zone, compteur « 1–20 sur 146 » posé par CCC à gauche de la liste dans les deux cas :

| Configuration | 1440 px | 390 px |
|---|---|---|
| `origam-pagination` avec le thème d'avant (`density: 'compact'`, sans règle CCC) | 3,750 % (2 059 / 54 912 px) | 44,483 % (19 747 / 44 392 px, 358×76 contre 358×124) |
| avec le thème et les règles CCC de ce ticket | 0,000 % (0 / 54 912 px) | 0,000 % (0 / 44 392 px) |

Détail de l'écart de la première ligne (1440 px) : boutons de 36×36 px (maquette 44×44), pas de 44 px (maquette 48 px), chevrons précédent / suivant présents (absents de la maquette), page courante sans fond ambre lisible, texte de 16 px et crème `rgb(255, 244, 220)` (maquette 12,8 px et `text.secondary` `rgb(201, 184, 232)`). À 390 px, la liste ne passe pas à la ligne (76 px de haut au lieu de 124).

## Ce qu'il faudrait

- Une prop pour masquer précédent / suivant (`showPrevNext: false`).
- `withInfo` qui garde la liste de pages (le compteur en plus, pas à la place).
- Une couleur de texte de la page courante qui s'applique en mode neutre (ou une directive `v-contrast` qui tient compte de l'overlay), ou des jetons `--origam-pagination__item---font-size` / `---size`.
- Des jetons de pages inactives qui gagnent en mode coloré (ou des classes utilitaires qui ne sont pas posées sur toutes les pages).
- Une marge de `<li>` avec jetons séparés (inline / block) et `flex-wrap: wrap` sur la liste.

## Contournement CCC

Par le thème d'abord (`src/themes/ccc.theme.ts`) : `components['origam-pagination']` = `density: 'default'`, `size: 'large'` (boutons de 44 px), `color: 'primary'` + `bgColor: 'primary'` (seul mode qui rend la page courante en ambre plein, texte sombre, sans directive de contraste) ; `cssVars` sur jetons existants : `--origam-pagination--primary---background-color`, `---color`, `--origam-pagination---background-color-hover`, `--origam-pagination__item--is-active---background-color`, `---color`.

Dans `src/assets/css/main.css`, ce que le thème ne peut pas dire (sélecteurs à trois classes pour battre `.origam-pagination[data-v]` et les classes utilitaires) : précédent / suivant en `display: none`, liste en `flex-wrap: wrap` alignée à gauche avec `gap` de 4 px, marge des `<li>` nulle, texte des pages en `font-size.sm`, et fond / couleur des pages non actives rétablis depuis les jetons `--primary` (avec `!important`, seul moyen de battre la règle par identifiant `#origam-btn-…` injectée par `color` / `bgColor`). Le compteur « 1–20 sur N » est un `<span>` de CCC placé à côté du composant dans `PlayersDirectory.vue`.

Aucune dérogation au seuil visuel n'est nécessaire : la zone passe à 0,000 % aux deux largeurs. Ces règles sont à retirer quand Origam livre les points ci-dessus.

## Version

2.37.4 (installée ; ^2.37.3 déclarée)

## Essais écartés (mesurés, F-04, base develop 5552c1e)

- **Retirer `color` / `bgColor` du thème et la règle `!important`** : la zone `joueurs-pagination` passe à 0,255 % (1440) et 0,315 % (390), mais la page courante est illisible : la directive `v-contrast` écrit `style="color: rgb(255, 255, 255) !important"` sur le bouton (elle mesure son fond transparent, pas l'overlay ambre) et l'overlay, positionné, recouvre le numéro ; les autres pages sont blanches et non `text.secondary`. Le ratio est faible parce que le glyphe est petit, pas parce que le rendu est correct (relecture de l'image d'écart). axe ne le signale pas (il lit le fond transparent).
- **Garder `color` / `bgColor` et retirer seulement `!important`** : 17,739 % (1440) et 21,939 % (390), toutes les pages restent en ambre plein (règle par identifiant, spécificité (1,0,0)).

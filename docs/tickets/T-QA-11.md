# T-QA-11 — Zone publique F-21 « départage à N côtés » : marge de 0,003 point à 390

- **Statut** : **Fermé** (2026-11-13). Mergé dans develop @ `10d0a42e` (branche `1c85047c`, dev-f13, revue frontend-lead). Cause : la cellule N° de la zone publique n'avait pas `tabular-nums` (`.num` de la maquette) ; corrigé dans `EditionMatches.vue`. L'écart 0,000 % (zone seule) / 0,908 % (fichier complet) à 390 px est expliqué : la zone démarre à une fraction de pixel différente (0,17 px seule, comme la maquette ; 0,89 px dans le fichier complet). Du coup, la bordure basse du tableau n'est capturée que d'un côté : 377 px rouges, 330 sur la dernière ligne, 47 dans les coins, 0 dans l'en-tête et dans les données. Le test mesure les deux hauts (getBoundingClientRect) et aligne la fraction de l'app sur celle de la maquette : valeur calculée à chaque lancement, pas choisie pour passer. Mesures dev-f13 sous verrou, 2 lancements du fichier complet et 2 de la zone seule : 390 = 0,000 % à chaque fois, 1440 = 0,425 à 0,461 %. Sur le merge (avec F-24) : typecheck vert, test:run 1374 / 1 ignoré / 0, test:bundle vert. Ouvert par le chef de projet au merge de F-21 (`7c28e546`).
- **Constat** : `tests/e2e/writes/F-21.zones.spec.ts`, zone de la ligne publique de départage contre `edition.html?matchs=departage`. Avant le masquage de la cellule N° (code d'édition généré par le test) : 1440 entre 0,605 et 0,624 % ; 390 à 0,929 % sur 4 lancements et 1,953 % sur 1. Après : la cellule N° reçoit le même texte fixe des deux côtés (`44ed0385`), et l'écart MONTE à 0,997 % à 390 (5 lancements identiques) et jusqu'à 0,953 % à 1440. Le code de l'app est identique entre les deux mesures (seuls le test et la fiche ont changé).
- **Problème** : retirer une source de variation ne devrait pas augmenter l'écart. La valeur injectée crée sans doute un écart propre : largeur, police ou injection qui diffère entre la maquette et l'app. À 0,003 point du seuil, le moindre changement de rendu de cette ligne la fera passer au rouge.
- **Attendu** : lire l'image d'écart, expliquer la hausse, puis corriger l'injection ou masquer la cellule par un aplat identique des deux côtés. Objectif : une marge expliquée, sans toucher au seuil de 1 % ni à `AppDataTable`.

## Critères d'acceptation

- [x] Cause de la hausse documentée ici, avec l'image d'écart.
- [x] 5 lancements consécutifs à 390 et 1440 sous verrou, avec une marge expliquée.

## Cause (dev-f13, 2026-11-13)

- **Une vraie différence de rendu, pas un défaut du test.** La cellule N° de la maquette (`.num`) est en `font-variant-numeric: tabular-nums` ; celle de l'application ne l'était pas (styles calculés relevés des deux côtés : `tabular-nums` contre `normal`). Les chiffres tabulaires sont plus larges : la colonne N° de l'application était 1,4 px plus étroite, et décalait d'autant les colonnes suivantes. Le texte fixe `2025-106` (trois chiffres de plus que les codes générés, `2057-4`) amplifiait l'écart, d'où la hausse après le « masquage ».
- **Image d'écart à 390 avant correction** : tous les pixels rouges (414) sont dans la ligne d'en-tête (TOUR 141, VAINQUEUR 259, ADVERSAIRE… décalés de 1,4 px), aucun dans la ligne de données (0 px).

## Correction

`EditionMatches.vue` : la cellule N° est un `span` en `font-variant-numeric: tabular-nums` (aucun changement d'`AppDataTable`). Le test injecte le N° fixe dans ce `span` côté application (injecter dans la `td` retirerait le `span` et la correction).

## Mesure (5 lancements consécutifs, sous verrou, `--retries=0`)

- 390 px : 0,000 % aux 5 lancements (la colonne Score est hors de la zone visible, le tableau défile).
- 1440 px : 0,444 / 0,438 / 0,441 / 0,444 / 0,465 %, maximum 0,465 %.
- Reste à 1440 : la colonne « Score » plus étroite de 1,8 px (390) à 2,6 px (1440) que celle de la maquette, qui décale d'autant les textes des colonnes suivantes (en-têtes Vainqueur, Score, Adversaire, texte de la pastille). Cause non vérifiée (th SCORE aligné à droite, police display) ; notée dans `F-21.md`, sous le seuil, `AppDataTable` non touché.
- **Écart de lancement à 390 px, expliqué** (contrôle sur la base `develop`) : lancée seule, la zone publique donnait 0,000 % ; avec le fichier entier, 0,908 % (identique à chaque fois). Les largeurs de colonnes imprimées sont les mêmes dans les deux modes (390 : 85,1 / 130,8 / 159,8 / 108 / 160,6 / 90,7 côté maquette, la colonne Score à 106,2 px côté application, et hors de la zone de 358 px qui défile : l'hypothèse « Score entre dans la zone » est écartée). Image d'écart du lancement complet : 377 pixels rouges, dont 330 sur la toute dernière ligne de pixels (la bordure basse du tableau) et 47 dans les deux angles bas arrondis, aucun dans l'en-tête ni dans la ligne de données. Cause : la fraction de pixel du haut du tableau côté application dépend de la hauteur de ce qui le précède (la page de l'édition créée par le test) : 0,17 px lancé seul (comme la maquette), 0,89 px avec le fichier entier ; à 0,89 la dernière ligne de pixels de la bordure est dans la capture d'un côté seulement.
- **Correction du test** : la zone pose la fraction de pixel de l'application sur celle de la maquette (déplacement relatif de moins d'un pixel). Mesuré ensuite, 2 lancements du fichier entier et 2 de la zone seule : 390 px à 0,000 % dans tous les cas, 1440 px entre 0,425 et 0,461 %.

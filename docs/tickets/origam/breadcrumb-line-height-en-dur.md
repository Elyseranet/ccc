# ds(breadcrumb) : `line-height: 1.6` en dur sur `.origam-breadcrumb__items`, aucun token — demande d'évolution

> Ce n'est pas un défaut : c'est une demande d'évolution.

## Constat

`OrigamBreadcrumb` impose `line-height: 1.6` sur la liste `.origam-breadcrumb__items`, sans variable. La hauteur de ligne du fil d'Ariane ne suit donc ni la typographie du thème ni celle du contexte. Un thème dont la hauteur de ligne courante est 1,55 obtient 20,48 px par ligne de 12,8 px au lieu de 19,84 px, soit 0,64 px de trop par fil d'Ariane et un décalage vertical d'un demi-pixel de tout ce qui le suit.

Mesure dans CCC (F-05, hero de /joueurs/face-a-face à 390 px, fil d'Ariane à 12,8 px) : hauteur de ligne calculée du lien 20,48 px contre 19,84 px dans la maquette (qui hérite de la hauteur de ligne du corps, 1,55). Écart de pixels de la zone : 1,93 %, dont la quasi-totalité vient de cette demi-ligne.

## Cause

`packages/ds/src/components/Breadcrumb/OrigamBreadcrumb.vue:267` : `line-height: 1.6;` dans `&__items`.

## Contournement côté CCC

Dans `src/assets/css/main.css` : `.origam-breadcrumb .origam-breadcrumb__items.origam-breadcrumb__items { line-height: var(--origam-font__lineHeight---normal) }`. La règle triple le sélecteur de classe pour passer devant la règle scopée d'Origam (0,2,0). Elle dépend du DOM interne du composant.

## Proposition

Soit lire `var(--origam-breadcrumb---line-height, 1.6)` (thémable par `cssVars`), soit supprimer la valeur en dur pour que la liste hérite de la hauteur de ligne du contexte.

## Critère d'acceptation

1. Avec `--origam-breadcrumb---line-height: 1.55` posé par un thème, la ligne d'un fil d'Ariane de 12,8 px mesure 19,84 px.
2. Sans le token, le rendu reste inchangé (`1.6`).

## Version

2.37.4 installée (déclarée `^2.37.3`)

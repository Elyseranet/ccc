# ds(btn, alert) : le bouton outlined et l'anneau de focus d'une alerte ne suivent pas la couleur de l'alerte parente

## Constat

Un `origam-btn` `variant="outlined"` placé dans une `origam-alert` (« Réessayer », « Recharger », « Vérifier l'état ») dessine son filet avec `--origam-btn---border-color` et son anneau de focus avec `--origam-color__border---focus`, deux jetons de THÈME posés au niveau de la page : ils ne dépendent pas de l'alerte qui contient le bouton. Dans une alerte pleine (`danger`, `warning`, `info`, `success`), le filet et l'anneau gardent donc la couleur de la page et se perdent dans le fond de l'alerte. Le texte du bouton, lui, hérite déjà de la couleur de l'alerte.

## Mesure (CCC, F-43, 2026-11-14, 2.37.4)

Bouton `origam-btn variant="outlined"` dans une `origam-alert`, filet 2 px, anneau 2 px à 4 px, couleurs calculées dans Chromium ; fond de l'alerte pour `status="error"` : (231, 132, 116) :

| Élément | Couleur | Contraste sur le fond de l'alerte | Seuil WCAG |
|---|---|---|---|
| texte (hérité) | (14, 36, 47) | 6,06:1 | 4,5:1 (1.4.3) : respecté |
| filet | (131, 166, 185) | 1,02:1 | 3:1 (1.4.11) : manqué |
| anneau de focus | (62, 200, 218) | 1,32:1 | 3:1 (2.4.11 / 1.4.11) : manqué |

Les trois autres statuts (jetons `feedback.*.bg`) : filet 1,12 à 1,27:1, anneau 1,02 à 1,16:1. Les trois variables passent bien d'une alerte à ses boutons (valeurs de test posées sur `.origam-alert` : texte, filet et contour de focus changent).

## Ce qu'il faudrait

Qu'une alerte pose pour ses descendants interactifs `--origam-btn---color`, `--origam-btn---border-color` et `--origam-color__border---focus` à sa propre couleur de texte (`currentColor`), ou expose des variables dédiées (`--origam-alert__action---border-color`, `---focus-color`).

## Contournement CCC

`src/assets/css/main.css` : une règle `.origam-alert { --origam-btn---color: currentColor; --origam-btn---border-color: currentColor; --origam-color__border---focus: currentColor; }` : filet, texte et anneau de tous les boutons et liens d'une alerte prennent la couleur de texte de l'alerte (maquette `hh.css`, 6417a286). À retirer quand Origam livre le comportement.

## Version

2.37.4 (installée ; ^2.37.3 déclarée)

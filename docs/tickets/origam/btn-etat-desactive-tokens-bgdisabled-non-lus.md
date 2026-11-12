# fix(btn) : l'état désactivé ignore `action.*.bgDisabled` / `fgDisabled`, il applique une opacité de 0,5 — défaut

> À déposer chez Origam (pas de numéro tant que la fiche n'est pas ouverte).

## Constat

Le thème expose, par intention, `--origam-color__action--<intent>---bgDisabled` et `---fgDisabled` (tokens.css). `OrigamBtn.vue` ne les lit pas : l'état désactivé n'est rendu que par `--origam-btn---opacity: var(--origam-btn---opacity-disabled, 0.5)` (classe `origam-btn--disabled`). Aucun composant bouton ne consomme ces deux tokens ; seule la feuille d'aides `assets/scss/_helpers.scss` (l.32-33) les lit.

Mesuré dans CCC (F-13, « Supprimer la photo » sans photo, variante `outlined`, 1440 px) : le bouton garde son filet de 2 px et passe à l'opacité 0,5 ; la maquette le peint en aplat `bgDisabled` avec le texte `fgDisabled`, sans filet. Écart de la zone `competiteurs-photo` : 0,96 % (seuil 1 %).

## Reproduction

`<origam-btn variant="outlined" disabled text="x" />` : lire `getComputedStyle(btn).opacity` (0.5) et `backgroundColor` (transparent) ; comparer à `--origam-color__action--primary---bgDisabled`.

## Impact

Un thème ne peut pas styler l'état désactivé par ses tokens : les tokens existent mais n'ont aucun effet sur les boutons.

## Proposition

Lire `bgDisabled` / `fgDisabled` dans l'état `--disabled` (avec repli sur l'opacité actuelle, rendu inchangé sans token).

## Critère d'acceptation

Un bouton désactivé a pour fond `action.<intent>.bgDisabled` et pour texte `fgDisabled` (styles calculés).

## Version

2.37.4

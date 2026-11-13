# fix(btn) : l'état désactivé ignore `action.*.bgDisabled` / `fgDisabled`, il applique une opacité de 0,5 — défaut

> À déposer chez Origam (pas de numéro tant que la fiche n'est pas ouverte).

## Constat

Le thème expose, par intention, `--origam-color__action--<intent>---bgDisabled` et `---fgDisabled` (tokens.css). `OrigamBtn.vue` ne les lit pas : l'état désactivé n'est rendu que par `--origam-btn---opacity: var(--origam-btn---opacity-disabled, 0.5)` (classe `origam-btn--disabled`). Aucun composant bouton ne consomme ces deux tokens ; seule la feuille d'aides `assets/scss/_helpers.scss` (l.32-33) les lit. Les tokens propres au bouton `--origam-btn---background-color-disabled` et `--origam-btn---color-disabled` sont déclarés par `tokens/light.css` et `tokens/dark.css` (ils valent `bgDisabled` / `fgDisabled` de `action.primary`) mais `OrigamBtn.vue` ne les lit jamais non plus (aucune occurrence dans `components/Btn`).

Mesuré dans CCC (F-13, « Supprimer la photo » sans photo, variante `outlined`, 1440 px) : le bouton garde son filet de 2 px et passe à l'opacité 0,5 ; la maquette le peint en aplat `bgDisabled` avec le texte `fgDisabled`, sans filet. Écart de la zone `competiteurs-photo` : 0,96 % (seuil 1 %).

## Reproduction

`<origam-btn variant="outlined" disabled text="x" />` : lire `getComputedStyle(btn).opacity` (0.5) et `backgroundColor` (transparent) ; comparer à `--origam-color__action--primary---bgDisabled`.

## Impact

Un thème ne peut pas styler l'état désactivé par ses tokens : les tokens existent mais n'ont aucun effet sur les boutons.

## Proposition

Lire `bgDisabled` / `fgDisabled` dans l'état `--disabled` (avec repli sur l'opacité actuelle, rendu inchangé sans token).

## Section : `bg-color` et `elevation` passés en ligne (F-37, F-25)

Mesuré dans CCC (F-24 « Arrêter la liste », F-25 « Valider le tirage ») : un `origam-btn variant="flat" bg-color="primary" elevation="lg"` désactivé garde le fond primary et l'ombre de son élévation (relevé : fond `action.primary.bg`, ombre colorée sous le bouton), même avec la règle centrale ci-dessous, car ces valeurs sont posées en ligne sur l'élément et la règle de classe ne les écrase pas. Le bouton désactivé a l'air actif. Sans `bg-color` ni `elevation` en ligne, la règle s'applique (fond `bgDisabled`, sans ombre).

Proposition : un état `--disabled` qui prime sur `bg-color` et `elevation` (les props ne s'appliquent qu'à l'état actif).

Contournement CCC : `src/composables/usePrimaryActionButton.ts` ne passe `bg-color` et `elevation` que lorsque le bouton est actif.

## Contournement CCC

Règle centrale dans `src/assets/css/main.css`, listée dans l'en-tête de `ccc.theme.ts` : bouton désactivé (hors pagination) à opacité 1, fond `action.primary.bgDisabled`, texte `text.tertiary` (la maquette `hh.css` : `.btn:disabled`), filet transparent, sans ombre.

## Critère d'acceptation

Un bouton désactivé a pour fond `action.<intent>.bgDisabled` et pour texte `fgDisabled` (styles calculés).

## Version

2.37.4

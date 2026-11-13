# ds(stepper) : un item cliquable est un `<button>` sans `to` ni `href`, et l'étape active est un bouton désactivé

> À déposer chez Origam (pas de numéro tant que la fiche n'est pas ouverte). Autre défaut du même composant que `stepper-item-cliquable-nom-accessible-anglais.md` (nom accessible) : fiche distincte.

## Constat

`OrigamStepperItem.vue` (2.37.4, l.2-9) rend sa racine par `<component :is="isClickable ? 'button' : 'div'" type="button" … :disabled="isClickable && resolvedStatus === ACTIVE ? true : undefined" @click="handleClick">`. Donc :

1. un item cliquable est un `<button>` qui émet son index ; l'item n'accepte ni `to` ni `href`, et ne rend jamais de `<a>` : pas de clic molette, pas d'ouverture dans un nouvel onglet, pas de rôle « lien » pour les lecteurs d'écran ; la navigation se fait par un gestionnaire `@update:model-value` qui appelle `navigateTo` ;
2. l'étape active d'un stepper cliquable est un bouton `disabled` : elle ne prend pas le focus et ne peut pas être activée, alors qu'une page de workflow peut vouloir un lien vers l'étape courante (maquette F-39 : l'étape courante est un lien avec `aria-current="step"` et un état focus).

Constaté dans CCC : navigation « Phase finale » (F-24, F-25, `PhaseSteps.vue`, boutons + `navigateTo`, étape courante inerte) ; maquette F-39 du centre de contrôle (liens).

## Reproduction minimale

```vue
<origam-stepper clickable :model-value="1" :items="[{ title: 'A' }, { title: 'B' }, { title: 'C' }]" />
```

Le DOM rend trois `<button type="button">`, le deuxième avec `disabled`.

## Impact

Un stepper de navigation entre pages ne peut pas être fait de vrais liens, et son étape courante n'est pas atteignable au clavier.

## Proposition

Accepter `to` / `href` par item (rendre un `<a>` ou le lien du routeur) et ne pas désactiver l'étape active quand elle a une cible (`aria-current="step"` suffit à la désigner).

## Contournement CCC

Boutons + `navigateTo` et étape courante inerte (`PhaseSteps.vue`, F-24, F-25) ; F-39 : voir la fiche `docs/tickets/F-39.md` (option retenue).

## Version

2.37.4

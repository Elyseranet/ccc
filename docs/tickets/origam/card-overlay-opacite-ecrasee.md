# ds(card) : `.origam-card > *` écrase l'opacité de l'overlay, une carte cliquable est noire au repos

## Constat

Une `origam-card` cliquable (prop `to`, `link` ou `hover` avec lien) rend un `<span class="origam-card__overlay">` (scrim du survol). Au repos il devrait être transparent (opacité 0) et ne s'assombrir qu'au survol. Il est opaque en permanence : la carte entière s'affiche noire (`rgb(0, 0, 0)`), contenu masqué.

Mesure dans CCC (F-01, tuiles du bento, 2.37.4) : opacité calculée de l'overlay = 1 au repos, alors que `--origam-card__overlay---opacity` vaut bien 0. Les cartes non cliquables n'ont pas ce `<span>` et ne sont pas touchées.

## Cause

`packages/ds/src/components/Card/OrigamCard.vue` : la règle `> * { opacity: var(--origam-card---opacity) }` (lignes 553-555, spécificité `.origam-card[data-v] > *` = (0,2,0)) s'applique à TOUS les enfants directs, overlay et underlay compris, et passe après `.origam-card__overlay { opacity: var(--origam-card__overlay---opacity, 0) }` (ligne 537, même spécificité (0,2,0)). L'opacité de la carte (1, ou 0,6 si désactivée, lignes 738-742) remplace celle de l'overlay.

## Contournement côté CCC

Dans `src/assets/css/main.css` : `.origam-card > .origam-card__overlay.origam-card__overlay { opacity: var(--origam-card__overlay---opacity, 0); }`. La règle double la classe de l'overlay pour passer devant (0,3,0 contre 0,2,0), sans `!important`. Elle dépend du DOM interne du composant.

Mesures avec le contournement (Chromium, carte `to` + `hover`) : repos, overlay 0 ; survol, overlay 0,12 (la valeur `--origam-card---overlay-opacity-hover` de l'état `:hover`, lignes 713-718) ; désactivée, le contenu garde son opacité de 0,6 (la règle `> *` continue de s'appliquer au contenu) et la carte n'a pas d'overlay.

## Proposition

Limiter la règle au contenu : `> *:not(.origam-card__overlay):not(.origam-card__underlay)`, ou la placer sous `:where()` pour qu'elle ne passe jamais devant une règle d'enfant.

## Critère d'acceptation

1. Une carte avec `to` est opaque au repos (overlay à l'opacité 0) et s'assombrit de 12 % au survol.
2. Une carte désactivée garde l'opacité de 0,6 sur son contenu.
3. Une carte non cliquable est inchangée.

## Version

2.37.4 installée (déclarée `^2.37.3`)

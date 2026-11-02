# ds(alert) : au repos, l'alerte prend les états survol et actif, et son fond est assombri

## Constat

`OrigamAlert.vue` branche deux drapeaux d'état qui sont toujours vrais pour une alerte affichée :

- **survol** : la prop `hover` vaut `true` par défaut (ligne 217, `hover: { type: [Boolean, Object], default: true }`). `useStateFlag(props, { state: "hover" })` (lignes 238-243) traite `true` comme un état **forcé** (`stateFlag.composable.js`, lignes 11-19 : `if (v === true) return true`, puis `if (forced.value) return true`). `mouseleave` ne peut donc jamais l'éteindre.
- **actif** : `useStateFlag(props, { state: "active", source: "modelValue" })` (ligne 236). `modelValue` est la **visibilité** de l'alerte (`v-if="isActive"`, ligne 4, défaut `true` ligne 139). Une alerte visible est donc toujours « active ».

Ces deux drapeaux vont à `useStateEffect(props, isHover, isActive, …)` (ligne 257). Le fond de l'intention de statut (`error` donne `danger`) est alors calculé avec le rôle `hover` (`stateEffect.composable.js`, ligne 74, `bgRole`), et `color.util.js` (lignes 280-285, `intentBgExpr`) émet la règle par identifiant :

```css
#origam-alert-v-4 {
  background-color: var(--origam-color__feedback--danger---bgHover, color-mix(in srgb, var(--origam-color__feedback--danger---bg), black 20%));
}
```

Les classes `origam-alert--hover origam-alert--active` sont posées sans aucune interaction.

## Mesure (CCC, thème Happy Hour, `status="error" density="compact" rounded="lg"`, aucune interaction)

| | fond calculé | texte |
|---|---|---|
| attendu (`danger.bg`) | #ff6b81 | #160b2e (`danger.fg`) |
| rendu, `hover` par défaut | rgb(204, 86, 103), soit `danger.bg` + 20 % de noir (`bgHover` absent du thème) | #160b2e, contraste 4,54:1 |
| rendu, `:hover="false"` | rgb(179, 75, 90), soit `danger.bg` + 30 % de noir (`bgActive`, l'état actif reste) | passé en #fff par `v-contrast` (avertissement « Low text contrast (3.63:1) ») |

Désactiver le survol ne suffit donc pas : l'état actif prend le relais, avec un fond encore plus sombre.

## Attendu

Au repos, une alerte affiche le fond de son intention (`danger.bg` pour `error`), sans les classes `--hover` ni `--active`.

- Le survol ne s'allume que sur `mouseenter`, et seulement si l'alerte est interactive.
- La visibilité (`modelValue`) ne doit pas servir de source à l'état actif.

## Contournement CCC

Thème : définir les jetons `feedback.*.bgHover` (et `bgActive`) égaux à `bg`, pour que le fond calculé redevienne la couleur voulue. Le front-lead le prévoit dans F-10, et la mesure se fait contre `compte.html` (fond `danger.bg`). À retirer quand Origam est corrigé.

## Version

2.37.4 (installée ; ^2.37.3 déclarée)

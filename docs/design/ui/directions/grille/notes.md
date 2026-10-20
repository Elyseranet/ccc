# Direction C : Grille

**Intention.** Un éditorial suisse, façon fiche pilote. Fond papier blanc, encre noire, colonnes de la grille visibles en filigrane. Les chiffres sont géants, en graisse régulière, face à des libellés mono en capitales numérotés (`01 Éditions`, `RG07`, tuiles `01`…`07`). Un seul accent : le bleu électrique. Les données **sont** la décoration : compteurs animés, barres de parcours, lignes de grille. Mode clair par défaut, mode sombre « écran de régie ».

## Références (motionsites.ai, consulté le 2026-10-19)

| Référence | URL | Ce que j'en retiens |
|---|---|---|
| NOX Grid | https://motionsites.ai/?prompt=nox-grid | Colonnes en pointillés visibles, contenus calés dessus, beaucoup de vide. |
| Axle Journey | https://motionsites.ai/?prompt=axle-journey | Un chiffre géant par cellule, libellé court dessous. |
| F1 Driver Profile | URL non relevée (carte vue en suggestion sur la fiche Slam Dunk) | Fiche de sportif : nom sur deux lignes, statistiques géantes en colonne. C'est le modèle direct de la fiche joueur. |

## Décisions UX intégrées (`docs/design/ux/decisions.md`)

- **Navigation et en-tête** : nav à 4 entrées (Éditions · Joueurs · Palmarès · Règles), sans avatar ni Connexion dans l'en-tête (A3, A5).
- **Pied de page** : un lien « Connexion » unique (E-d).
- **Recherche publique de joueurs** sur la fiche, `role="search"` (E-e).
- **Édition en cours** : uniquement des scores **validés**, libellés « Derniers scores validés ». Aucun point qui pulse, aucun clignotement, aucune bordure animée : rien ne doit faire croire à du temps réel (E-f).
- **Palmarès** : titres seulement, avec des onglets ACP, All Time et Évolution (E-b, E-c). La page n'est pas maquettée ici ; la tuile « Dernier champion » de l'accueil ne montre qu'un titre.

## Props d'abord (`theme.ts`)

| Composant | Props | Rendu |
|---|---|---|
| `global` | `density: 'compact'` | Densité éditoriale. |
| `origam-card` | `rounded: 'none'`, `border: true`, `elevation: 'none'`, `flat: true` | Cellules jointives. |
| `origam-chip` | `label: true`, `pill: false`, `border: true`, `fontFamily: 'mono'`, `textTransform: 'uppercase'` | Étiquettes carrées. |
| `origam-title` | `fontWeight: 'medium'`, `letterSpacing: 'tight'`, `lineHeight: 'none'` | Grands titres maigres. |
| `origam-table` | `border: true`, `rounded: 'none'`, `density: 'compact'`, `fixedHeader: true` | Tableaux de régie. |
| `origam-tabs` | `variant: 'underline'`, `rounded: 'none'` | Onglets soulignés. |
| `origam-text-field` / `origam-select` | `variant: 'underlined'` | Champs à simple trait. |
| `origam-avatar` | `rounded: 'none'` | Avatar carré. |

Échelle `shadow` : filets de `xs` à `md`, puis décalages nets à l'encre (`lg`) et au bleu (`xl`).

**Aucun slot de police détourné** (Inter Tight et JetBrains Mono). **Aucun escape hatch `cssVars`.**

## Mouvement (CSS seul, coupé sous `prefers-reduced-motion`)

- **Compteurs** : le grand chiffre « Victoires » compte de 0 à 41 via `@property --n` (`<integer>`) et `counter()`. Le texte réel reste dans le DOM, en transparent, pour les lecteurs d'écran. Sous reduced-motion, `--n` vaut directement la valeur finale.
- **Titre** : les mots se révèlent par `clip-path`.
- **Pastille du hero** : la capsule se trace par `stroke-dashoffset`.
- **Nav, tuiles, lignes de tableau** : un aplat bleu monte (`background-size`) au survol. Le texte passe en blanc (6,71:1).
- **Barres, jauge et barres d'adversaires** : croissance en `scale`.
- **Bandeau** : marquee de 70 s, avec les règles numérotées `RG01`…`RG08` comme dans la Spec fonctionnelle.

## Contrastes

Scan automatique, 2 pages × 2 modes : 0 échec réel. Le seul signalement est le « 41 » volontairement transparent, dont le chiffre visible est le `::after` en encre (18,94:1).

| Paire | Ratio |
|---|---|
| encre `#0a0a0a` sur `#fafaf8` | 18,94 |
| secondaire `#55554f` | 7,18 |
| tertiaire `#6b6b64` | 5,14 |
| bleu `#1f3bff` texte sur papier | 6,42 |
| blanc sur bleu | 6,71 |
| dark : `#edede8` sur `#0b0b0b` | 16,76 |

## Limites et inconnues

- Les animations de compteur et de dessin utilisent `@property`, qui est supporté par Chromium, Safari 16.4+ et Firefox 128+. Sans support, le chiffre final s'affiche directement, ce qui reste acceptable.
- La grille de fond est un `repeating-linear-gradient` calé sur la largeur de `.wrap`. Il faudra l'aligner sur le vrai conteneur d'app (`origam-main` / `origam-grid`) au moment de l'intégration.
- La direction est la plus sobre en couleur. Si l'utilisateur veut de l'« effet » au premier regard, Nocturne ou Affiche y répondent plus vite.

# Direction A : Nocturne

**Intention.** Une nuit de finale. Le fond est quasi noir. Des halos de lumière acide (citron vert, menthe, indigo) dérivent lentement derrière le hero. Les tuiles bento sont en verre dépoli. Les titres sont très grands, en Geist, avec une ponctuation en serif italique (Instrument Serif). Le CTA est un dégradé lumineux. Mode sombre par défaut, mode clair « aube » disponible.

## Références (motionsites.ai, consulté le 2026-10-19)

| Référence | URL | Ce que j'en retiens |
|---|---|---|
| Liquid Glass Agency | https://motionsites.ai/?prompt=liquid-glass-agency | Titres sans géants ponctués d'un mot en serif italique ; sections empilées sur fond noir ; reflets de verre. |
| Axle Journey | https://motionsites.ai/?prompt=axle-journey | Bento de panneaux en verre posés sur un visuel ; un chiffre géant par panneau (« 4K », « 88% ») ; nav en pilules. |
| Peakline Redshift | https://motionsites.ai/?prompt=peakline-redshift | Un halo de couleur unique et chaud qui porte toute l'ambiance du hero. |

Les références sont des **landings de démonstration** (AI, SaaS) appuyées sur de la vidéo ou de la 3D. Je n'en reprends que la grammaire : verre, halo, typographie mixte. La vidéo et la 3D ne sont pas transposées, car il n'y a ni asset ni contenu pour les alimenter.

## Décisions UX intégrées (`docs/design/ux/decisions.md`)

- **Navigation et en-tête** : nav à 4 entrées (Éditions · Joueurs · Palmarès · Règles), sans avatar ni Connexion dans l'en-tête (A3, A5).
- **Pied de page** : un lien « Connexion » unique (E-d).
- **Recherche publique de joueurs** sur la fiche, `role="search"` (E-e).
- **Édition en cours** : uniquement des scores **validés**, libellés « Derniers scores validés ». Aucun point qui pulse, aucun clignotement, aucune bordure animée : rien ne doit faire croire à du temps réel (E-f).
- **Palmarès** : titres seulement, avec des onglets ACP, All Time et Évolution (E-b, E-c). La page n'est pas maquettée ici ; la tuile « Dernier champion » de l'accueil ne montre qu'un titre.

## Props d'abord (`theme.ts`)

| Composant | Props | Rendu |
|---|---|---|
| `origam-btn` | `rounded: 'full'`, `size: 'large'`, `fontWeight: 'semibold'` | Le CTA s'écrit `variant="flat" color="primary"` : son fond **est** le dégradé du token `action.primary.bg` (un token couleur accepte un dégradé, `theme.interface.ts`). L'action secondaire utilise `variant="ghost"`, le glassmorphism **natif** de `VARIANT`. |
| `origam-card` | `rounded: 'xl'`, `border: true`, `elevation: 'md'` | Tuiles bento. |
| `origam-chip` | `pill`, `border`, `fontFamily: 'mono'`, `textTransform: 'uppercase'` | Pastilles de statut. |
| `origam-title` | `fontWeight: 'semibold'`, `letterSpacing: 'tight'`, `lineHeight: 'none'` | Titres XXL. |
| `origam-tabs` | `variant: 'pills'`, `rounded: 'full'` | Onglets en pilules. |
| `origam-avatar` | `rounded: 'full'`, `size: 'x-large'` | En-tête de la fiche joueur. |
| `origam-text-field` / `origam-select` | `variant: 'solo'`, `rounded: 'full'` | Champs en pilule. |

`elevation` passe par l'échelle `shadow` : liseré intérieur plus ombre profonde de `xs` à `lg`, et halo lumineux pour `xl` (survol du CTA).

**Seul escape hatch : `cssVars['--origam-card---backdrop-filter']`.** Aucune prop n'exprime le flou d'arrière-plan d'une carte. Le token de composant existe bien dans les sources 2.37.3.

**Tokens ajoutés** (le DS accepte tout arbre sémantique) :
- `color.glow.{a,b,c}`, pour les halos ;
- `motion.duration.drift` (24 s), pour leur dérive ;
- `spacing.11` (44 px), la cible tactile minimale.

## Mouvement (CSS seul, coupé sous `prefers-reduced-motion`)

- **Halos du hero et de la fiche** : `@keyframes drift` sur `transform`, 24 s en aller-retour.
- **Titre** : les trois mots montent du flou, décalés de 120 ms.
- **Anneau de l'avatar** : `conic-gradient` qui tourne via `@property --angle`. La bordure de la tuile « Édition en cours » reste **fixe** : aucun effet « live » (décision E-f).
- **Tuiles** : entrée en cascade, de 60 en 60 ms, puis survol avec élévation `lg`.
- **Bandeau des règles d'or** : `marquee` de 60 s. Sous reduced-motion, il redevient une liste statique qui passe à la ligne et la copie de boucle est masquée.
- **Barres du parcours et jauge du ratio** : croissance en `scaleY` / `scaleX`.

## Contrastes

Scan automatique de chaque nœud texte rendu (Playwright, fond effectif recomposé), 2 pages × 2 modes : **0 échec AA**. Les textes posés sur le dégradé du hero sont exclus du scan.

Valeurs clés :

| Paire | Ratio |
|---|---|
| texte `#eef0f5` sur `#07080b` | 17,56 |
| secondaire `#a1a7b3` sur verre (≈ `#111215`) | 7,75 |
| tertiaire `#8b91a0` sur verre (remplace `--faint` à 3,38) | 5,94 |
| encre `#07130a` sur `#c6ff3d` | 16,06 |
| encre `#07130a` sur `#3dffb5` | 14,61 |
| light : vert texte `#3f6b00` sur `#f3f4f7` | 5,76 |

## Limites et inconnues

- **Le verre a un coût.** Sur un mobile d'entrée de gamme, l'enchaînement `backdrop-filter`, halos floutés et animation continue est le plus coûteux des trois directions. Je ne l'ai pas mesuré sur appareil réel.
- Le texte en dégradé (`background-clip: text`) sur les chiffres n'est utilisé qu'en sombre. En clair, les chiffres repassent en encre pleine.
- Je ne sais pas si `OrigamCard` applique `--origam-card---backdrop-filter` sans autre condition (variant, flat). Le token existe, mais son déclencheur n'a pas été vérifié en rendu Vue.

# Direction B : Affiche

**Intention.** Le CCC traité comme une marque de sport de rue. Un grand aplat orange capsule, un titre condensé italique géant (Anton) et un « de » en pastille sticker. Le hero est un collage de cartes inclinées qui flottent (terrain bleu, bière noire, deux capsules jaunes). Une bande d'encre de travers fait défiler les règles d'or. Les tuiles bento ont chacune leur couleur et une légère inclinaison, comme des pages de magazine, et se redressent au survol. Mode clair par défaut, mode sombre en « nuit de stade ».

## Références (motionsites.ai, consulté le 2026-10-19)

| Référence | URL | Ce que j'en retiens |
|---|---|---|
| Stridr | https://motionsites.ai/?prompt=stridr | Aplat orange, collage de cartes photo inclinées, titre condensé italique géant au centre, pastille ronde « Enter ». |
| Slam Dunk | https://motionsites.ai/?prompt=slam-dunk-hero | Univers balle de sport, mot géant derrière l'objet, CTA plein orange. |
| Bold Studio | https://motionsites.ai/?prompt=bold-studio | Titre en capitales empilées, chiffres-preuves alignés en bas du hero (« 250+ / 95% / 10+ »). |

## Décisions UX intégrées (`docs/design/ux/decisions.md`)

- **Navigation et en-tête** : nav à 4 entrées (Éditions · Joueurs · Palmarès · Règles), sans avatar ni Connexion dans l'en-tête (A3, A5).
- **Pied de page** : un lien « Connexion » unique (E-d).
- **Recherche publique de joueurs** sur la fiche, `role="search"` (E-e).
- **Édition en cours** : uniquement des scores **validés**, libellés « Derniers scores validés ». Aucun point qui pulse, aucun clignotement, aucune bordure animée : rien ne doit faire croire à du temps réel (E-f).
- **Palmarès** : titres seulement, avec des onglets ACP, All Time et Évolution (E-b, E-c). La page n'est pas maquettée ici ; la tuile « Dernier champion » de l'accueil ne montre qu'un titre.

## Props d'abord (`theme.ts`)

| Composant | Props | Rendu |
|---|---|---|
| `origam-title` | `fontFamily: 'serif'`, `fontStyle: 'italic'`, `textTransform: 'uppercase'`, `lineHeight: 'none'` | Titres d'affiche. |
| `origam-btn` | `variant: 'flat'`, `rounded: 'full'`, `fontWeight: 'bold'`, `letterSpacing: 'wide'` | Boutons étiquette. |
| `variants['origam-btn'].outlined` | `border: 2`, `rounded: 'full'` | `outlined` redéfini **en props** (ADR-005), sans CSS. |
| `origam-card` | `rounded: 'lg'`, `border: false`, `elevation: 'md'` | Cartes magazine. La couleur de chaque tuile se donne au site d'appel par `bg-color` (primary, secondary, sticker). |
| `origam-chip` | `pill`, `fontWeight: 'bold'`, `textTransform: 'uppercase'` | Pastilles. |
| `origam-tabs` | `variant: 'underline'` | Onglets soulignés. |

Échelle `shadow` : ombres portées douces de `xs` à `lg` ; `xl` est un décalage net de 10 px à l'encre, ou à l'orange en sombre, pour le survol.

**Tokens ajoutés** : `color.sticker.yellow`, `motion.duration.marquee` (45 s), `spacing.11` (44 px).

## Mouvement (CSS seul, coupé sous `prefers-reduced-motion`)

- **Cartes du collage** : flottement en `translate` de 7 s, en aller-retour.
- **Titre** : les mots arrivent en « slam » (translate plus skew) avec un ressort léger (easing à dépassement).
- **Pastille CCC** : rotation continue.
- **Bandeau d'encre** : marquee de 45 s. Sous reduced-motion, il devient une liste statique.
- **Tuiles** : se redressent et se soulèvent au survol, avec ombre `xl`.

## Contrastes

Scan automatique, 2 pages × 2 modes : **0 échec AA**.

| Paire | Ratio |
|---|---|
| encre `#120a05` sur orange `#ff5a1f` | 6,29 |
| encre sur crème `#f4efe8` | 17,14 |
| blanc sur bleu `#2b4bff` | 5,91 |
| encre sur jaune `#ffd23f` | 13,57 |
| orange texte `#b83a0a` sur crème | 5,03 |
| dark : crème sur `#1d1612` | 15,61 |

L'orange `#ff5a1f` **n'est jamais une couleur de texte sur fond clair**. Il ne sert que de fond, sous de l'encre.

## Limites et inconnues

- **Slot de police détourné**, l'arbitrage reste ouvert : `fontFamily` n'accepte que `sans`, `serif` ou `mono`. Anton est donc rangé dans `serif`. Les options sont de l'accepter ou d'ajouter un slot `display` dans Origam.
- Les inclinaisons de tuiles (`rotate`) n'ont aucune prop Origam. Elles relèvent du CSS d'app, ou d'un token de composant que je n'ai pas trouvé. Sur mobile, elles sont annulées.
- C'est la direction la plus bruyante. Sur une page de 145 joueurs ou de 1 414 matchs, il faudra calmer les listes : le collage reste réservé aux en-têtes.

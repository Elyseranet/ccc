# Audit visuel — CCC (état au 2026-10-19)

Périmètre : rendu de l'app (`npm run dev` équivalent, `nuxt dev --port 3417`, aucun `.env` copié) en 1440 px et 390 px, plus lecture de `app/themes/ccc.theme.ts`, `app/assets/css/main.css`, `app/layouts/*.vue` et `app/pages/**/*.vue`. Origam installé : **2.22.0**. Sources comparées : `~/Projects/origam/packages/ds/src` en **2.37.3** (commit `8fc9fc929`).

Captures : faites avec Playwright (Chromium headless). Elles sont dans le scratchpad de session et ne sont pas versionnées. Les constats ci-dessous en reprennent ce qui est visible.

Les contrastes sont calculés avec la formule WCAG 2.x (luminance relative), sur les hex réels du thème.

---

## 1. Les sept problèmes qui pèsent le plus

| # | Constat | Où | Gravité |
|---|---|---|---|
| 1 | **Le CTA principal n'a pas de fond.** `origam-btn variant="flat"` (« Voir la compétition ») a un `background-color: rgba(0,0,0,0)` mesuré. Visuellement, l'action primaire est *moins* forte que l'action secondaire en `outlined`. La hiérarchie des actions est inversée. Cause exacte non vérifiée (thème × 2.22.0) : Je ne sais pas. | `pages/index.vue` hero, admin | Haute |
| 2 | **Tout est vert.** Le thème pose `'origam-btn': { color: 'primary' }` sur **tous** les boutons. Les liens de nav, de footer, d'« Explorer », de la sidebar admin et les CTA ont tous la couleur `#57f200`. L'accent ne signale plus rien : ni l'état actif, ni l'action principale. | `themes/ccc.theme.ts`, toutes les pages | Haute |
| 3 | **Texte « faint » sous le seuil AA.** `--faint` = `#626772` est utilisé pour du texte réel : la note de données (11 px), la note du footer (12 px), les mentions mono des cartes (9 px). Mesuré : **3,38:1** sur `#0e0f12` et **3,16:1** sur `#16171c`. Le seuil AA est 4,5:1. | `main.css`, `index.vue`, `competition.vue`, `default.vue` | Haute (a11y) |
| 4 | **Échelle typographique éclatée.** On compte **21 tailles en px** codées en dur dans les `.vue` : 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 19, 20, 21, 22, 23, 24, 25, 34, 36, 44 et 52 px. Il y a **9 occurrences** de 8–9 px, illisibles. Aucune ne passe par `typo.size`. La prop `font-size="5xl"` est posée sur `origam-title`, puis écrasée par la classe `.page-heading`. | toutes les pages | Haute |
| 5 | **Mobile cassé sur l'accueil.** Le H1 « CHAMPIONNAT » déborde à 390 px (« CHAMPIONN » visible). La nav est tronquée à droite sans indice de scroll. Le nom et l'avatar (« CF ») se chevauchent. | `index.vue`, `layouts/default.vue` | Haute |
| 6 | **Le CSS maison se bat contre Origam.** Plusieurs symptômes : les liens de nav sont collés en haut de la barre (le wrapper de `origam-btn` ignore `align-items`) ; les liens « Explorer » et « Accès rapide » sont centrés alors que le CSS demande `space-between` ; la sidebar admin s'arrête à 900 px au lieu de couvrir la hauteur ; la sidebar admin juxtapose des icônes carrées sans écart ; les onglets de compétition mélangent « Vue d'ensemble » en casse normale et « POULES » en capitales. | `layouts/*.vue`, `competition.vue`, `admin/index.vue` | Moyenne |
| 7 | **`origam-toolbar` est détourné** en conteneur générique d'en-tête de page : **20 usages**, dont des `<header>` de section. Le log dev affiche `prop "modelValue" has no effect on this component`. Les vrais conteneurs (`origam-card`, `origam-sheet`) et les composants métier (`origam-bracket`, `origam-data-table`, `origam-chip`, `origam-empty-state`, `origam-tabs`) sont absents. | toutes les pages | Moyenne |

---

## 2. Thème `ccc.theme.ts` face à la règle PROPS D'ABORD

- **Bloc `components` trop maigre.** Il ne contient que trois entrées (`origam-btn`, `origam-card`, `origam-avatar`). Le look réel vit dans le SCSS scoped de chaque page : `.surface`, `.eyebrow`, `.button`, `.page-heading`, `.archive-badge`, etc.
- **`color: 'primary'` global sur `origam-btn`** : c'est la cause du problème n°2. Un thème devrait laisser la couleur par défaut neutre et réserver `primary` aux appels explicites, ou à `variant: 'flat'` via `variants`.
- **Clé de typo hors contrat.** `vars.typo.size.cccHero` est déclarée, puis appelée par `font-size="cccHero"` dans `index.vue`. Or `TFontSize` n'accepte que `xs … 5xl` (`enums/Commons/typography`). La valeur sort du type de la prop.
- **Des groupes de tokens manquent.** Pas de `shadow`, de `spacing`, de `motion` ni de `color.feedback` dans le thème. Les couleurs de statut sont donc codées en dur dans `main.css` (`--positive: #74b892`, `--warning: #e2b65a`).
- **Pas de mode light.** C'est un choix acceptable, mais aucune décision n'est documentée.
- **Champ disponible en 2.37.3 et non exploité : `variants`** (ADR-005). Il redéfinit en props ce que signifie `outlined` ou `flat` pour un composant. C'est le bon endroit pour corriger le n°1 sans CSS.

---

## 3. Couleurs codées en dur et CSS mort

- **Hex et `rgba()` dans les `.vue`** : 24 occurrences réparties dans 8 fichiers, dont `index.vue` (6), `variants.vue` (4), `admin/index.vue` (3), `admin/[section].vue` (3) et `rules.vue` (3). Exemples : `background: #0a0b0d` (footer), `#111216` (bandeau chiffres), `rgba(87, 242, 0, .08)` (glow).
- **`main.css` re-déclare un second jeu de variables** (`--bg`, `--surface`, `--accent`, …) qui aliasent les `--origam-*` avec des hex de repli. On a donc deux systèmes en parallèle.
- **12 blocs `<style>` non scoped** posent des `:root { --xxx---yyy: … }`, par exemple `--public-shell---background` ou `--home-hero---glow`. **Aucune n'est consommée** : `grep var(--…)` renvoie 0 pour les 12. C'est du CSS mort.
- **Polices** chargées par `@import` Google Fonts dans `main.css`, alors que `typo.family` les déclare aussi : deux sources de vérité.

## 4. Contraste (mesuré)

| Paire | Ratio | Verdict |
|---|---|---|
| texte primaire `#e8eaee` / fond `#0e0f12` | 15,91 | OK |
| texte secondaire `#969ba5` / `#0e0f12` | 6,87 | OK |
| **texte faint `#626772` / `#0e0f12`** | **3,38** | **Échec AA texte** |
| **texte faint `#626772` / carte `#16171c`** | **3,16** | **Échec AA texte** |
| accent `#57f200` / carte `#16171c` | 12,02 | OK |
| encre `#08150a` / accent `#57f200` | 12,57 | OK |
| warning `#e2b65a` / `#0e0f12` | 10,11 | OK |

## 5. Ce qui fonctionne et mérite d'être gardé

- Le **contraste fort** du dark et le **vert capsule** forment une identité reconnaissable.
- Le duo **Archivo (display, serré) / JetBrains Mono (données)** a du caractère.
- Les **chiffres d'archives** (16 / 145 / 1 414) en grand sont un bon point d'ancrage.

## 6. Composants Origam 2.37.3 pertinents et inutilisés (vérifiés dans les sources)

| Besoin CCC | Composant | Props clés vérifiées |
|---|---|---|
| Arbre de phase finale | `origam-bracket` | `rounds`, `variant` (`single-elimination` / `double-elimination` / `round-robin`), `showScores`, `showSeed`, `showRoundTitles`, `interactive`, `direction`, statut de match `pending` / `live` / `completed` / `forfeited` |
| Classement de poule, liste des matchs | `origam-data-table` / `origam-table` | `density`, `hover`, `fixedHeader`, `caption`, `border`, `rounded` |
| Statuts (validé, à jouer, qualifié) | `origam-chip` | `size`, `pill`, `label`, `color`, `bgColor`, `border`, `textTransform`, `fontFamily`. **Pas de prop `variant`** dans `IChipProps` en 2.37.3, alors que le thème de référence du DS en pose une. |
| États vides / erreurs | `origam-empty-state` | `preset` (`no-data` / `no-results` / `error` / `offline` / `locked`), `size` (`sm` / `md` / `lg`), `align` |
| Onglets de l'édition | `origam-tabs` / `origam-tab` | `variant` (`default` / `pills` / `underline`), `density`, `color` |
| Cartes | `origam-card` | `rounded`, `border`, `elevation`, `density`, `title`, `subtitle` |
| Chiffres animés | `origam-counter`, `origam-number-format` | — |

---

## 7. Références visuelles (consigne utilisateur : motionsites.ai)

Source consultée le 2026-10-19 : https://motionsites.ai/. Le site est rendu en JavaScript ; je l'ai chargé dans Chromium (Playwright) et j'ai ouvert chaque fiche. C'est une bibliothèque de prompts de landing pages animées. **Les cartes ne mènent à aucun site réel**, seulement à une fiche `?prompt=<slug>` sur motionsites.ai. Les URLs ci-dessous sont donc celles des fiches.

| Référence | URL | Ce que j'en retiens | Direction |
|---|---|---|---|
| Stridr | https://motionsites.ai/?prompt=stridr | Aplat orange, collage de cartes photo inclinées, titre condensé italique géant | Affiche |
| Slam Dunk | https://motionsites.ai/?prompt=slam-dunk-hero | Objet de sport central, mot géant derrière, CTA plein | Affiche |
| Bold Studio | https://motionsites.ai/?prompt=bold-studio | Capitales empilées, rangée de chiffres-preuves sous le hero | Affiche |
| Liquid Glass Agency | https://motionsites.ai/?prompt=liquid-glass-agency | Sans géant ponctué de serif italique, verre, fond noir | Nocturne |
| Axle Journey | https://motionsites.ai/?prompt=axle-journey | Bento de panneaux de verre, un chiffre géant par panneau, nav en pilules | Nocturne, Grille |
| Peakline Redshift | https://motionsites.ai/?prompt=peakline-redshift | Un seul halo de couleur qui porte l'ambiance | Nocturne |
| NOX Grid | https://motionsites.ai/?prompt=nox-grid | Colonnes en pointillés visibles, vide, alignement strict | Grille |
| F1 Driver Profile | URL non relevée (carte suggérée sur la fiche Slam Dunk) | Fiche sportif : nom sur deux lignes, stats géantes | Grille (fiche joueur) |

Les traits communs à ces références, reportés dans les trois directions :
- une typographie d'affichage XXL (de 10 à 15 rem) ;
- des grilles bento où chaque tuile est une réponse ;
- un seul accent fort ;
- un mouvement d'ambiance lent (halo, marquee, flottement) ;
- des micro-interactions au survol (élévation, aplat qui monte, redressement).

Ce qui n'est **pas** transposé : la vidéo de fond et la 3D. Elles reposent sur des assets que le CCC n'a pas, et la règle projet n'autorise que des animations CSS.

## 8. Historique des directions

Le premier lot (Néon, Comptoir, Tableau) a été **remplacé** le 2026-10-19 sur consigne utilisateur (« nettement plus moderne et plus design ; une évolution timide n'est plus un bon candidat »). Les directions actuelles sont `directions/nocturne`, `directions/affiche` et `directions/grille`. Elles suivent les décisions UX (`docs/design/ux/decisions.md`) : nav à 4 entrées, pas d'avatar ni de connexion dans l'en-tête, accès organisateur en pied de page, fiche joueur. Les contenus suivent la Spec fonctionnelle : règles d'or RG25–RG32, scores de poule à 5, champs P5 de la fiche, aucune donnée de contact.

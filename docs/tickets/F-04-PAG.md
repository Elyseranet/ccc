# F-04-PAG — Remédiation : écart visuel de origam-pagination (liste des joueurs)

- **Statut** : Ouvert (2026-10-22). Ticket de remédiation de la dérogation F-04-PAG (`docs/design/ux/decisions.md`).
- **Contexte** : F-04 abandonne le pager maison au profit de `origam-pagination`. D'après la mesure de dev-f04 sur la v3, l'écart avec la maquette est de 7,36 % sur une zone et de 66,8 % sur l'autre, au-dessus du seuil de 1 %.
- **À faire** :
  1. remesurer sur la branche F-04 intégrée et lister précisément les écarts ;
  2. écrire la fiche Origam et la déposer (`docs/tickets/origam/`) ;
  3. corriger par thème (props d'abord) ce qui peut l'être ;
  4. lever la dérogation (masque ou seuil) quand Origam est corrigé, puis fermer.

## Remesure sur la branche F-04 (base develop fd76ba2, dev-f04)

Zone `joueurs-pagination` du test visuel (`tests/e2e/visual/F-04.spec.ts`), seuil de 1 %, `origam-pagination` utilisé, compteur « 1–20 sur 146 » posé par CCC à côté :

| Configuration | 1440 px | 390 px |
|---|---|---|
| thème d'avant (`density: 'compact'`), sans règle CCC | 3,750 % (2 059 / 54 912 px) | 44,483 % (19 747 / 44 392 px, 358×76 contre 358×124) |
| thème CCC (`density: 'default'`, `size: 'large'`, `color` + `bgColor` `primary`, jetons) + règles `main.css` | 0,000 % (0 / 54 912 px) | 0,000 % (0 / 44 392 px) |

Écarts de la première ligne (1440 px) : boutons 36×36 px (maquette 44×44), pas de 44 px (maquette 48 px), chevrons précédent / suivant (absents de la maquette), page courante sans fond ambre lisible, texte 16 px crème (maquette 12,8 px `text.secondary`) ; à 390 px la liste ne passe pas à la ligne.

Ces chiffres diffèrent de ceux du ticket (7,36 % et 66,8 %, mesurés sur la v3 avant F-00r, qui change la hauteur des boutons) : ils sont remesurés sur fd76ba2. `origam-pagination` avec `withInfo` ne convient pas (il remplace la liste par la seule page courante) : le compteur est un `<span>` de CCC.

## État

- Point 1 (remesure) : fait, voir ci-dessus.
- Point 2 (fiche Origam) : `docs/tickets/origam/pagination-pas-de-controle-sans-theme.md` (le numéro du ticket Origam reste à renseigner).
- Point 3 (correction par thème) : fait pour `density`, `size`, `color` / `bgColor`, jetons existants. Le reste est dans `main.css` (règles à trois classes) faute de prop ou de jeton : précédent / suivant, retour à la ligne, taille du texte, pages inactives.
- Point 4 : **aucune dérogation de seuil n'est posée** dans le test visuel, la zone passe à 0,000 % aux deux largeurs. Il reste à retirer les règles `main.css` quand Origam livre les props et jetons de la fiche, puis à fermer.

## Point 2026-10-28 (chef de projet) — **laissé ouvert**
- F-04 est mergé @ `ebf3e94`. La zone de pagination est à 0,000 / 0,000 % grâce au thème et à 6 règles `main.css`, dont un `!important` justifié par la mesure. Aucune dérogation de seuil n'a été posée.
- Fiche Origam déposée : **#1278**.
- **Reste** : retirer les règles `main.css` quand Origam livrera les props et jetons. C'est la condition de fermeture.

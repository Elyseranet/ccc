# Audit des espacements contre la maquette (F-64)

Généré par `npm run audit:spacing` (`packages/web/tests/e2e/audit/spacing-mockup.audit.ts`) le 2026-11-18.
Écart vertical entre deux blocs correspondants consécutifs (ancres de texte uniques des deux côtés), application − maquette ; signalé au-delà de 4 px. Largeurs : 1440, 390. Méthode et limites : en tête du script.

Écarts comparés : 303 par ancres de texte, 66 par repères manuels. Différences > 4 px : **0** (application plus serrée : 0 ; plus lâche : 0).

## Couverture par écran

| écran | largeur | ancres app | ancres maquette | correspondantes | écarts comparés (ancres) | écarts comparés (repères) | signalés |
|---|---|---|---|---|---|---|---|
| accueil | 1440 | 62 | 54 | 19 | 3 | 0 | 0 |
| palmares | 1440 | 942 | 203 | 18 | 3 | 0 | 0 |
| edition | 1440 | 64 | 62 | 17 | 0 | 0 | 0 |
| joueurs | 1440 | 145 | 164 | 14 | 1 | 0 | 0 |
| joueur | 1440 | 116 | 105 | 12 | 0 | 6 | 0 |
| face-a-face | 1440 | 69 | 70 | 11 | 0 | 8 | 0 |
| regles | 1440 | 47 | 52 | 30 | 6 | 0 | 0 |
| connexion | 1440 | 9 | 10 | 9 | 4 | 0 | 0 |
| invitation | 1440 | 13 | 17 | 13 | 10 | 0 | 0 |
| profil | 1440 | 24 | 23 | 14 | 2 | 0 | 0 |
| mentions-legales | 1440 | 38 | 37 | 16 | 1 | 0 | 0 |
| confidentialite | 1440 | 82 | 81 | 53 | 13 | 0 | 0 |
| cgu | 1440 | 47 | 46 | 14 | 1 | 0 | 0 |
| accessibilite | 1440 | 36 | 35 | 21 | 11 | 0 | 0 |
| erreur-404 | 1440 | 4 | 4 | 4 | 1 | 0 | 0 |
| admin | 1440 | 38 | 39 | 19 | 10 | 0 | 0 |
| admin-matchs | 1440 | 191 | 81 | 9 | 1 | 0 | 0 |
| admin-participants | 1440 | 54 | 89 | 5 | 0 | 6 | 0 |
| admin-tirages | 1440 | 9 | 222 | 6 | 1 | 2 | 0 |
| admin-qualification | 1440 | 218 | 103 | 24 | 5 | 3 | 0 |
| admin-tirage-tour | 1440 | 8 | 106 | 4 | 1 | 3 | 0 |
| admin-cloture | 1440 | 27 | 56 | 13 | 6 | 3 | 0 |
| admin-plus | 1440 | 12 | 11 | 5 | 1 | 0 | 0 |
| admin-editions | 1440 | 134 | 143 | 8 | 0 | 2 | 0 |
| admin-edition-nouvelle | 1440 | 14 | 16 | 12 | 3 | 0 | 0 |
| admin-edition-2026 | 1440 | 20 | 29 | 13 | 1 | 0 | 0 |
| admin-edition-2025 | 1440 | 21 | 22 | 13 | 2 | 0 | 0 |
| admin-competiteur | 1440 | 91 | 103 | 14 | 5 | 0 | 0 |
| accueil | 390 | 58 | 50 | 19 | 11 | 0 | 0 |
| palmares | 390 | 942 | 203 | 18 | 7 | 0 | 0 |
| edition | 390 | 64 | 62 | 17 | 6 | 0 | 0 |
| joueurs | 390 | 145 | 164 | 14 | 6 | 0 | 0 |
| joueur | 390 | 112 | 101 | 12 | 2 | 6 | 0 |
| face-a-face | 390 | 69 | 70 | 11 | 0 | 8 | 0 |
| regles | 390 | 47 | 52 | 30 | 10 | 0 | 0 |
| connexion | 390 | 9 | 10 | 9 | 7 | 0 | 0 |
| invitation | 390 | 13 | 17 | 13 | 11 | 0 | 0 |
| profil | 390 | 24 | 23 | 14 | 7 | 0 | 0 |
| mentions-legales | 390 | 32 | 31 | 22 | 13 | 0 | 0 |
| confidentialite | 390 | 74 | 73 | 59 | 23 | 0 | 0 |
| cgu | 390 | 35 | 34 | 26 | 18 | 0 | 0 |
| accessibilite | 390 | 31 | 30 | 26 | 23 | 0 | 0 |
| erreur-404 | 390 | 4 | 4 | 4 | 3 | 0 | 0 |
| admin | 390 | 38 | 39 | 19 | 13 | 0 | 0 |
| admin-matchs | 390 | 191 | 81 | 9 | 2 | 0 | 0 |
| admin-participants | 390 | 54 | 89 | 5 | 0 | 6 | 0 |
| admin-tirages | 390 | 9 | 222 | 6 | 2 | 2 | 0 |
| admin-qualification | 390 | 218 | 103 | 24 | 11 | 3 | 0 |
| admin-tirage-tour | 390 | 8 | 106 | 4 | 2 | 3 | 0 |
| admin-cloture | 390 | 27 | 56 | 13 | 6 | 3 | 0 |
| admin-plus | 390 | 12 | 11 | 5 | 2 | 0 | 0 |
| admin-editions | 390 | 134 | 143 | 8 | 1 | 2 | 0 |
| admin-edition-nouvelle | 390 | 14 | 16 | 12 | 8 | 0 | 0 |
| admin-edition-2026 | 390 | 20 | 29 | 13 | 6 | 0 | 0 |
| admin-edition-2025 | 390 | 21 | 22 | 13 | 5 | 0 | 0 |
| admin-competiteur | 390 | 91 | 103 | 14 | 6 | 0 | 0 |

## Par composant (cause)

| composant de l'application | cas |
|---|---|

## Détail

| écran | largeur | bloc A | bloc B | maquette (px) | app (px) | Δ (px) | composant | sélecteur A | sélecteur B |
|---|---|---|---|---|---|---|---|---|---|

## Corrections F-64 (annotation manuelle, perdue si le fichier est régénéré)

Avant : 3 écarts par ancres de texte (`F-64-espacements-maquette-avant.md`), et 6 de plus trouvés par les repères manuels ajoutés pour les écrans peu couverts. Après : 0. La maquette tranche pour chacun, sans arbitrage.

| cause | écran | avant | maquette | correction |
|---|---|---|---|---|
| A | fiche compétiteur, carte identité (en-tête → photo → formulaire) | 20 px (régression F-63) | 0 px (`.cp-form`) | `gap` retiré de `.identity-form`. Les deux paires reviennent à 0 px : elles sont listées dans la règle `maquette` de l'audit F-63 (`SPACING_AUDIT_MOCKUP_ZERO`, source citée), sinon le seuil de 4 px les signalerait |
| B | /regles, étapes → note | 40 px | 20 px (`.rules-note`) | `.rules-game__play` groupe les étapes et la note, avec un gap de 20 px ; 40 px entre les autres sections |
| C | qualification, tirage de tour, clôture : étapes de phase → en-tête | 36 px (marge 16 + gap 20 de la page) | 16 px (`.ostep--phase`) | marge basse de `PhaseSteps` = 16 − 20 px (le composant n'est affiché que dans ces trois grilles) |

Repères manuels (66 écarts comparés) : face-à-face, participants admin, liste des éditions admin, fiche joueur, tirages (en-tête seul : la base de test n'a pas de brouillon), tirage de tour, qualification et clôture (étapes + en-tête). Liste dans `spacing-mockup.const.ts` (`pairs`).

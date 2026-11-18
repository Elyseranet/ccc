# Audit des espacements contre la maquette (F-64)

Généré par `npm run audit:spacing` (`packages/web/tests/e2e/audit/spacing-mockup.audit.ts`) le 2026-11-18.
Écart vertical entre deux blocs correspondants consécutifs (ancres de texte uniques des deux côtés), application − maquette ; signalé au-delà de 4 px. Largeurs : 1440, 390. Méthode et limites : en tête du script.

Écarts comparés : 303. Différences > 4 px : **3** (application plus serrée : 0 ; plus lâche : 3).

## Couverture par écran

| écran | largeur | ancres app | ancres maquette | correspondantes | écarts comparés | signalés |
|---|---|---|---|---|---|---|
| accueil | 1440 | 62 | 54 | 19 | 3 | 0 |
| palmares | 1440 | 942 | 203 | 18 | 3 | 0 |
| edition | 1440 | 64 | 62 | 17 | 0 | 0 |
| joueurs | 1440 | 145 | 164 | 14 | 1 | 0 |
| joueur | 1440 | 116 | 105 | 12 | 0 | 0 |
| face-a-face | 1440 | 69 | 70 | 11 | 0 | 0 |
| regles | 1440 | 47 | 52 | 30 | 6 | 0 |
| connexion | 1440 | 9 | 10 | 9 | 4 | 0 |
| invitation | 1440 | 13 | 17 | 13 | 10 | 0 |
| profil | 1440 | 24 | 23 | 14 | 2 | 0 |
| mentions-legales | 1440 | 38 | 37 | 16 | 1 | 0 |
| confidentialite | 1440 | 82 | 81 | 53 | 13 | 0 |
| cgu | 1440 | 47 | 46 | 14 | 1 | 0 |
| accessibilite | 1440 | 36 | 35 | 21 | 11 | 0 |
| erreur-404 | 1440 | 4 | 4 | 4 | 1 | 0 |
| admin | 1440 | 38 | 39 | 19 | 10 | 0 |
| admin-matchs | 1440 | 191 | 81 | 9 | 1 | 0 |
| admin-participants | 1440 | 54 | 89 | 5 | 0 | 0 |
| admin-tirages | 1440 | 9 | 222 | 6 | 1 | 0 |
| admin-qualification | 1440 | 218 | 103 | 24 | 5 | 0 |
| admin-tirage-tour | 1440 | 8 | 106 | 4 | 1 | 0 |
| admin-cloture | 1440 | 27 | 56 | 13 | 6 | 0 |
| admin-plus | 1440 | 12 | 11 | 5 | 1 | 0 |
| admin-editions | 1440 | 134 | 143 | 8 | 0 | 0 |
| admin-edition-nouvelle | 1440 | 14 | 16 | 12 | 3 | 0 |
| admin-edition-2026 | 1440 | 20 | 29 | 13 | 1 | 0 |
| admin-edition-2025 | 1440 | 21 | 22 | 13 | 2 | 0 |
| admin-competiteur | 1440 | 91 | 103 | 14 | 5 | 1 |
| accueil | 390 | 58 | 50 | 19 | 11 | 0 |
| palmares | 390 | 942 | 203 | 18 | 7 | 0 |
| edition | 390 | 64 | 62 | 17 | 6 | 0 |
| joueurs | 390 | 145 | 164 | 14 | 6 | 0 |
| joueur | 390 | 112 | 101 | 12 | 2 | 0 |
| face-a-face | 390 | 69 | 70 | 11 | 0 | 0 |
| regles | 390 | 47 | 52 | 30 | 10 | 1 |
| connexion | 390 | 9 | 10 | 9 | 7 | 0 |
| invitation | 390 | 13 | 17 | 13 | 11 | 0 |
| profil | 390 | 24 | 23 | 14 | 7 | 0 |
| mentions-legales | 390 | 32 | 31 | 22 | 13 | 0 |
| confidentialite | 390 | 74 | 73 | 59 | 23 | 0 |
| cgu | 390 | 35 | 34 | 26 | 18 | 0 |
| accessibilite | 390 | 31 | 30 | 26 | 23 | 0 |
| erreur-404 | 390 | 4 | 4 | 4 | 3 | 0 |
| admin | 390 | 38 | 39 | 19 | 13 | 0 |
| admin-matchs | 390 | 191 | 81 | 9 | 2 | 0 |
| admin-participants | 390 | 54 | 89 | 5 | 0 | 0 |
| admin-tirages | 390 | 9 | 222 | 6 | 2 | 0 |
| admin-qualification | 390 | 218 | 103 | 24 | 11 | 0 |
| admin-tirage-tour | 390 | 8 | 106 | 4 | 2 | 0 |
| admin-cloture | 390 | 27 | 56 | 13 | 6 | 0 |
| admin-plus | 390 | 12 | 11 | 5 | 2 | 0 |
| admin-editions | 390 | 134 | 143 | 8 | 1 | 0 |
| admin-edition-nouvelle | 390 | 14 | 16 | 12 | 8 | 0 |
| admin-edition-2026 | 390 | 20 | 29 | 13 | 6 | 0 |
| admin-edition-2025 | 390 | 21 | 22 | 13 | 5 | 0 |
| admin-competiteur | 390 | 91 | 103 | 14 | 6 | 1 |

## Par composant (cause)

| composant de l'application | cas |
|---|---|
| identity-form | 2 |
| rules-game | 1 |

## Détail

| écran | largeur | bloc A | bloc B | maquette (px) | app (px) | Δ (px) | composant | sélecteur A | sélecteur B |
|---|---|---|---|---|---|---|---|---|---|
| admin-competiteur | 1440 | sans photo, l’avatar affiche les initiales. « supprimer la photo » ramène aux in | nom affiché * | 21.8 | 41.8 | +20 | identity-form | `p.competitor-photo__hint` | `label.origam-label.identity-form__label` |
| regles | 390 | si l’adversaire touche lui aussi, personne ne marque. | le bûcheron ne compte pas : toucher la bière et faire tomber la capsule posée de | 71.8 | 91.8 | +20 | rules-game | `p.rules-game__step-text` | `p.rules-game__note-text` |
| admin-competiteur | 390 | sans photo, l’avatar affiche les initiales. « supprimer la photo » ramène aux in | nom affiché * | 21.8 | 41.8 | +20 | identity-form | `p.competitor-photo__hint` | `label.origam-label.identity-form__label` |

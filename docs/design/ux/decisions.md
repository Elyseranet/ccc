# Décisions utilisateur — arbitrages UX (2026-10-19)

Source : arbitrages A1–A7 de `audit.md`, tranchés par l'utilisateur via le chef de projet.

| # | Sujet | Décision |
|---|---|---|
| A1 | Admin « Scores » | Fusionné dans « Poules et matchs » (filtres à traiter / saisis / validés), redirection `/admin/scores`. |
| A2 | Variantes | Section de « Règles », redirection `/variants`. |
| A3 | Accès organisateur | Lien discret en pied de page ; « Espace organisateur » en en-tête seulement si connecté. Plus d'avatar factice. |
| A4 | Palmarès | Libellé « Palmarès », route `/palmares`, redirection `/hall-of-fame`. |
| A5 | Nav publique | 4 entrées : Éditions · Joueurs · Palmarès · Règles. Face-à-face = action de Joueurs et des fiches. |
| A6 | Fiche joueur | Oui, route dédiée `/joueurs/<id>`. |
| A7 | Admin mobile | La saisie de score se fait sur téléphone : barre d'onglets en bas (4 entrées). |

## Écarts spec ↔ prototype (2026-10-19, après lecture des specs Obsidian)

| # | Sujet | Décision |
|---|---|---|
| E-a | Validation du score par le second joueur | Retirée — contraire à la spec (« Droits » : saisir et valider un score = administrateur seul). Pas d'arbitrage, correction. |
| E-b | Catégories du palmarès | Spec seule : titres (RG6). Les 5 catégories du prototype (finales, participations, victoires, ratio, plus longue série) sont hors périmètre tant qu'aucune règle n'est écrite. |
| E-c | Classements ACP / All Time / évolution (RG4, RG8) | Onglets du Palmarès. Nav publique reste à 4 entrées. |
| E-d | Connexion participant | Lien « Connexion » unique en pied de page ; une fois connecté, l'en-tête affiche « Mon profil » (participant) ou « Espace organisateur » (administrateur). Complète A3. |
| E-e | Recherche publique de joueurs | `GET /competiteurs?q=` devient **public** (lecture, champs publics uniquement, limite de débit). Spec API amendée. |
| E-f | Édition en cours côté public | Visible au fil de l'eau : les résultats **validés** apparaissent au rechargement ; pas de diffusion live ; jamais de score non validé. Spec API amendée. |
| E-g | Cuillère de bois (RG38) | Non affichée tant que l'utilisateur n'a pas choisi entre option A et option B. |

## Direction visuelle — 2e itération rejetée (2026-10-19)

- Les directions Néon/Comptoir/Tableau puis Nocturne/Affiche/Grille sont **rejetées** : pas assez ambitieuses, mauvais univers, mauvaises références, finition insuffisante.
- **Univers retenu** : festif / culture bière (soirée, bar, capsules, mousse, couleurs vives, fun et décalé).
- **Règle animations assouplie sur le site public** : vidéo de fond, WebGL/3D léger ou librairie d'animation autorisés sur les pages vitrines publiques (accueil, palmarès…). Écrans denses (édition, joueurs, classements) et admin restent CSS uniquement. Tout est coupé sous `prefers-reduced-motion: reduce`. Exception portée par `CLAUDE.md` du projet.

## Direction visuelle retenue (2026-10-20)

- **Piste A — Happy Hour** (moodboard `docs/design/ui/moodboard/index.html`) : nuit violette, néon rose, ambre bière, mousse ; Bagel Fat One (display) + Gabarito (texte courant, remplace DM Sans — validé par l'utilisateur le 2026-10-20 avec le bandeau statique et l'échelle typo 1,25).
- **Police display** : appliquée via une **classe CSS locale** dans CCC, hors props Origam (choix utilisateur ; Origam ne propose que `sans`/`serif`/`mono`). Exception documentée à la règle PROPS-FIRST, limitée à la famille de police des titres display. Évolution demandée sur Origam : Elyseranet/origam#1212 (slot `display`) — à la release, migrer la classe locale vers `fontFamily: 'display'`.

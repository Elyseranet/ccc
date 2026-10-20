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

## Arbitrages back (2026-10-20) — cf. `docs/tickets/BOARD.md`

| # | Décision |
|---|---|
| A1 | Le serveur **enregistre le tirage physique** (brouillon à chaque affectation) ; +2 routes Spec API (têtes de série, affectations). |
| A2 | **Session serveur en base + cookie httpOnly**. |
| A3 | **SMTP générique (nodemailer)**, Mailpit en dev ; fournisseur de prod à choisir plus tard. |
| A4 | Participant modifie **avatar, téléphone, mot de passe** ; pseudo réservé à l'admin. |
| A5 | Orphelins : **tableau nom par nom décidé par l'utilisateur** (`legacy-identity-map`, 4 paires ST pré-remplies). |
| A6 | 2012a/2012b : **N = 16** conservé ; « 5 participants non identifiés ». |
| A7 | 2017 : **5,76 conservé** (valeur source), écart signalé dans le rapport de reprise. |
| A8 | ACP = 5 dernières éditions **clôturées**. |
| A9 | Tour avant les huitièmes = **« Barrages »**. |
| A10 | Poule : **victoires → cap's average → confrontation directe** ; entre poules inégales : ratio de victoires puis cap's average par match. |
| A11 | « 1v1v1 en 3 » = **match à 3 côtés, premier à 3 points**. |
| A12 | Cotes : **hors produit** pour l'instant. |
| A13 | Commentaires de match : importés, **visibles admin uniquement**. |
| A14 | Invitation valable **7 jours**, renvoi par l'admin (invalide l'ancien lien). |
| A15 | Correction : **`POST /matchs/{id}/correction`** journalisée, 409 si tour suivant engagé. |
| A16 | Les 685 gabarits vides **ne sont pas importés** : 729 matchs réels, dont 554 avec score. Le chiffre public « 1 414 matchs » est **faux** et doit être remplacé. |

## Arbitrages front (2026-10-20) — cf. `docs/tickets/BOARD.md`

| # | Décision |
|---|---|
| FA-01b | Les 4 écrans sans maquette (face-à-face, règles, admin participants, compte) sont **maquettés en HH avant intégration** (conséquence de la règle iso-visuel). |
| FA-02 | Interfaces/enums du contrat d'API dans **`shared/interfaces/api/` et `shared/enums/`** (alias `#shared`). Exception documentée dans `CLAUDE.md` du projet. |
| FA-04 | Comparaison visuelle : **mesurer l'écart sur l'en-tête de F-00, puis fixer un seuil** soumis à l'utilisateur avant application. |
| FA-05 | Écran admin « Poules et matchs » : **`/admin/matchs`**. |
| FA-06 | Page profil participant : **`/profil`**. |
| FA-07 | Outillage de test ajouté (Vitest, @nuxt/test-utils, @vue/test-utils, Playwright, axe-core, vue-tsc, @pinia/nuxt), sous réserve `npm ls axios` vide et `npm audit` sans high/critical. |
| FA-08 | Entrée « Plus » de la barre basse admin : **à maquetter** par l'UI. |
| FA-09 | **Tirages admin maquetté et ticketé maintenant** ; Bracket, Compétiteurs, Éditions **masqués** de la nav admin jusqu'à leur ticket. |
| FA-10 | Ordre des onglets d'édition : **celui de la maquette**. |
| FA-11 | Bracket : slot `connector` vide ; ticket Origam seulement si la mesure de F-03 montre un artefact. |
| FA-12 | **Pas de ratio** sur la fiche joueur (spec : joués / V / D). Ratio uniquement dans le face-à-face (RG37). |
| A17 | « Activité récente » admin : **flux dérivé** des validations de match et de tirage, sans table d'audit. |
| A5 | Orphelins : lignes 1–12 **fusionnées** avec leur candidat, ligne 13 « Marion Cobra » **créée** (cf. `docs/tickets/legacy-identity-map.md`). |

## Arbitrages livraison et règles (2026-10-20)

| # | Décision |
|---|---|
| AUDIT-1 | `npm audit` : 12 high + 2 critical, tous dans la chaîne Nuxt 4.6.1 (devtools, simple-git, nitropack/listhen/node-forge, braces/micromatch), préexistants sur `develop` ; `--omit=dev` = 0. **Waiver documenté** dans chaque PR/merge + ticket de remédiation (suivre les correctifs Nuxt, vérifier le bundle `.output`, pas de devtools en prod). Pas de downgrade. |
| A16-label | Tuile accueil : **« 729 matchs joués depuis 2012, dont 554 avec score »**. |
| R-1 | Départage à 4 joueurs ou plus : **un seul match à N côtés, premier à 3 points** (généralise A11). |
| R-2 | Départage à 3 : les deux perdants sont **ex aequo**, non classés entre eux. |
| R-3 | « Tour suivant engagé » (B-12) : poule → qualification arrêtée ; phase finale → tirage (même brouillon) existant pour le tour suivant. Correction refusée (409) dans ces cas. |
| R-4 | Commentaires d'édition (en-têtes du classeur) : **admin uniquement**, comme A13. |

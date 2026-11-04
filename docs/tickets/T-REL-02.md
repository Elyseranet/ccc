# T-REL-02 — Livrer les pages des tickets fermés : accueil, joueurs, fiche joueur, face-à-face

- **Statut** : **Fermé** (2026-11-04), mergé dans `develop` @ `ba92d1a` ; voir « Fermeture ».
- **Pilote** : `frontend-lead`.
- **Origine** : préparation de l'environnement de dev (T-OPS-04). Sur `develop` (975c617), `src/consts/page-delivery.const.ts` ne marque `delivered: true` que `ROUTES.EDITION` et `ROUTES.ADMIN_MORE`. Les pages des tickets mergés et fermés F-01 (accueil), F-04 (joueurs, fiche joueur) et F-05 (face-à-face) répondent donc 404 dans l'image de production (garde OPS-3). Le commentaire de `page-delivery.const.ts` prévoit pourtant que le ticket d'écran passe sa ligne à `true` quand l'écran est branché sur l'API réelle. Je ne sais pas si l'absence de bascule était un oubli ou un choix : aucun ticket ne le dit.

## Périmètre
1. Pour chacune de `ROUTES.HOME`, `ROUTES.PLAYERS`, `ROUTES.PLAYER` et `ROUTES.HEAD_TO_HEAD` :
   - vérifier que tous ses `endpoints` existent (aucun `pendingTicket`) et que la liste correspond aux appels réels de la page ;
   - passer `delivered: true`.
2. Les autres pages déjà mergées dont la ligne serait restée fausse (à vérifier, par exemple `ROUTES.EDITIONS`) : les lister, et les livrer seulement si leur ticket est fermé. Sinon, les signaler.
3. Mettre à jour `tests/e2e-release/page-delivery.spec.ts` (`DELIVERED_PAGES`).

## Critères d'acceptation
- [ ] `test:run` (dont `page-delivery.test.ts`) et typecheck verts.
- [ ] `test:release` vert, et preuve dans le conteneur : chaque page livrée répond 200, les pages non livrées répondent 404.
- [ ] Playwright complet vert ; il compte comme run mesuré de T-QA-06 si la charge est relevée.
- [ ] gitleaks propre ; `/security-review` sans high ni medium (une page livrée devient publique).

## Réalisation (dev-f06, 2026-11-04)

Endpoints vérifiés sur les appels réels de chaque page (composables et services), aucun n'a de `pendingTicket` dans `API_ROUTES` :

| Page | Appels réels | Ligne `PAGE_DELIVERY` |
|---|---|---|
| `/` (`ROUTES.HOME`) | `useHomeOverview` : `GET /stats`, `GET /editions`, `GET /editions/{id}`, `GET /editions/{id}/matchs`, `GET /classements/acp` | `EDITION_ROUNDS` retiré (jamais appelé) ; livrée |
| `/joueurs` (`PLAYERS`) | `usePlayerSearch` : `GET /competiteurs`, `GET /editions` ; `useArchiveStats` : `GET /stats` | inchangée ; livrée |
| `/joueurs/:id` (`PLAYER`) | `useCompetitor` : `GET /competiteurs/{id}` ; `useCompetitorOpponents` : `GET /competiteurs/{id}/face-a-face` | inchangée ; livrée |
| `/joueurs/face-a-face` (`HEAD_TO_HEAD`) | `useCompetitors` (recherche), `useCompetitor` (A et B), `useHeadToHead` : `GET /competiteurs/{id}/face-a-face?adversaire=` | inchangée ; livrée |

`EDITION_ROUNDS` n'est plus appelé par aucune page : il entre dans `ENDPOINTS_WITHOUT_PAGE` (ARCH-11 bis), avec la même raison que `EDITION_POOLS` et `EDITION_DRAWS` (données redondantes avec `GET /editions/{code}`).

Autres pages dont la ligne était restée fausse :
- `ROUTES.EDITIONS` (`/editions`, renvoi 302 vers l'édition en cours, A5) : F-03 fermé, `GET /editions` appelé, livrée.
- `ROUTES.RULES` (`/regles`) : F-06 fermé, aucun endpoint, livrée.
- `ROUTES.HALL_OF_FAME` : **non livrée**, F-02 n'est pas fermé (en cours, branche `feature/F-02-v2`).
- `ROUTES.LOGIN`, `INVITATION`, `PROFILE` (F-10) et `ADMIN_PARTICIPANTS` (F-09) : non touchées (consigne). `ROUTES.ADMIN`, `ADMIN_DRAWS` et `ADMIN_MATCHES` : non livrées, F-07, F-11 et F-08 ne sont pas fermés.

`tests/e2e-release/page-delivery.spec.ts` : `DELIVERED_PAGES` étendu aux six pages publiques et à `/editions/2025` ; chaque page livrée doit répondre 200 avec un `<h1>` (`/editions` : 302 vers `/editions/<code>`), les redirections dont la cible est livrée répondent 200, les autres restent en 404 ; le test des liens vérifie l'accueil (`/palmares`, `/connexion`, `/admin` absents).

### Preuve dans le conteneur (dev-f06, image construite sur 98d4931, base `ccc_f06_test` chargée par le seed)

- `docker build` : exit 0 ; migrations appliquées au démarrage (`migrations_up_to_date`), `/api/v1/health` 200.
- Sans session : `/` 200, `/editions` 302 vers `/editions/2026`, `/editions/2025` 200, `/joueurs` 200, `/joueurs/b20dfa9e-222d-46cf-a229-8fd77cc2edca` 200, `/joueurs/face-a-face` 200, `/regles` 200 (titres `Championnat de Caps`, `Joueurs`, `Règles`).
- `/admin/plus` : sans session 302 vers `/connexion` ; avec la session admin 200.
- Non livrées : `/palmares`, `/connexion`, `/profil`, `/invitation/jeton-de-test`, `/admin`, `/admin/matchs`, `/admin/participants`, `/admin/tirages` : 404 ; `/hall-of-fame` et `/admin/scores` : 301 puis 404.
- e2e-release contre le conteneur (`E2E_BASE_URL`, `E2E_ADMIN_SESSION`) : 30 passed ; un test de F-03 périmé (« l'index des éditions, non livré, reste en 404 ») échouait, il est retiré (couvert par le test du 302).
- **Constat et décision (decisions.md ab1a6b4)** : l'accueil livré contenait trois liens vers `/palmares` (CTA du hero, tuile du champion, « voir le classement »), page non livrée : ils sont masqués tant que la page n'est pas livrée (`useHomeLinks` → `isPageAccessible`, même règle que la navigation ; visibles en dev et en test) et reviennent à la livraison de F-02. Aucune autre page livrée ne pointe vers une page non livrée.
- **Preuve dans le conteneur (image reconstruite sur le SHA final)** : mêmes codes qu'ci-dessus (pages livrées 200, `/editions` 302, non livrées 404), et l'accueil ne contient plus aucun `href="/palmares"`, `/connexion` ni `/admin`. e2e-release contre le conteneur : 39 passed (hors le test de la session admin, jeton non disponible ici ; prouvé sur 98d4931).
- **Mesure visuelle de l'accueil sans les liens** (`tests/e2e-release/home-sans-palmares.visual.spec.ts`, conteneur contre `index.html?sans-palmares`, 1440 / 390 px) : hero 0,489 / 0,784 % (le reste est le décor animé du verre et des capsules), tuile du champion 0,000 / 0,000 %, tuile du classement 0,000 / 0,000 % (338 px, 44 px de moins, aucun espace réservé), tuile des matchs 0,000 / 0,000 %, tuile du face-à-face 0,045 / 0,069 %.

## Fermeture — 2026-11-04 (chef de projet)
- `feature/T-REL-02` @ `2b3b93d` (dev-f06), mergé dans `develop` @ `ba92d1a`.
- **Pages livrées** : `/` (F-01), `/editions` (302 vers l'édition en cours, F-03), `/joueurs` et `/joueurs/:id` (F-04), `/joueurs/face-a-face` (F-05), `/regles` (F-06). Tous ces tickets sont fermés. `EDITION_ROUNDS` sort de la liste de l'accueil et entre dans `ENDPOINTS_WITHOUT_PAGE`, car aucune page ne l'appelle (vérifié par le frontend-lead).
- **Liens vers une page non livrée** (décision utilisateur ab1a6b4) : masqués par `useHomeLinks`, qui réutilise `isPageAccessible`. Le second bouton du haut de page et « voir le classement » disparaissent, et la tuile du champion n'est plus un lien.
- **Contrôles** :
  - dev-f06 : typecheck vert ; `test:run` 644 passés, 1 ignoré ; `test:release` 1/1 ; gitleaks propre ; preuve dans le conteneur : pages livrées en 200 (`/editions` en 302), pages non livrées en 404, aucun lien `/palmares`, `/connexion` ni `/admin` sur l'accueil ; visuel `?sans-palmares` contre le conteneur, toutes les zones sous 1 % (haut de page 0,489 / 0,784, résidu dû au décor animé ; autres zones de 0 à 0,069) ;
  - frontend-lead : merge-tree propre ; `test:run` 644 ; Playwright 239/239 (couvre F-01 après le refactor du helper) ; e2e-release avec session admin dans le conteneur : 40 passés ; revue de sécurité sans high ni medium (drapeaux de livraison et masquage de liens, aucune route ni donnée nouvelle, `ICompetitorPublic` sans email ni téléphone) ;
  - chef de projet, après le merge : typecheck vert ; `test:run` 71 fichiers passés, 1 ignoré ; 644 tests passés, 1 ignoré ; `test:release` 1/1.
- **Reste ailleurs** : `/palmares` (F-02), `/connexion`, `/invitation` et `/profil` (F-10), l'admin (F-07, F-08, F-09, F-11, F-13).

# T-REL-02 — Livrer les pages des tickets fermés : accueil, joueurs, fiche joueur, face-à-face

- **Statut** : À faire. Ouvert le 2026-11-04 par le chef de projet (décision utilisateur du 2026-11-04).
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

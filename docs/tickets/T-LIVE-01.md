# T-LIVE-01 — Première bascule vers l'API réelle : layout admin, déconnexion, garde OPS-3 en conditions réelles

- **Statut** : **Fermé** (2026-10-28), mergé dans `develop` @ `88da4af` ; voir « Fermeture ».
- **Origine** : F-12 (`/admin/plus`) ne consomme que `AUTH_LOGOUT`. Mais son layout admin consomme aussi `ME` et `EDITIONS`. Basculer ces endpoints en LIVE change toutes les pages d'un coup et casse les e2e et les mesures visuelles, qui reposent aujourd'hui sur les fixtures.
- **Dépend de** : B-04 et B-08, déjà mergés (vague 2, `124c85a`) ; F-12 mergé ; T-OPS-01 (garde OPS-3), mergé (`a72f3ac`).

## Périmètre
1. Un environnement e2e sur une **base de test seedée** (migrations, puis `db:seed:legacy` et `db:import:legacy`). Les variables passent en ligne de commande, jamais de `.env` dans un worktree.
2. Passage de `ME`, `EDITIONS` et `AUTH_LOGOUT` en `API_SOURCE.LIVE` dans `src/consts/api-sources.const.ts`.
3. `delivered: true` pour `/admin/plus` dans `src/consts/page-delivery.const.ts`.
4. Stratégie e2e et visuelle : les mesures pixel perfect restent sur fixtures (données de maquette), et les parcours LIVE tournent sur la base seedée. Les deux modes doivent coexister sans se casser.
5. Preuve de la garde OPS-3 en conditions réelles : `docker build`, puis l'image contre la base seedée. `/admin/plus` répond une fois authentifié, les pages non livrées répondent 404.

## Critères d'acceptation
- [x] `test:run`, `typecheck` et `test:release` verts ; e2e fixtures (routes, a11y, visuel) verts ; e2e LIVE verts sur base seedée.
- [x] `docker build` réussi, et la garde OPS-3 laisse passer `/admin/plus` (sortie réelle).
- [x] gitleaks propre, `npm ls axios` vide, revue de sécurité sans high ni medium.

## Point du 2026-10-22 (chef de projet) — ticket **ouvert**, partiellement réalisé par T-ARCH-01 (`52c54de`)
- **Fait** : les fixtures sont supprimées (ARCH-8). `ME`, `EDITIONS` et `AUTH_LOGOUT` appellent l'API réelle. Les e2e tournent sur une base de test chargée par `archives.sql`, avec des sessions réelles (ARCH-9). La garde OPS-3 prend une forme simple (`API_ROUTES` plus `page-delivery`).
- **Reste à faire** :
  - passer `/admin/plus` à `delivered: true` ;
  - prouver dans le conteneur que la page livrée répond une fois authentifié, et que les pages non livrées répondent 404.
- La notion de « bascule fixture vers live » n'existe plus : il ne reste que la livraison de la page.

## Fermeture — 2026-10-28 (chef de projet)
- `feature/T-LIVE-01` @ `7ef01ec` (8e135c8 + 7ef01ec), mergé dans `develop` @ `88da4af`. Seul changement de code : `delivered: true` pour `ROUTES.ADMIN_MORE` dans `page-delivery.const.ts`. Le reste est la suite `tests/e2e-release/page-delivery.spec.ts`, le test `page-delivery.test.ts` et le README.
- **Preuve dans le conteneur** (sorties réelles de dev-f06, image construite sur b03d0c9, base `ccc_f06_test` chargée par le seed) :
  - `docker build` : exit 0 ; le `test:release` du build est vert ;
  - `/admin/plus` sans session : `302` vers `/connexion` ; avec la session admin : **`200`** (`<title>Plus</title>`, `data-cy="admin-more-nav"`) ;
  - `/palmares`, `/admin`, `/regles`, `/` et `/editions` : `404` ;
  - e2e-release contre le conteneur : 29 passed avec la session. Sans session, le test **échoue**, avec un message explicite : plus d'ignorance silencieuse.
- **Contrôles** :
  - dev-f06 : Playwright complet 88 verts (sur 8e135c8) ;
  - frontend-lead sur 7ef01ec : typecheck 0 hors Origam, test:run 374, test:release 1/1, gitleaks propre ;
  - chef de projet après le merge : typecheck vert, test:run 387, test:release 1/1, `npm ls axios` vide.
- **Sécurité** : le diff de `src/` se limite à un booléen de livraison. La page reste derrière la session (302 sans session, prouvé dans le conteneur). Aucun high ni medium.
- **Reste ailleurs** : rien.

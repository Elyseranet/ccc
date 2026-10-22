# T-LIVE-01 — Première bascule vers l'API réelle : layout admin, déconnexion, garde OPS-3 en conditions réelles

- **Statut** : À faire. Ouvert le 2026-10-21 par le chef de projet, sur proposition du front-lead (revue de F-12).
- **Origine** : F-12 (`/admin/plus`) ne consomme que `AUTH_LOGOUT`. Mais son layout admin consomme aussi `ME` et `EDITIONS`. Basculer ces endpoints en LIVE change toutes les pages d'un coup et casse les e2e et les mesures visuelles, qui reposent aujourd'hui sur les fixtures.
- **Dépend de** : B-04 et B-08, déjà mergés (vague 2, `124c85a`) ; F-12 mergé ; T-OPS-01 (garde OPS-3), mergé (`a72f3ac`).

## Périmètre
1. Un environnement e2e sur une **base de test seedée** (migrations, puis `db:seed:legacy` et `db:import:legacy`). Les variables passent en ligne de commande, jamais de `.env` dans un worktree.
2. Passage de `ME`, `EDITIONS` et `AUTH_LOGOUT` en `API_SOURCE.LIVE` dans `src/consts/api-sources.const.ts`.
3. `delivered: true` pour `/admin/plus` dans `src/consts/page-delivery.const.ts`.
4. Stratégie e2e et visuelle : les mesures pixel perfect restent sur fixtures (données de maquette), et les parcours LIVE tournent sur la base seedée. Les deux modes doivent coexister sans se casser.
5. Preuve de la garde OPS-3 en conditions réelles : `docker build`, puis l'image contre la base seedée. `/admin/plus` répond une fois authentifié, les pages non livrées répondent 404.

## Critères d'acceptation
- [ ] `test:run`, `typecheck` et `test:release` verts ; e2e fixtures (routes, a11y, visuel) verts ; e2e LIVE verts sur base seedée.
- [ ] `docker build` réussi, et la garde OPS-3 laisse passer `/admin/plus` (sortie réelle).
- [ ] gitleaks propre, `npm ls axios` vide, revue de sécurité sans high ni medium.

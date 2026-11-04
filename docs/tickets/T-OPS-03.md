# T-OPS-03 — Contrôle de santé : version déployée et état des migrations

- **Statut** : À faire. Ouvert le 2026-11-04 par le chef de projet (demande et décision utilisateur du 2026-11-04).
- **Pilote** : `backend-lead`.
- **Origine** : l'utilisateur veut savoir, sur l'environnement de dev (T-OPS-04), quelle version du code il teste.

## Existant (vérifié le 2026-11-04)
- `GET /api/v1/health` (`src/server/api/v1/health.get.ts`) : 200 `{ status }` si `SELECT 1` répond, 503 sinon, sous limiteur de débit.
- `HEALTHCHECK` du `Dockerfile` : `curl -fsS http://127.0.0.1:${PORT}/api/v1/health`, toutes les 30 s.

## Périmètre
1. La réponse de `/api/v1/health` donne en plus :
   - la **version déployée** (SHA du commit), injectée au build de l'image (argument de build, puis `runtimeConfig`) ; aucune valeur codée en dur ;
   - l'**état des migrations** : à jour, ou nombre de migrations en attente.
2. Aucun secret ni détail de la base dans la réponse (pas d'hôte, d'utilisateur ni de message du pilote). La route reste publique et sous limiteur.
3. Interface dans `src/interfaces/`, statuts dans `src/enums/`.
4. README : section « Déploiement Coolify » mise à jour (champ de version, argument de build).

## Critères d'acceptation
- [ ] Tests unitaires et d'API : 200 avec version et migrations, 503 sans base, aucun champ sensible.
- [ ] Preuve Docker : l'image construite avec un SHA le renvoie sur `/api/v1/health`.
- [ ] `test:run`, `test:api`, typecheck, gitleaks verts ; `/security-review` sans high ni medium.

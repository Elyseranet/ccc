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

## Revue de sécurité (ab2cbea) : suites

- **L2, corrigé** : la lecture de la liste des migrations embarquées (`useStorage(...).getKeys()`) a son propre `try` (`resolveMigrationsHealth`). Si elle échoue, la sonde répond **200** avec `migrations: null` et un log structuré `health_migrations_unknown` (nom et code de l'erreur, jamais son message). Le 503 reste réservé à la base injoignable. Tests unitaires : stockage qui lève une erreur donne `null` sans toucher à la base ; une erreur de la base remonte.
- **L3 (LOW, non bloquant, non traité)** : deux requêtes par appel (`SELECT 1`, puis la lecture de la petite table `migrations`), sans entrée utilisateur. Coût négligeable à une sonde toutes les 30 s, et le limiteur passe en premier (`enforceRateLimit` est la première instruction de `health.get.ts`). Option : retirer le `SELECT 1`, puisque la lecture des migrations interroge déjà la base.
- **I4 (INFO, accepté)** : la version (SHA) et `pendingCount` deviennent publics, ce qui permet une empreinte. Accepté par conception : aucun nom de migration, aucune liste, aucun hôte ni utilisateur. Option : les réserver aux appels locaux.
- **I5 (INFO)** : `nitro.serverAssets` embarque le contenu des migrations dans `.output/server`, sans les servir en HTTP. Vérifié par le team-lead : seulement des noms de colonnes (`password_hash`, `token_hash`), aucun secret.
- **M1** : le délai de connexion et de requête de la base est hors de ce ticket, suivi par T-SEC-17.

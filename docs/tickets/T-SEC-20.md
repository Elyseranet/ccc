# T-SEC-20 — Purge planifiée des sessions expirées (durée maximale de conservation garantie)

- **Statut** : À faire. Ouvert le 2026-11-05 par `backend-lead` sur décision de l'utilisateur, relayée par le `project-manager`. But : pouvoir annoncer une durée maximale définie dans la politique de confidentialité (F-19).
- **Origine** : question F-19 sur l'audit de conformité du 2026-11-04 (`docs/audits/2026-11-04-conformite.md` §2, « sessions : 12 h + 24 h »).
- **Worktree** : `../CCC-T-SEC-20`, branche `feature/T-SEC-20-session-purge`, avec son propre `npm ci`.

## Constat (vérifié dans le code)

- Une session expire après **12 h** au maximum (`SESSION_ABSOLUTE_TIMEOUT_SECONDS`) ou après **2 h** d'inactivité (`SESSION_IDLE_TIMEOUT_SECONDS`), dans `src/consts/auth.const.ts:6-7`.
- `purgeExpiredSessions` (`src/utils/session-store.util.ts:72`) supprime les sessions expirées depuis plus de 24 h (`SESSION_PURGE_GRACE_MS`). Elle n'est appelée **qu'au login** (`src/server/api/v1/auth/login.post.ts:94`).
- Sans connexion, une ligne expirée reste donc en base **sans limite**. Une session révoquée par déconnexion garde son `expires_at` et suit la même règle.

## Correctif

1. Un plugin Nitro (`src/server/plugins/session-purge.ts`) appelle `purgeExpiredSessions` **au démarrage**, puis toutes les heures (`SESSION_PURGE_INTERVAL_MS = 60 * 60 * 1000` dans `auth.const.ts`). Le timer est `unref()`, pour ne pas retenir l'arrêt du processus, et il est arrêté au hook `close` de Nitro.
2. **Réutiliser `purgeExpiredSessions`** tel quel, sans seconde requête de purge. L'appel au login peut rester : la suppression est idempotente et sans danger entre plusieurs instances.
3. En cas d'erreur, un log structuré (`session_purge_failed`, sans message `pg` brut, cf. T-SEC-09), et le timer continue. En cas de succès, le nombre de lignes supprimées est logué (`session_purge_done`, `deleted`).
4. Les tests d'API et de base ne doivent pas lancer le timer en double. Il faut un drapeau de configuration, `NUXT_SESSION_PURGE_ENABLED`, vrai par défaut et coupé dans les tests si nécessaire, ou une autre solution justifiée.

## Durée maximale garantie (à reprendre dans la politique de confidentialité)

- **Une session est supprimée de la base au plus tard 25 h après son expiration** : 24 h de grâce plus 1 h d'intervalle de purge, **tant que le serveur tourne**. Comme la purge est relancée au démarrage, un arrêt ne prolonge la conservation que de la durée de l'arrêt.
- Une session expirant au plus tard 12 h après sa création, **aucune ligne de session ne survit plus de 37 h après la connexion qui l'a créée**, à cette même réserve près.
- Hors périmètre : les invitations expirées, les appareils (`login_devices`, 90 j) et les comptes inactifs n'ont pas de purge (audit §2). Il faut un ticket séparé si l'utilisateur veut des durées garanties pour ces données.

## Critères d'acceptation

- [ ] Test unitaire : le plugin appelle la purge au démarrage, puis à chaque intervalle (timers simulés), et s'arrête au `close`.
- [ ] Test d'API ou de base : une session expirée depuis plus de 24 h est supprimée sans qu'aucun login n'ait lieu. Une session expirée depuis moins de 24 h est conservée.
- [ ] Une erreur de base pendant la purge ne fait pas tomber le serveur. Elle est loguée sans message brut.
- [ ] README (variables) et `docs/api/auth.md` à jour, avec la durée garantie.
- [ ] typecheck, test:run, test:db, test:api (dans une fenêtre), gitleaks verts.

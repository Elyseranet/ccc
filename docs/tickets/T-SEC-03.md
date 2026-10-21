# T-SEC-03 — Constats LOW de la re-revue sécurité vague 1

- **Origine** : re-revue sécurité de `feature/integration-wave1` @ `57055e5` (2026-10-20), mergée dans `develop` @ `a188c52`. Non bloquant (0 critical/high/medium).
- **À traiter avec** : B-05 (première route publique soumise au limiteur).

1. `server/utils/http/rate-limit.util.ts:80` (+ `nuxt.config.ts:26`) : `maxKeys`, `windowMs` ou `maxRequests` à `NaN`, 0 ou négatif désactive le plafond (`size > NaN` est faux, l. 49). **Correctif** : valider au démarrage des entiers strictement positifs, échec explicite sinon.
2. `server/utils/http/api-error.util.ts:70` : en 4xx, `candidate.message` d'une erreur h3/tierce est repris tel quel. Pas de fuite avérée aujourd'hui. **Correctif** : n'accepter le message que si `data.code` est présent, sinon message par défaut du statut.
3. `server/utils/http/rate-limit.util.ts:49-54` : un grand nombre d'IPv4 distinctes peut évincer des compteurs légitimes (inhérent au LRU mémoire). **Correctif** : documenter la limite ; stockage partagé si déploiement multi-instance (lié à T-SEC-02).

- **Fermeture** : 1 et 2 corrigés et testés ; 3 documenté dans le README.


## Fermeture — 2026-10-21

- **Statut** : fermé. Mergé dans `develop` au commit `124c85a` (branche d'intégration `feature/integration-wave2` @ `a72d6aa`). Durcissement du limiteur de débit et des erreurs 4xx, livré avec B-05 (`03092f4`).
- **Vérifié (sorties réelles sur `a72d6aa`, back-lead ; relances du chef de projet notées)** : `test:run` 25 fichiers / 290 tests (relancé par le chef de projet sur `a72d6aa` puis sur `develop` après merge : 290/290) ; `test:api` ×5 sur base neuve : 12 fichiers / 121 tests, exit 0 à chaque lancement ; `test:db` 60/60, seed legacy (2 478 lignes), import (committed, 0 écart bloquant), `test:db` 60/60 sur la même base ; migrations M0→M4 run / revert ×4 / run OK ; `migration:generate` : « No changes in database schema were found » ; gitleaks : aucune fuite (relancé par le chef de projet) ; `npm ls axios` vide ; 0 `.env` dans les worktrees.
- **Vérification par l'API** (build de prod `a72d6aa`) : `GET /competiteurs?q=nicolas deseine` → 39 victoires / 13 défaites / 19 résultats inconnus ; `GET /stats` → 16 éditions, 146 compétiteurs, 729 matchs dont 554 avec score, 175 inconnus ; R-8 : séries ACP et All Time, 138 joueurs × 1 247 valeurs, 0 écart avec le classeur ; `/classements/acp` et `/classements/all-time` : 145 lignes, 0 écart avec les colonnes D et J de `Data`.
- **Sécurité** : revue ciblée 0 critical / 0 high / 0 medium ; N2 corrigé (`887aee6`) ; N1 et N3 reportés dans [T-SEC-04](T-SEC-04.md).
- **Waiver AUDIT-1** : `npm audit` 12 high + 2 critical sur la chaîne de dev Nuxt 4.6.1, 0 avec `--omit=dev` ; remédiation [T-SEC-01](T-SEC-01.md).

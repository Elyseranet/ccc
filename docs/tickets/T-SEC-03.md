# T-SEC-03 — Constats LOW de la re-revue sécurité vague 1

- **Origine** : re-revue sécurité de `feature/integration-wave1` @ `57055e5` (2026-10-20), mergée dans `develop` @ `a188c52`. Non bloquant (0 critical/high/medium).
- **À traiter avec** : B-05 (première route publique soumise au limiteur).

1. `server/utils/http/rate-limit.util.ts:80` (+ `nuxt.config.ts:26`) : `maxKeys`, `windowMs` ou `maxRequests` à `NaN`, 0 ou négatif désactive le plafond (`size > NaN` est faux, l. 49). **Correctif** : valider au démarrage des entiers strictement positifs, échec explicite sinon.
2. `server/utils/http/api-error.util.ts:70` : en 4xx, `candidate.message` d'une erreur h3/tierce est repris tel quel. Pas de fuite avérée aujourd'hui. **Correctif** : n'accepter le message que si `data.code` est présent, sinon message par défaut du statut.
3. `server/utils/http/rate-limit.util.ts:49-54` : un grand nombre d'IPv4 distinctes peut évincer des compteurs légitimes (inhérent au LRU mémoire). **Correctif** : documenter la limite ; stockage partagé si déploiement multi-instance (lié à T-SEC-02).

- **Fermeture** : 1 et 2 corrigés et testés ; 3 documenté dans le README.

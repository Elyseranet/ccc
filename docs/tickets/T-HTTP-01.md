# T-HTTP-01 — Statuts HTTP du back dans la constante partagée `http-status.const.ts`

- **Statut** : À faire. Ouvert le 2026-10-22 par `backend-lead`, sur proposition du `frontend-lead`.
- **Dépend de** : merge de F-00h (**fait** : squash `d0613b6` dans `develop`, qui crée `src/consts/http-status.const.ts` avec `HTTP_STATUS_BAD_REQUEST`, `_UNAUTHORIZED`, `_NOT_FOUND`, `_TOO_MANY_REQUESTS`, `_INTERNAL_SERVER_ERROR`, `NETWORK_ERROR_STATUS` et `DEFAULT_REQUEST_ERROR_MESSAGE`) **et** merge de la vague 3a back (reste à faire). La vague 3a ajoute ses propres fabriques d'erreur (408, 413, 415, 429, 503 `SERVICE_BUSY`…). Les migrer avant ferait conflit sur `src/utils/api-error.util.ts` dans toutes les branches.
- **Constat** (relevé sur `develop` @ `82d914e`, `grep` des littéraux). Le back écrit ses statuts HTTP en dur :
  - `src/utils/api-error.util.ts` : fabriques `buildError(400 | 401 | 403 | 404 | 409 | 410 | 413 | 422 | 500 | 503, …)` et normalisation (`>= 500`, `=== 503`) ;
  - `src/consts/api-error.const.ts` : table statut → code applicatif ;
  - `src/utils/edition-cache.util.ts` : `sendNoContent(event, 304)` ;
  - à vérifier : `src/server/plugins/api-response.ts`, `src/server/api/v1/health.get.ts` et `src/server/api/v1/auth/logout.post.ts`, qui manipulent un `statusCode`.
  
  Il existe aussi des constantes de statut côté front dans `src/consts/async-state.const.ts` (`HTTP_STATUS_TOO_MANY_REQUESTS`, `HTTP_STATUS_UNAUTHORIZED`). F-00h les regroupe dans `http-status.const.ts`.
- **Objectif** : un seul fichier de statuts pour le front et le back (services fusionnés, ARCH-2), sans aucun littéral de statut dans `src/`.
- **Critères d'acceptation** :
  1. Toutes les fabriques et tables du back utilisent les constantes de `src/consts/http-status.const.ts`. Les statuts manquants y sont ajoutés, avec la même convention de nommage que F-00h : au minimum 304, 403, 408, 409, 410, 413, 415, 422 et 503, plus ceux que la vague 3a aura introduits.
  2. Aucune constante de statut n'est dupliquée ailleurs. Côté front, F-00h (`316f394`, selon le `frontend-lead`) retire déjà `HTTP_STATUS_*` de `async-state.const.ts` : il n'y a pas de doublon front à supprimer. `NETWORK_ERROR_STATUS = 0`, ajouté par F-00h, n'est pas un statut HTTP et reste tel quel.
  3. Le comportement ne change pas. `test:run`, `test:db` et `test:api` sont verts, et les réponses d'erreur gardent le même statut et le même code applicatif.
  4. Un `grep` des littéraux de statut dans `src/utils`, `src/services`, `src/server` et `src/consts` ne renvoie plus que `http-status.const.ts` et des commentaires.

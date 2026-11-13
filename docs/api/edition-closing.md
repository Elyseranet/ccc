# API : clôture d'une édition et gel des points (B-14)

Route sous `/api/v1`, réservée au rôle `ADMIN` : **401** `UNAUTHORIZED` sans session, **403** `FORBIDDEN` pour un participant, vérifié avant toute lecture. Réponse en `Cache-Control: no-store`. Logique : `closeEdition` (`src/services/edition.service.ts`). Journal : `edition_closed` (`userId`, `editionId`, `participantCount`, `replayed`).

## Le calcul est partagé (CLOSE-PREVIEW)

Les points et les stades finals sont calculés par `computeClosingPreview` (`src/utils/edition-closing.util.ts`), fonction pure sans dépendance serveur. Le navigateur l'appelle sur `IEditionDetail` pour l'aperçu de la page de clôture (F-26) ; le serveur l'appelle sur l'état en base pour figer. **Il n'existe aucun endpoint d'aperçu.**

- Entrée : `Pick<IEditionDetail, 'participants' | 'rounds' | 'matches'>`.
- Sortie `IClosingPreview` : `{ participantCount, blockedBy, results[] }`, avec `results[] = { participationId, finalStage, points }`.
- N = nombre de participations. `points = base(finalStage) x N / 50` (RG1, RG2), calculés en centièmes entiers, exposés à 2 décimales.
- Le stade se **déduit** des matchs de phase finale décidés (`winnerParticipationId`) : le perdant d'un tour prend le stade de ce tour (`PLAYOFF`, `ROUND_OF_16`, `QUARTER`, `SEMI`), le perdant de la finale est `FINALIST`, son vainqueur `CHAMPION`. Un joueur sans match de phase finale est `POOL_ELIMINATED` (0 point). Les départages et les matchs de poule sont ignorés. RG3 : un tour non disputé ne rapporte rien.
- `blockedBy = FINAL_NOT_VALIDATED` (et `results` vide) tant qu'aucun match de finale n'existe ou que l'un n'a pas de vainqueur.

## `POST /api/v1/editions/{id}/cloture`

`{id}` = UUID ou code. Pas de corps. Dans **une transaction**, sous le verrou de l'édition : recalcule par `computeClosingPreview`, écrit `final_stage` et `points` de chaque participation, `participant_count = N`, passe l'édition à `CLOSED`, pose `closed_at`. Les points figés ne sont jamais réécrits par un changement ultérieur de barème.

Réponse **200** `IEditionDetail` de l'édition close (mêmes données que `GET /editions/{id}`).

**Idempotent** : une édition déjà `CLOSED` renvoie 200 avec son état, sans recalcul ni changement de `closed_at`.

| Statut | Code | Cas |
|---|---|---|
| 400 | `VALIDATION_FAILED` | `{id}` invalide |
| 401 / 403 | `UNAUTHORIZED` / `FORBIDDEN` | sans session / participant |
| 404 | `NOT_FOUND` | édition inconnue |
| 409 | `FINAL_NOT_VALIDATED` | la finale n'est pas validée ; rien n'est écrit |

Après la clôture, toute écriture sur l'édition (informations générales, inscriptions, qualification, tirages, saisie et correction de score) répond **409** `EDITION_CLOSED`.

## Caches

- Classements (B-07) : calculés à la lecture, sans cache. `GET /classements/acp` intègre l'édition dès la clôture ; il n'y a rien à invalider.
- `ETag` de l'édition (B-06) : l'empreinte contient le statut, donc l'`ETag` change à la clôture et passe au régime « édition close ».

## Pas de migration

`editions.participant_count`, `editions.closed_at`, `participations.final_stage` et `participations.points` existent déjà.

# API administrateur : scores des matchs (B-12)

Quatre routes sous `/api/v1`, **toutes réservées à l'administrateur** (`USER_ROLE.ADMIN`). Les DTO sont dans `../../src/interfaces/` (`score.interface.ts`, `admin-match.interface.ts`). Les erreurs ont la forme `IApiError` (`{ statusCode, code, message, details? }`).

| Route | Rôle | Réponse |
|---|---|---|
| `PUT /matchs/{id}/score` | Enregistrer un score, sans le rendre opposable | `IAdminMatch` |
| `POST /matchs/{id}/validation` | Valider (idempotent) : met à jour classement et qualification | `IMatchValidationResult` |
| `POST /matchs/{id}/correction` | Corriger un score validé (A15), journalisé | `IMatchValidationResult` |
| `GET /admin/editions/{id}/matchs` | Vue admin des matchs d'une édition (C6) | `IAdminMatch[]` |

## Confidentialité

`recordedScore` (score saisi non validé) et `comment` (commentaire de match, A13) sont **réservés aux administrateurs**. Ils ne sont renvoyés que par ces quatre routes, gardées par le rôle : un anonyme reçoit `401`, un participant `403`, et aucun de ces corps d'erreur ne les contient. Les routes publiques (`GET /editions/...`) ne les exposent jamais : un match `RECORDED` y apparaît `SCHEDULED`, sans score. Toutes les réponses portent `Cache-Control: no-store`.

## Règles communes

- `{id}` d'un match : UUID, sinon `400`. Match inconnu : `404`.
- **Corps** `IScoreSubmission` : `{ "scores": [{ "participationId": "<uuid>", "score": 5 }, ...] }`. Un score par côté du match, une fois chacun ; `score` est un entier entre 0 et 99. Les champs inconnus sont refusés. Corps JSON de 16 Kio au plus.
- **`If-Match`** : la `version` du match (`IAdminMatch.version`), nue, entre guillemets ou en `W/"n"`. Optionnel sur `PUT` et `POST validation`, **obligatoire** sur `POST correction`. Une valeur mal formée répond `400`.
- **Écriture possible** si le match n'est pas `RESULT_UNKNOWN`, si l'édition n'est pas `CLOSED` et si le tour du match est ouvert (`DRAWN` ou `PLAYING`). Sinon `409 CONFLICT`.
- Chaque écriture est une transaction avec verrou de ligne : deux requêtes simultanées se sérialisent.

## `PUT /matchs/{id}/score`

Écrit `recorded_score` sur chaque côté, et le match passe à `RECORDED`. Idempotent : renvoyer les mêmes scores ne change ni la `version` ni le statut. Aucun effet public. Les contrôles de forme (400) s'appliquent ; la cohérence avec la cible (RG22) n'est vérifiée qu'à la validation, donc un 5-5 peut être enregistré mais pas validé.

```
PUT /api/v1/matchs/0b7c.../score
Content-Type: application/json

{ "scores": [ { "participationId": "a1...", "score": 5 }, { "participationId": "b2...", "score": 3 } ] }
```

```json
{
  "id": "0b7c...", "sequence": 3, "roundKind": "POOLS", "poolRank": 1, "purpose": "REGULAR",
  "targetScore": 5, "status": "RECORDED", "winnerParticipationId": null,
  "sides": [
    { "participationId": "a1...", "competitorId": "c1...", "displayName": "Alice", "score": null, "recordedScore": 5 },
    { "participationId": "b2...", "competitorId": "c2...", "displayName": "Bruno", "score": null, "recordedScore": 3 }
  ],
  "comment": null, "version": 4, "recordedAt": "2026-10-21T20:12:00.000Z", "validatedAt": null, "validatedBy": null
}
```

## `POST /matchs/{id}/validation`

Copie `recorded_score` dans `validated_score`, pose `validated_at` et `validated_by_user_id`, dans une transaction. Le corps porte **les scores que l'organisateur a vus** : on valide ce qu'il a vu, pas l'état du serveur à l'arrivée de la requête.

- **Rejeu** : un match déjà `VALIDATED` dont les scores validés égalent ceux du corps renvoie `200` avec l'état courant, sans aucun effet de bord (même avec un `If-Match` périmé). Le même appel envoyé trois fois donne un seul effet et trois réponses identiques.
- Des scores différents sur un match déjà validé : `409 MATCH_ALREADY_VALIDATED`.
- Des scores différents du score saisi, ou un `If-Match` périmé : `409 MATCH_VERSION_CONFLICT` (« validé ou modifié par une autre session »).
- Aucun score saisi : `409 CONFLICT`.
- Scores incohérents avec le format (RG22 : exactement un côté atteint la cible, 5 en poule et 10 en phase finale ; les autres entre 0 et la cible moins 1) : `422 SCORE_INCONSISTENT`.

Réponse `IMatchValidationResult` : l'état recalculé.

```json
{
  "match": { "id": "0b7c...", "status": "VALIDATED", "version": 5, "validatedAt": "2026-10-21T20:13:00.000Z",
             "validatedBy": { "id": "u1...", "displayName": "Arnaud" }, "...": "voir IAdminMatch" },
  "pool": { "id": "p1...", "rank": 1, "standing": [ { "rank": 1, "participationId": "a1...", "wins": 2, "losses": 0, "...": "voir IPoolStandingRow" } ] },
  "round": { "id": "r1...", "kind": "POOLS", "sequence": 1, "status": "PLAYING", "matchCount": 6, "validatedMatchCount": 2 },
  "advancingParticipationIds": []
}
```

- `pool` : le classement de la poule du match (`null` en phase finale).
- `round` : le tour du match, avec ses compteurs.
- `advancingParticipationIds` : le vivier du tour suivant, c'est-à-dire les vainqueurs des matchs `VALIDATED` du tour en phase finale (`[]` pour un tour de poules). Il est dérivé, rien n'est stocké. La qualification et le tirage du tour suivant relèvent de B-13.

## `POST /matchs/{id}/correction` (A15)

Corrige un match `VALIDATED` : réécrit `recorded_score` et `validated_score`, **met `validated_at` à jour** (l'ETag public d'une édition en cours en dépend : un client qui présente l'ancien `If-None-Match` reçoit `200` avec le score corrigé, pas `304`), et journalise l'événement `match_corrected` (identifiant du match, de l'édition, de l'auteur, ancien et nouveau score). Même corps et même réponse que la validation, `If-Match` obligatoire.

Un tour suivant est « engagé » (R-3) :
- pour un match de **poule**, quand la qualification est arrêtée (l'édition a dépassé `POOLS_PLAYING` : `QUALIFIED`, `PLAYOFFS` ou `CLOSED`) ;
- pour un match de **phase finale**, quand un tirage existe pour un tour suivant, même en brouillon (`DRAFT`).

Dans ce cas : `409 NEXT_ROUND_ENGAGED`.

```
POST /api/v1/matchs/0b7c.../correction
If-Match: "5"
Content-Type: application/json

{ "scores": [ { "participationId": "a1...", "score": 3 }, { "participationId": "b2...", "score": 5 } ] }
```

## `GET /admin/editions/{id}/matchs`

`{id}` : UUID ou code de l'édition. Renvoie **tous** les matchs de l'édition, non paginés, par `sequence` croissante, en `IAdminMatch[]` : statut réel (`RECORDED` visible), `recordedScore` de chaque côté, `comment`, `version`, `recordedAt`, `validatedAt` et `validatedBy`.

| Paramètre | Valeurs | Défaut |
|---|---|---|
| `statut` | liste (`A,B` ou `statut=A&statut=B`) de `MATCH_STATUS` : `SCHEDULED`, `RECORDED`, `VALIDATED`, `RESULT_UNKNOWN` | tous |
| `tour` | une valeur de `ROUND_KIND` | tous |
| `poule` | entier >= 1 (rang de la poule) | toutes |

Le serveur n'a pas de sémantique propre aux filtres de l'écran (« À traiter », « Saisis », « Sans score », « Validés ») : le front les compose en listes de statuts. Un statut hors `MATCH_STATUS` répond `400 VALIDATION_FAILED`.

## Codes d'erreur

| Statut | Code applicatif | Cas |
|---|---|---|
| 400 | `VALIDATION_FAILED` | identifiant, score (négatif, non entier, au-dessus de 99), côté absent ou répété, participant étranger au match, filtre inconnu |
| 400 | `BAD_REQUEST` | `If-Match` mal formé, ou absent sur la correction |
| 401 | `UNAUTHORIZED` | pas de session |
| 403 | `FORBIDDEN` | session non administrateur |
| 404 | `NOT_FOUND` | match ou édition inconnu |
| 409 | `MATCH_ALREADY_VALIDATED` | `PUT` sur un match `VALIDATED` (passer par la correction), ou validation avec d'autres scores que ceux déjà validés |
| 409 | `MATCH_VERSION_CONFLICT` | `If-Match` périmé, ou scores du corps différents du score saisi |
| 409 | `NEXT_ROUND_ENGAGED` | correction refusée : un tour suivant est engagé (R-3) |
| 409 | `CONFLICT` | match `RESULT_UNKNOWN`, édition `CLOSED`, tour non ouvert, validation sans score saisi, correction d'un match non `VALIDATED` |
| 413 | `PAYLOAD_TOO_LARGE` | corps de plus de 16 Kio |
| 422 | `SCORE_INCONSISTENT` | scores incohérents avec le format du match (RG22), à la validation et à la correction |

## Journal

Événements structurés : `match_recorded`, `match_validated` (`matchId`, `editionId`, `userId`, `durationMs`, `replayed` : le compteur des rejeux mesure la qualité du réseau d'une soirée) et `match_corrected` (ancien et nouveau score).

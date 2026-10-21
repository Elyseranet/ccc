# API publique : éditions (B-06)

Toutes les routes sont publiques et en lecture seule, sous `/api/v1`. Les DTO sont dans `shared/interfaces/api/`. Les erreurs ont la forme `IApiError`.

`{id}` accepte l'UUID de l'édition ou son `code` (`2012a`, `2026`). L'année n'identifie pas une édition : 2012 en porte deux.

| Route | Réponse | Notes |
|---|---|---|
| `GET /editions` | `IEditionSummary[]` | ordre `chronological_rank` décroissant, sans pagination ; champion et compteurs embarqués |
| `GET /stats` | `IArchiveStats` | `matches` = matchs joués (`VALIDATED` + `RESULT_UNKNOWN`), `scoredMatches` = avec score, `unknownResultMatches` (A16, R-5) |
| `GET /editions/{id}` | `IEditionDetail` | participants, poules et classements, tours, matchs, tirages validés, tableau final |
| `GET /editions/{id}/participants` | `IEditionParticipant[]` | aucun champ de contact |
| `GET /editions/{id}/poules` | `IPool[]` | classement RG19 / A10 / R-6 sur les seuls matchs `VALIDATED` |
| `GET /editions/{id}/tours` | `IRound[]` | `matchCount` et `validatedMatchCount` par tour |
| `GET /editions/{id}/matchs` | `IPaginated<IMatch>` | voir ci-dessous |
| `GET /editions/{id}/tirages` | `IDraw[]` | tirages `VALIDATED` uniquement |

## `GET /editions/{id}/matchs`

| Paramètre | Valeurs | Défaut |
|---|---|---|
| `page`, `pageSize` | entiers, `pageSize` <= 100 | 1, 20 |
| `tour` | une valeur de `ROUND_KIND` | tous |
| `poule` | entier >= 1 (rang de la poule) | toutes |
| `statut` | liste (`A,B` ou `statut=A&statut=B`) de `SCHEDULED`, `VALIDATED`, `RESULT_UNKNOWN` | tous |
| `tri` | `validated_at_desc` (derniers scores validés d'abord) | `sequence` croissant |

`RECORDED` n'est pas un statut public : le demander répond 400. Un filtre `tour` inconnu ou un `poule` non entier répond 400 `VALIDATION_FAILED`.

## Règles de visibilité

- Édition en cours visible (E-f). Un match saisi mais non validé est sérialisé `SCHEDULED`, avec `score = null` : `recordedScore` n'est jamais lu.
- Aucun commentaire de match (A13) ni d'édition (R-4), aucun email ni téléphone, dans aucune réponse.
- Un tirage `DRAFT` n'est jamais public, ni dans `/tirages` ni dans `/editions/{id}`.
- R-5 : `played`, `wins`, `losses` ne comptent que les matchs avec score. Les matchs au résultat inconnu sont exposés à côté : `unknownResults` (ligne de classement), `unknownResultMatchCount` (édition), `unknownResultMatches` (`/stats`).
- A6 : `participantCount` est le N figé (16 pour 2012a et 2012b) ; `unidentifiedParticipantCount` est l'écart avec les participants listés, `null` si N est inconnu.

## Cache

Chaque réponse `/editions/{id}…` porte un `ETag` propre à l'URL (chemin et requête). `If-None-Match` valide : 304 sans corps.

- Édition `CLOSED` : `ETag` fort, `Cache-Control: public, max-age=<runtimeConfig.cache.closedEditionMaxAgeSeconds>` (défaut 3600, `NUXT_CACHE_CLOSED_EDITION_MAX_AGE_SECONDS`).
- Édition en cours : `ETag` faible, `Cache-Control: no-cache`.

L'empreinte de l'ETag est calculée sur le contenu public : dernier `validated_at` des matchs publics, leur nombre, dernier `validated_at` des tirages validés, effectif et statut de l'édition. Saisir un score non validé ne la fait pas bouger.

## Exemple : `GET /api/v1/editions/2026`

```json
{
  "id": "5b0c2d62-6f1e-4c42-9b1e-6d3b0a7f9a10",
  "code": "2026",
  "year": 2026,
  "name": null,
  "heldOn": null,
  "location": null,
  "status": "POOLS_PLAYING",
  "origin": "APP",
  "participantCount": null,
  "unidentifiedParticipantCount": null,
  "matchCount": 3,
  "scoredMatchCount": 1,
  "unknownResultMatchCount": 0,
  "champion": null,
  "description": null,
  "participants": [
    {
      "participationId": "0e1f...",
      "competitor": { "id": "a1...", "displayName": "Alice", "firstName": null, "lastName": null, "nickname": null, "avatarUrl": null },
      "poolId": "77aa...", "isSeed": false, "seedRank": null, "status": "IN_POOL",
      "finalStage": null, "points": null, "poolRank": null
    }
  ],
  "pools": [
    {
      "id": "77aa...",
      "rank": 1,
      "standing": [
        {
          "rank": 1, "participationId": "0e1f...",
          "competitor": { "id": "a1...", "displayName": "Alice", "firstName": null, "lastName": null, "nickname": null, "avatarUrl": null },
          "isSeed": false, "participationStatus": "IN_POOL",
          "played": 1, "wins": 1, "losses": 0, "pointsFor": 5, "pointsAgainst": 2, "capsAverage": 3, "unknownResults": 0
        }
      ]
    }
  ],
  "rounds": [
    { "id": "c3d4...", "kind": "POOLS", "sequence": 1, "status": "PLAYING", "matchCount": 3, "validatedMatchCount": 1 },
    { "id": "e5f6...", "kind": "FINAL", "sequence": 2, "status": "PENDING", "matchCount": 0, "validatedMatchCount": 0 }
  ],
  "matches": [
    {
      "id": "9a8b...", "sequence": 1, "roundKind": "POOLS", "poolRank": 1, "purpose": "REGULAR",
      "targetScore": 5, "status": "VALIDATED",
      "sides": [
        { "participationId": "0e1f...", "competitorId": "a1...", "displayName": "Alice", "score": 5 },
        { "participationId": "2c3d...", "competitorId": "b2...", "displayName": "Bruno", "score": 2 }
      ],
      "winnerParticipationId": "0e1f..."
    },
    {
      "id": "7c6d...", "sequence": 2, "roundKind": "POOLS", "poolRank": 1, "purpose": "REGULAR",
      "targetScore": 5, "status": "SCHEDULED",
      "sides": [
        { "participationId": "4e5f...", "competitorId": "c3...", "displayName": "Chloé", "score": null },
        { "participationId": "6a7b...", "competitorId": "d4...", "displayName": "David", "score": null }
      ],
      "winnerParticipationId": null
    }
  ],
  "draws": [
    {
      "id": "d1d2...", "kind": "POOLS", "roundKind": null, "status": "VALIDATED",
      "parameters": { "poolCount": 1, "seedCount": 1 },
      "createdAt": "2026-09-30T17:55:00.000Z", "validatedAt": "2026-09-30T18:00:00.000Z",
      "assignments": [
        { "participationId": "0e1f...", "competitorId": "a1...", "displayName": "Alice", "poolId": "77aa...", "pairingIndex": null, "sidePosition": null, "drawnOrder": 1, "assignedAt": "2026-09-30T18:00:00.000Z" }
      ]
    }
  ],
  "bracket": [{ "kind": "FINAL", "matches": [] }]
}
```

Le deuxième match (« Chloé - David ») a peut-être un score saisi par l'administrateur : le public le voit « à jouer » tant qu'il n'est pas validé.

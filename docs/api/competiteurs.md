# API publique : compétiteurs (B-05)

Routes publiques, en lecture seule, sous `/api/v1`. Aucune ne renvoie d'email, de téléphone ni de commentaire de match. Les erreurs ont la forme `IApiError` (`{ statusCode, code, message, details? }`).

## Règles de calcul

- `titles` ne compte que les éditions `CLOSED` (A8), par la même fonction `countTitles` que le classement.
- Les statistiques ne comptent que les matchs `REGULAR` (le départage est exclu).
- R-5 : victoires, défaites et `matchesPlayed` ne comptent que les matchs **avec score** (`VALIDATED`). Un match `RESULT_UNKNOWN` n'est ni une victoire ni une défaite : il est compté à part dans `unknownResults`.
- FA-12 : aucun ratio sur la fiche ni dans la liste. Le ratio n'existe que dans le face-à-face (`winRatio`, `null` si aucun match de la paire n'a de score).

## `GET /competiteurs`

Limite connue : le tri et la pagination se font en mémoire, après chargement de tous les compétiteurs filtrés et des matchs comptés. C'est adapté au volume actuel (145 compétiteurs) et à revoir au-delà de quelques milliers.

Réponse : `IPaginated<ICompetitorListItem>`.

| Paramètre | Règle |
|---|---|
| `page`, `pageSize` | entiers, `page >= 1`, `1 <= pageSize <= 100` (défaut 1 et 20) ; sinon 400 |
| `sort` | `displayName` (défaut), `editionsPlayed`, `matchesPlayed`, `wins`, `losses`, `titles`, `firstEdition` ; sinon 400 |
| `order` | `asc` ou `desc` ; défaut `asc` pour `displayName` et `firstEdition`, `desc` pour les statistiques |
| `edition` | UUID. Ne garde que les compétiteurs inscrits à cette édition ; les statistiques restent celles de leur carrière entière |
| `q` | recherche, voir ci-dessous |

### Recherche `?q=`

- 2 à 50 caractères après suppression des espaces de bord, sinon 400.
- Insensible à la casse et aux accents (`rem` trouve `Rémi` et `Remi`), sur `display_name`, `nickname`, `first_name`, `last_name` et les alias.
- `%`, `_` et `\` sont des caractères littéraux ; la requête SQL est paramétrée.
- Limitée en débit par IP (clé `competitors-search`, 30 requêtes par 60 s par défaut, réglable : voir le README). Au-delà : `429` avec l'en-tête `Retry-After` (secondes).
- Journal : événement `competitors_search` avec `queryLength`, `resultCount`, `durationMs` (jamais le contenu de `q`).

Exemple :

```
GET /api/v1/competiteurs?q=dese&sort=wins
```

```json
{
  "items": [
    {
      "id": "5b0e6f0e-8c52-4f5e-9d3a-3f1d6b1d2a10",
      "displayName": "Nicolas Deseine",
      "firstName": "Nicolas",
      "lastName": "Deseine",
      "nickname": null,
      "avatarUrl": null,
      "editionsPlayed": 2,
      "matchesPlayed": 4,
      "wins": 3,
      "losses": 1,
      "unknownResults": 1,
      "titles": 1,
      "firstEditionCode": "2020"
    }
  ],
  "total": 1,
  "page": 1,
  "pageSize": 20
}
```

## `GET /competiteurs/{id}`

Réponse : `ICompetitorDetail` (identité publique, `participations` triées par ordre chronologique avec stade final et points figés, `stats`). `id` mal formé : 400. Inconnu : 404 `COMPETITOR_NOT_FOUND`. Un compétiteur sans match avec score renvoie des statistiques à 0.

```json
{
  "id": "5b0e6f0e-8c52-4f5e-9d3a-3f1d6b1d2a10",
  "displayName": "Nicolas Deseine",
  "firstName": "Nicolas",
  "lastName": "Deseine",
  "nickname": null,
  "avatarUrl": null,
  "participations": [
    { "editionId": "…", "editionCode": "2020", "year": 2020, "editionName": "Édition 2020", "editionStatus": "CLOSED", "finalStage": "FINALIST", "points": 12.5, "poolRank": null }
  ],
  "stats": { "played": 4, "wins": 3, "losses": 1, "unknownResults": 1, "pointsFor": 19, "pointsAgainst": 11, "titles": 1 }
}
```

## `GET /competiteurs/{id}/face-a-face`

RG36, RG37. Avec `?adversaire={id}` : `IHeadToHead` (bilan de la paire vu du côté de `{id}`, plus la liste des matchs comptés). `adversaire` mal formé ou égal à `{id}` : 400 ; l'un des deux joueurs inconnu : 404 `COMPETITOR_NOT_FOUND`. Une paire qui ne s'est jamais rencontrée renvoie `played: 0`, `winRatio: null`, `matches: []`.

Sans `adversaire` : `IHeadToHeadSummary[]`, une entrée par adversaire déjà rencontré (au moins un match avec score), les plus fréquents d'abord.

```
GET /api/v1/competiteurs/{id}/face-a-face?adversaire={id2}
```

```json
{
  "competitor": { "id": "…", "displayName": "Nicolas Deseine", "firstName": "Nicolas", "lastName": "Deseine", "nickname": null, "avatarUrl": null },
  "opponent": { "id": "…", "displayName": "Rémi Durand", "firstName": "Rémi", "lastName": "Durand", "nickname": null, "avatarUrl": null },
  "played": 3, "wins": 2, "losses": 1, "winRatio": 0.6666666666666666,
  "pointsFor": 14, "pointsAgainst": 10, "differential": 4,
  "matches": [
    { "matchId": "…", "editionId": "…", "editionCode": "2020", "roundKind": "POOLS", "competitorScore": 5, "opponentScore": 3, "winnerCompetitorId": "…" }
  ]
}
```

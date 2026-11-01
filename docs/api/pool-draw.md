# API : tirage des poules (B-11)

Routes sous `/api/v1`. Toutes exigent le rôle `ADMIN` : **401** `UNAUTHORIZED` sans session, **403** `FORBIDDEN` pour un participant. Le rôle est vérifié **avant** toute lecture du corps. Les réponses portent `Cache-Control: no-store`. Les corps JSON (16 Ko au plus) sont validés par schéma `zod` strict : un champ inconnu donne **400** `VALIDATION_FAILED`, avec `details[]` (`path`, `message`). Les erreurs ont la forme `IApiError` (`statusCode`, `code`, `message`).

Les DTO sont dans `src/interfaces/draw.interface.ts` (`ISeedProposal`, `ICreatePoolDrawRequest`, `IUpdateDrawAssignmentsRequest`, `IAdminDraw`), les schémas dans `src/server/schemas/draw.schema.ts`, la logique dans `src/services/draw.service.ts`. Les écritures journalisent `draw_created`, `draw_assignments_saved` ou `draw_validated` avec `userId`, `editionId`, `drawId`, sans donnée personnelle.

**Aucun aléa côté serveur** (A1, RG12) : le tirage est physique, le serveur l'enregistre. Un test vérifie qu'aucune source d'aléa n'apparaît dans le code du tirage.

## Déroulé

1. `GET …/tetes-de-serie?poules=n` propose les n têtes de série.
2. `POST …/tirages/poules` ouvre un brouillon avec les têtes de série choisies (elles reçoivent `drawnOrder` 1 à n, sans poule).
3. `PUT /tirages/{id}/affectations`, autant de fois que nécessaire, enregistre le tirage physique (le contenu est remplacé).
4. `POST /tirages/{id}/validation` fige le tirage : poules créées, participants affectés, round-robin généré, édition en `POOLS_DRAWN`.

Le brouillon n'est **jamais public** : `GET /editions/{id}/tirages` (B-06) ne liste que les tirages validés. Un tirage validé l'est, avec son horodatage `validatedAt` ; l'auteur (`createdBy`, `validatedBy`) n'est exposé que par le DTO admin.

## `GET /api/v1/editions/{id}/tetes-de-serie?poules={n}` (ajout à la Spec API)

Propose les n meilleures têtes de série (RG9) et signale les égalités parfaites (RG10).

- **Chemin** : `{id}` = UUID ou code de l'édition (`2027b`).
- **Query** : `poules`, entier de 1 à 20 (`^\d{1,3}$`, puis bornes ; `0`, `-1`, `1.5`, `1e2`, `abc` donnent 400). Les autres paramètres sont refusés.
- **Classement** : ACP sur les 5 dernières éditions `CLOSED` (A8), puis titres, finales, demies, quarts, huitièmes, barrages (décroissants), puis nombre de participations (croissant). Les inscrits de l'édition seuls sont classés. Aucun critère au-delà : une égalité parfaite n'est jamais tranchée.
- **`unresolvedTies`** : les groupes (de `participationId`) à égalité parfaite qui **chevauchent la frontière** des n têtes de série ; l'administrateur choisit alors parmi eux. Une égalité entièrement dans le haut ou dans le bas du classement n'y figure pas.

Réponse **200** `ISeedProposal` :

```json
{
  "seeds": [
    {
      "participationId": "3b0c9a52-8f3e-4d51-9a7a-0b6f2a1d6c11",
      "competitor": { "id": "a1d3…", "displayName": "Rémi Durand", "firstName": "Rémi", "lastName": "Durand", "nickname": null, "avatarUrl": null },
      "rank": 1,
      "acp": 50
    },
    {
      "participationId": "8e2f4d70-1c55-4b9a-8d3e-77a0c1f9b2aa",
      "competitor": { "id": "b2e4…", "displayName": "Nicolas Deseine", "firstName": "Nicolas", "lastName": "Deseine", "nickname": null, "avatarUrl": null },
      "rank": 2,
      "acp": 40
    }
  ],
  "unresolvedTies": []
}
```

`rank` est le rang « compétition » : deux ex æquo partagent le même rang.

| Statut | Code | Cas |
|---|---|---|
| 400 | `VALIDATION_FAILED` | `poules` absent, hors de 1 à 20, non entier ; `{id}` invalide |
| 400 | `BAD_REQUEST` | plus de poules que d'inscrits |
| 404 | `NOT_FOUND` | édition inconnue |

## `POST /api/v1/editions/{id}/tirages/poules`

Ouvre le brouillon du tirage des poules. Un brouillon existant est **remplacé** (on recommence le tirage) ; un tirage validé ne l'est jamais.

- **Chemin** : `{id}` = UUID ou code de l'édition.
- **Corps** : `ICreatePoolDrawRequest`. `poolCount` et `seedCount` : entiers de 1 à 20 ; `seeds` : 1 à 20 `participationId` (UUID).

```json
{
  "poolCount": 2,
  "seedCount": 2,
  "seeds": ["3b0c9a52-8f3e-4d51-9a7a-0b6f2a1d6c11", "8e2f4d70-1c55-4b9a-8d3e-77a0c1f9b2aa"]
}
```

Règles : `seedCount = poolCount` (RG9) ; `seeds` contient `seedCount` identifiants distincts, tous inscrits à l'édition, et forment le haut du classement de RG10 — ou, face à une égalité parfaite sur la frontière, un choix quelconque parmi les ex æquo. Un identifiant étranger à l'édition n'est jamais une tête de série valable.

Réponse **201** `IAdminDraw` (les têtes de série en premier, `poolNumber` encore `null`) :

```json
{
  "id": "5d9a6f0e-2b43-4c8e-bd0a-91c2e7a3f410",
  "kind": "POOLS",
  "roundKind": null,
  "status": "DRAFT",
  "parameters": { "poolCount": 2, "seedCount": 2 },
  "createdAt": "2026-10-28T19:02:11.000Z",
  "validatedAt": null,
  "createdBy": { "id": "0c77…", "displayName": "Organisateur" },
  "validatedBy": null,
  "assignments": [
    { "participationId": "3b0c9a52-8f3e-4d51-9a7a-0b6f2a1d6c11", "competitorId": "a1d3…", "displayName": "Rémi Durand", "poolId": null, "poolNumber": null, "pairingIndex": null, "sidePosition": null, "drawnOrder": 1, "assignedAt": "2026-10-28T19:02:11.000Z" },
    { "participationId": "8e2f4d70-1c55-4b9a-8d3e-77a0c1f9b2aa", "competitorId": "b2e4…", "displayName": "Nicolas Deseine", "poolId": null, "poolNumber": null, "pairingIndex": null, "sidePosition": null, "drawnOrder": 2, "assignedAt": "2026-10-28T19:02:11.000Z" }
  ]
}
```

| Statut | Code | Cas |
|---|---|---|
| 400 | `VALIDATION_FAILED` | corps hors schéma (champ inconnu, borne, UUID) ; `{id}` invalide |
| 400 | `BAD_REQUEST` | plus de poules que d'inscrits |
| 404 | `NOT_FOUND` | édition inconnue |
| 409 | `DRAW_SEEDS_INVALID` | `seedCount ≠ poolCount` ; `seeds` de taille différente de `seedCount`, doublon, identifiant inconnu ou étranger à l'édition, ou qui n'est pas le haut du classement (RG9, RG10) |
| 409 | `DRAW_ALREADY_VALIDATED` | les poules sont déjà tirées (édition au-delà de `REGISTRATION`) : pas d'annulation |

## `PUT /api/v1/tirages/{id}/affectations` (ajout à la Spec API)

Enregistre le tirage physique dans le brouillon. **Idempotent** : le contenu du brouillon est remplacé par la liste reçue. Elle peut être partielle (le tirage s'enregistre affectation après affectation).

- **Chemin** : `{id}` = UUID du tirage (400 sinon).
- **Corps** : `IUpdateDrawAssignmentsRequest`, au plus 200 affectations. `participationId` : UUID ; `poolNumber` : entier de 1 à 20 (la poule, 1-based) ; `drawnOrder` : entier de 1 à 200 (l'ordre global du tirage, RG11).

```json
{
  "assignments": [
    { "participationId": "3b0c9a52-8f3e-4d51-9a7a-0b6f2a1d6c11", "poolNumber": 1, "drawnOrder": 1 },
    { "participationId": "8e2f4d70-1c55-4b9a-8d3e-77a0c1f9b2aa", "poolNumber": 2, "drawnOrder": 2 },
    { "participationId": "c41a97be-6d02-47f1-a0c8-5e3b8d2f1a07", "poolNumber": 2, "drawnOrder": 3 }
  ]
}
```

Règles, vérifiées en base : chaque `participationId` est inscrit à l'édition **de ce tirage** (jamais d'IDOR) ; `participationId` et `drawnOrder` distincts (des trous de `drawnOrder` sont permis : un retrait d'inscrit en laisse un) ; `poolNumber` ≤ `poolCount` ; les têtes de série fixées à la création (`drawnOrder` ≤ `seedCount`) restent les mêmes et sont dans des poules deux à deux différentes (RG11).

Réponse **200** `IAdminDraw` (même forme que ci-dessus, `poolNumber` renseigné) :

```json
{
  "id": "5d9a6f0e-2b43-4c8e-bd0a-91c2e7a3f410",
  "kind": "POOLS",
  "roundKind": null,
  "status": "DRAFT",
  "parameters": { "poolCount": 2, "seedCount": 2 },
  "createdAt": "2026-10-28T19:02:11.000Z",
  "validatedAt": null,
  "createdBy": { "id": "0c77…", "displayName": "Organisateur" },
  "validatedBy": null,
  "assignments": [
    { "participationId": "3b0c9a52-8f3e-4d51-9a7a-0b6f2a1d6c11", "competitorId": "a1d3…", "displayName": "Rémi Durand", "poolId": null, "poolNumber": 1, "pairingIndex": null, "sidePosition": null, "drawnOrder": 1, "assignedAt": "2026-10-28T19:05:40.000Z" },
    { "participationId": "8e2f4d70-1c55-4b9a-8d3e-77a0c1f9b2aa", "competitorId": "b2e4…", "displayName": "Nicolas Deseine", "poolId": null, "poolNumber": 2, "pairingIndex": null, "sidePosition": null, "drawnOrder": 2, "assignedAt": "2026-10-28T19:05:40.000Z" },
    { "participationId": "c41a97be-6d02-47f1-a0c8-5e3b8d2f1a07", "competitorId": "d9f1…", "displayName": "Paul Martin", "poolId": null, "poolNumber": 2, "pairingIndex": null, "sidePosition": null, "drawnOrder": 3, "assignedAt": "2026-10-28T19:05:40.000Z" }
  ]
}
```

| Statut | Code | Cas |
|---|---|---|
| 400 | `VALIDATION_FAILED` | corps hors schéma (champ inconnu comme `poolRank`, entier hors bornes, UUID invalide, plus de 200 lignes) ; `{id}` invalide |
| 404 | `NOT_FOUND` | tirage inconnu, ou qui n'est pas un tirage de poules |
| 409 | `DRAW_INCONSISTENT` | participation étrangère à l'édition ; `participationId` ou `drawnOrder` en double ; `poolNumber` > `poolCount` ; têtes de série changées ; deux têtes de série dans la même poule (RG11) |
| 409 | `DRAW_ALREADY_VALIDATED` | le tirage est validé : il ne change plus |

## `POST /api/v1/tirages/{id}/validation`

Fige le tirage des poules. Une seule transaction, sous `SELECT … FOR UPDATE` sur le tirage puis sur l'édition :

- crée les `pools` (rang = `poolNumber`), renseigne `draw_assignments.pool_id` et `participations.pool_id`, marque les têtes de série (`isSeed`, `seedRank` = `drawnOrder`) et passe les participations à `IN_POOL` ;
- crée le tour `POOLS` avec le statut **`DRAWN`** (explicite : un tour `PENDING` serait invisible du public, et seuls `DRAWN` et `PLAYING` ouvrent la saisie des scores, B-12) ;
- génère le round-robin intégral de chaque poule (RG15) : n(n−1)/2 matchs (cible 5), `sequence` continu sur l'édition (RG24). Les poules de tailles inégales sont permises (RG16) ;
- passe l'édition à `POOLS_DRAWN`, le tirage à `VALIDATED`, avec `validatedAt` et `validatedBy`.

**Idempotent** (invariant 6) : rejouée sur un tirage déjà `VALIDATED`, elle renvoie **200** avec l'état courant, sans regénérer aucun match. Deux validations simultanées produisent un seul jeu de matchs.

- **Chemin** : `{id}` = UUID du tirage. Pas de corps.

Réponse **200** `IAdminDraw` (`status: "VALIDATED"`, `validatedAt` et `validatedBy` renseignés, `poolId` renseigné pour chaque affectation) :

```json
{
  "id": "5d9a6f0e-2b43-4c8e-bd0a-91c2e7a3f410",
  "kind": "POOLS",
  "roundKind": null,
  "status": "VALIDATED",
  "parameters": { "poolCount": 2, "seedCount": 2 },
  "createdAt": "2026-10-28T19:02:11.000Z",
  "validatedAt": "2026-10-28T19:20:03.000Z",
  "createdBy": { "id": "0c77…", "displayName": "Organisateur" },
  "validatedBy": { "id": "0c77…", "displayName": "Organisateur" },
  "assignments": [
    { "participationId": "3b0c9a52-8f3e-4d51-9a7a-0b6f2a1d6c11", "competitorId": "a1d3…", "displayName": "Rémi Durand", "poolId": "e6b0…", "poolNumber": 1, "pairingIndex": null, "sidePosition": null, "drawnOrder": 1, "assignedAt": "2026-10-28T19:05:40.000Z" }
  ]
}
```

| Statut | Code | Cas |
|---|---|---|
| 400 | `VALIDATION_FAILED` | `{id}` invalide |
| 404 | `NOT_FOUND` | tirage inconnu, ou qui n'est pas un tirage de poules |
| 409 | `DRAW_INCOMPLETE` | un inscrit de l'édition n'a pas d'affectation (Q2), par exemple ajouté pendant le brouillon |
| 409 | `DRAW_INCONSISTENT` | une affectation sans `poolNumber`, `poolNumber` > `poolCount`, `seedCount ≠ poolCount`, ou une poule sans tête de série, ou avec deux (RG11) |
| 409 | `DRAW_ALREADY_VALIDATED` | l'édition a déjà des poules ou un tour de poules, ou est au-delà de `REGISTRATION` |

**Q1** : le retrait d'un inscrit pendant le brouillon (`DELETE /editions/{id}/participants/{participationId}`, B-10) supprime son affectation ; la validation se fait sans lui. Retirer une tête de série laisse le brouillon incomplet : la validation répond `DRAW_INCONSISTENT` et il faut rouvrir le brouillon (`POST …/tirages/poules`). **Q2** : l'ajout d'un inscrit reste permis jusqu'à la validation ; la validation refuse tant qu'il n'est pas affecté.

## `GET /api/v1/admin/editions/{id}/tirages` (ajout à la Spec API)

Tous les tirages de l'édition, **brouillons compris**, du plus ancien au plus récent, avec auteur et horodatages (C7).

- **Chemin** : `{id}` = UUID ou code de l'édition. Pas de query.
- Réponse **200** : `IAdminDraw[]`, de la même forme que ci-dessus (`createdBy`, `validatedBy`, `validatedAt`). Jamais mise en cache (`no-store`). Ne jamais renvoyer ce DTO hors de `/api/v1/admin/` et des routes d'écriture du tirage.

| Statut | Code | Cas |
|---|---|---|
| 400 | `VALIDATION_FAILED` | `{id}` invalide |
| 404 | `NOT_FOUND` | édition inconnue |

## Données

La migration M6 (`1793180000000-AddDrawAssignmentPoolNumber`) ajoute `draw_assignments.pool_number integer NULL` avec `CHECK (pool_number IS NULL OR pool_number >= 1)` : le tirage physique est enregistré avant que les poules existent, donc avant que `pool_id` puisse l'être. Le DTO publie `poolNumber ?? pools.rank`, si bien que les tirages repris de l'archive (sans `pool_number`) publient le même numéro qu'avant. **Rollback** : `db:migration:revert` supprime la colonne et sa contrainte ; les numéros de poule des brouillons en cours sont perdus, les tirages validés gardent leur `pool_id`.

# API administrateur : flux d'activité du tableau de bord (B-15)

Route sous `/api/v1`. Rôle `ADMIN` exigé : **401** `UNAUTHORIZED` sans session, **403** `FORBIDDEN` pour un participant, vérifié avant toute lecture. Réponse en `Cache-Control: no-store`. Erreurs au format `IApiError` (`statusCode`, `code`, `message`, `details?`).

Contrat : `src/interfaces/admin-activity.interface.ts` (`IAdminActivityItem`, `IAdminActivityMatchTarget`, `IAdminActivityDrawTarget`), `src/types/admin-activity.type.ts` (`TAdminActivityTarget`), `src/enums/admin-activity.enum.ts`. Schéma de la query : `src/server/schemas/admin-activity.schema.ts`. Logique : `src/services/admin-activity.service.ts`, mappers : `src/utils/admin-activity.mapper.util.ts`.

## `GET /api/v1/admin/editions/{id}/activite?limit=`

Activité récente d'une édition avec son auteur (C7, A17).

- **Chemin** : `{id}` = UUID ou code de l'édition ; 404 `NOT_FOUND` si elle est inconnue.
- **Query** : `limit`, entier de 1 à 100 (20 par défaut). `0`, `101`, `-1`, `1.5`, `abc`, vide et tout autre paramètre donnent **400** `VALIDATION_FAILED`.
- **200** `IAdminActivityItem[]`, du plus récent au plus ancien (`at` décroissant, puis id de la cible, puis type d'activité : ordre stable), au plus `limit` entrées.

```json
[
  {
    "kind": "MATCH_VALIDATED",
    "at": "2027-03-14T19:42:10.000Z",
    "actor": { "id": "5d1c…", "displayName": "Arnaud Prioul" },
    "target": {
      "type": "MATCH", "id": "9a7e…", "matchSequence": 7, "roundKind": "POOLS", "poolNumber": 2,
      "sides": [
        { "participationId": "p1…", "competitorId": "c1…", "displayName": "Rémi Durand", "score": 5 },
        { "participationId": "p2…", "competitorId": "c2…", "displayName": "Nicolas Deseine", "score": 3 }
      ]
    }
  },
  {
    "kind": "DRAW_VALIDATED",
    "at": "2027-03-14T18:05:00.000Z",
    "actor": { "id": "5d1c…", "displayName": "Arnaud Prioul" },
    "target": { "type": "DRAW", "id": "d4f0…", "drawKind": "POOLS", "roundKind": null, "poolCount": 4, "seedCount": 4 }
  }
]
```

## Dérivation (A17 : aucune table d'audit)

Trois sources, une requête chacune, relations chargées en une passe (pas de N+1), fusionnées puis tronquées à `limit` :

| Source | `kind` | `at` | `actor` |
|---|---|---|---|
| `matches.validated_at` non nul | `MATCH_VALIDATED` | `validated_at` | `validated_by_user_id` |
| `draws.created_at` (brouillons compris) | `DRAW_CREATED` | `created_at` | `created_by_user_id` |
| `draws.validated_at` non nul | `DRAW_VALIDATED` | `validated_at` | `validated_by_user_id` |

Chaque source est bornée à `limit` avant la fusion : les `limit` entrées les plus récentes du flux sont forcément dans les `limit` plus récentes de leur source.

**Limites connues de la dérivation**

- Il n'existe pas de type « correction » : `correctMatch` réécrit `validated_at` et `validated_by_user_id`, un match corrigé apparaît donc en `MATCH_VALIDATED`, à la date de la correction et avec son auteur (décision utilisateur). Le calcul du `kind` d'un match est isolé dans `matchActivityKind`.
- Un brouillon remplacé disparaît (il est supprimé), et avec lui son entrée `DRAW_CREATED`.
- Une seule entrée par match : une correction la déplace à sa date, l'entrée de validation d'origine n'existe plus.
- Les matchs d'archive n'ont pas de `validated_at` : ils n'apparaissent pas.

## Données exposées

L'acteur se réduit à `{ id, displayName }` (mapper partagé `toAdminActor`). Aucun email ni téléphone des compétiteurs n'est sérialisé. Pour un compte sans compétiteur (cas normal d'un administrateur créé par `create-admin.util.ts`), `toAdminActor` renvoie l'email en `displayName` : décision utilisateur, la route n'est lisible que par les administrateurs. `actor` vaut `null` si l'utilisateur est absent (compte supprimé, `ON DELETE SET NULL`). Aucune chaîne n'est construite par le serveur : le front traduit à partir des champs structurés de `target`.

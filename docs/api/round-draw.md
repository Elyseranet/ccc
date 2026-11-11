# API : tirage d'un tour de phase finale (B-13)

Routes sous `/api/v1`. Toutes exigent le rôle `ADMIN` : **401** `UNAUTHORIZED` sans session, **403** `FORBIDDEN` pour un participant, vérifié **avant** toute lecture du corps. Réponses en `Cache-Control: no-store`. Corps JSON validés par schéma `zod` strict (champ inconnu : **400** `VALIDATION_FAILED`, `details[]`). Erreurs de forme `IApiError`.

DTO : `IRoundDrawPreview`, `ICreateRoundDrawRequest`, `IUpdateRoundDrawRequest` (`src/interfaces/qualification.interface.ts`), `IAdminDraw` (`src/interfaces/draw.interface.ts`). Schémas : `src/server/schemas/qualification.schema.ts`. Logique : `src/services/draw.service.ts`, déduction du tour : `planRoundDraw` (`src/utils/qualification-plan.util.ts`). Journaux : `draw_created`, `draw_assignments_saved`, `draw_validated`.

**Aucun aléa côté serveur** (A1, RG12) : les affiches sont tirées physiquement, le serveur les enregistre. **Un tour n'existe qu'à la validation de son tirage** (B-18) : jamais de tour créé d'avance, et il naît avec le statut explicite `DRAWN`.

## Déroulé

1. `GET /admin/editions/{id}/tirages/tour` : le prochain tour, le vivier, ce qui bloque.
2. `POST /editions/{id}/tirages/tour` : ouvre le brouillon, avec le tour choisi quand il n'est pas déduit. Un nouveau POST **remplace** le brouillon (changer de tour).
3. `PUT /tirages/{id}/affectations` : enregistre les affiches tirées (contenu remplacé).
4. `POST /tirages/{id}/validation` : crée le tour (`DRAWN`) et ses matchs (cible 10), passe l'édition à `PLAYOFFS`.

## `GET /api/v1/admin/editions/{id}/tirages/tour`

`{id}` = UUID ou code. Ne lit que, n'écrit rien. Réponse **200** `IRoundDrawPreview` :

```json
{
  "roundKind": "SEMI",
  "allowedRoundKinds": ["SEMI"],
  "candidates": [{ "participationId": "…", "competitor": { "id": "…", "displayName": "…" } }],
  "blockedBy": null
}
```

- `roundKind` : le tour **déduit** (vivier de 2, 4, 8 ou 16 joueurs ; `PLAYOFF` pour le premier tour d'une qualification `withPlayoff`, A9). `null` quand le choix revient à l'admin ou quand rien n'est tirable.
- `allowedRoundKinds` : les tours que l'admin peut tirer, dans l'ordre de jeu. `[roundKind]` quand il est déduit, `[]` quand rien n'est tirable. Hors 2/4/8/16 : tout tour à venir, sauf `ROUND_OF_16` (exige 16 joueurs) et `FINAL` (exige 2), `PLAYOFF` seulement tant qu'aucun tour n'est tiré, et seulement pour un vivier pair.
- `candidates` : le vivier, les participations `QUALIFIED` (premiers de poule compris : ils attendent les barrages sans les jouer, RG14).
- `blockedBy` : `QUALIFICATION_NOT_DONE` (liste non figée), `ROUND_NOT_COMPLETED` (un match du dernier tour n'est pas validé), sinon `null`.

## `POST /api/v1/editions/{id}/tirages/tour`

Corps `ICreateRoundDrawRequest` : `{ "roundKind"?: ROUND_KIND }`.

- Tour déduit : `roundKind` facultatif ; s'il est fourni, il doit valoir la valeur déduite.
- Tour non déduit : `roundKind` **obligatoire** et dans `allowedRoundKinds`.

Réponse **201** `IAdminDraw` (`kind: "ROUND"`, `roundKind`, `status: "DRAFT"`, sans affectation). Le type du tour visé est enregistré dans le tirage (`roundKind`) : le tour n'existe pas encore.

| Statut | Code | Cas |
|---|---|---|
| 400 | `VALIDATION_FAILED` | `roundKind` inconnu ; `roundKind` manquant quand il n'est pas déduit ; champ inconnu |
| 404 | `NOT_FOUND` | édition inconnue |
| 409 | `QUALIFICATION_NOT_DONE` | liste des qualifiés non figée |
| 409 | `DRAW_ALREADY_VALIDATED` | le tirage du tour en cours est validé et ses matchs ne sont pas tous validés : le tour ne peut plus être changé (un tour n'existe qu'une fois son tirage validé). Le `GET` de l'aperçu, lui, renvoie `blockedBy: ROUND_NOT_COMPLETED` |
| 409 | `DRAW_INCONSISTENT` | `roundKind` différent du tour déduit ou hors `allowedRoundKinds` ; rien de tirable |
| 409 | `EDITION_CLOSED` | édition clôturée |

## `PUT /api/v1/tirages/{id}/affectations` (tirage de tour)

Aiguillage par le type du tirage. Corps `IUpdateRoundDrawRequest` : `assignments[]` de `{ participationId, pairingIndex (1..k), sidePosition (1|2), drawnOrder (1..N) }`. Le contenu est remplacé ; une saisie partielle est permise. Un corps de forme « poules » (`poolNumber`) sur un tirage de tour, ou l'inverse, donne **400**.

| Statut | Code | Cas |
|---|---|---|
| 409 | `DRAW_INCONSISTENT` | joueur hors vivier, tiré deux fois, côté ou ordre dupliqué, premier de poule dans un tirage `PLAYOFF` (RG14) |
| 409 | `DRAW_ALREADY_VALIDATED` | tirage déjà validé : il n'est plus modifiable |

## `POST /api/v1/tirages/{id}/validation` (tirage de tour)

Crée le tour (`DRAWN`), ses matchs (`REGULAR`, cible 10) et leurs côtés, passe l'édition à `PLAYOFFS`, fige le tirage (`status: "VALIDATED"`, `roundId`). **Idempotent** : rejouée, elle renvoie **200** avec l'état courant et ne crée aucun match de plus. Réponse **200** `IAdminDraw`.

| Statut | Code | Cas |
|---|---|---|
| 409 | `DRAW_INCOMPLETE` | une affiche n'a pas deux joueurs, ou un joueur du vivier n'est pas tiré (sauf barrages, où seuls les barragistes le sont) |
| 409 | `DRAW_INCONSISTENT` | affectations incohérentes, tour de 16 sans 16 joueurs, finale sans 2 joueurs |
| 409 | `QUALIFICATION_NOT_DONE` / `ROUND_NOT_COMPLETED` | liste non figée ; matchs du tour précédent non validés |

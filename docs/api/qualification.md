# API administrateur : qualification, départages et tirage de tour (B-13)

Contrat des routes sous `/api/v1`, publié avant le code pour F-24 et F-25. Les DTO sont dans `src/interfaces/qualification.interface.ts` (nouveaux) et `src/interfaces/draw.interface.ts` (existants). Toutes ces routes exigent le rôle `ADMIN` : **401** `UNAUTHORIZED` sans session, **403** `FORBIDDEN` pour un participant, rôle vérifié avant toute lecture du corps. Réponses `Cache-Control: no-store`, erreurs au format `IApiError`, corps JSON validés par schéma `zod` strict (champ inconnu : **400** `VALIDATION_FAILED`). `{id}` d'une édition accepte l'UUID ou le code.

**Pas d'`If-Match`** : ni l'édition ni les tirages n'ont de version ; l'idempotence vient de l'état, comme pour le tirage des poules (B-11). **Aucun aléa côté serveur** (A1, RG12) : le tirage est physique, le serveur enregistre les affiches.

## Routes

| Route | Corps | Réponse | Rôle |
|---|---|---|---|
| `GET /admin/editions/{id}/qualification` | query facultative `?topPerPool=&bestNextCount=` | `200` `IQualificationStatus` | État de la qualification sans rien écrire : classements, matchs bloquants, égalités à départager, départages créés, qualifiés calculés |
| `GET /admin/editions/{id}/tirages/tour` | aucun | `200` `IRoundDrawPreview` | Prochain tirage de tour sans rien écrire : `roundKind` qui serait tiré, `candidates` (vivier), `blockedBy` (`QUALIFICATION_NOT_DONE`, `ROUND_NOT_COMPLETED` ou null). Même fonction que `POST …/tirages/tour` |
| `POST /editions/{id}/qualification` | `IQualificationParameters` | `200` `IQualificationResult` | Fige la liste des qualifiés (RG18) et passe l'édition à `QUALIFIED` |
| `POST /editions/{id}/departages` | `ICreateTiebreakRequest` | `201` `IAdminMatch` | Crée un match `TIEBREAK` pour exactement un groupe de `ties` (A10, A11, R-1, R-2, R-6, R-7) |
| `POST /editions/{id}/tirages/tour` | `ICreateRoundDrawRequest` | `201` `IAdminDraw` | Ouvre le brouillon du tirage du tour suivant (RG13) ; barrages si la qualification a `withPlayoff` |
| `PUT /tirages/{id}/affectations` | `IUpdateRoundDrawRequest` (tirage de tour) | `200` `IAdminDraw` | Enregistre les affiches tirées physiquement (route existante de B-11, étendue aux tirages de tour) |
| `POST /tirages/{id}/validation` | aucun | `200` `IAdminDraw` | Valide le tirage (route existante de B-11) : pour un tirage de tour, crée le tour en `DRAWN` et ses matchs (cible 10) ; idempotent |

## Codes d'erreur ajoutés (tous en 409)

| Code | Cas |
|---|---|
| `QUALIFICATION_NOT_READY` | un match de poule (REGULAR ou TIEBREAK) n'est ni validé ni de résultat inconnu : la liste ne peut pas être arrêtée |
| `TIEBREAK_REQUIRED` | une égalité exige un départage non joué (RG19, RG20) ; `details` porte les groupes (`ITiebreakGroup[]`) |
| `TIEBREAK_NOT_REQUIRED` | aucune égalité courante ne concerne exactement ces joueurs |
| `QUALIFICATION_ALREADY_DONE` | la liste est déjà arrêtée avec d'autres paramètres, ou un départage est demandé après l'arrêt de la liste |
| `QUALIFICATION_NOT_DONE` | un tirage de tour est demandé avant l'arrêt de la liste des qualifiés |
| `ROUND_NOT_COMPLETED` | le dernier tour de phase finale n'est pas entièrement validé (RG13) |

Les codes `DRAW_ALREADY_VALIDATED`, `DRAW_INCOMPLETE`, `DRAW_INCONSISTENT`, `EDITION_CLOSED` de B-11 s'appliquent aussi aux tirages de tour.

## Paramètres de la qualification et simulation

- `topPerPool` (n) et `bestNextCount` (m) sont des **entiers** : `topPerPool` vaut au moins 1 et au plus la taille de la plus grande poule ; `bestNextCount` vaut au moins 0 et au plus le nombre de poules. Hors bornes, ou non entier : **400** `VALIDATION_FAILED`. C'est vrai pour le corps de `POST …/qualification` et pour la simulation `GET …/qualification?topPerPool=&bestNextCount=`. Le schéma `zod` (`src/server/schemas/qualification.schema.ts`) contrôle le type et les bornes absolues ; les bornes liées à l'édition (taille de la plus grande poule, nombre de poules) sont contrôlées par le service avec le même code d'erreur.
- **`withPlayoff` ne change pas la liste des qualifiés** (RG18 : les n premiers de chaque poule plus les m meilleurs (n+1)èmes). Il ne change que le type du premier tour de phase finale : `PLAYOFF` (barrages, A9) au lieu du tour déduit de la taille du vivier. Ce tour se lit dans `IRoundDrawPreview.roundKind`.

## Départages et liste des matchs admin

Un match de départage est un match `TIEBREAK` du tour `POOLS`. Il apparaît dans `GET /admin/editions/{id}/matchs` (`purpose: TIEBREAK`, cible 5 à deux côtés, 3 à N côtés) : le listage ne filtre pas sur `purpose`. Son `pool_id` :
- **`scope: POOL`** (égalité au sein d'une poule) : la poule de l'égalité ;
- **`scope: BOUNDARY`** (égalité entre poules pour une place de meilleur (n+1)ème) : **null**. Il n'apparaît donc pas dans le filtre `?poule=`, mais figure dans le listage sans ce filtre et avec `?tour=POOLS`.
La saisie et la validation passent par `PUT /matchs/{id}/score` et `POST /matchs/{id}/validation`, avec `If-Match` (T-SEC-08).

## Décisions utilisateur (c9790abd)

- **Pas de refus « puissance de 2 » à la qualification** : on ne bloque pas une configuration documentée (RG18, par exemple « 4 premiers + 8 meilleurs cinquièmes » à 70 joueurs). Les contrôles se font au tirage : chaque affiche a deux côtés, tout le vivier est tiré (hors barrages), un vivier impair est refusé. Le type du tour se déduit de la taille du vivier (2, 4, 8, 16) ; une autre taille sans barrages donne `roundKind: null` dans l'aperçu (décision en attente).
- **Aucun retour arrière** : aucune route ne rouvre une liste arrêtée ni un tirage de tour validé. Les rejeux à l'identique sont idempotents (200, sans effet).
- **Tirage saisi affiche par affiche** : `PUT /tirages/{id}/affectations` remplace tout le brouillon ; une saisie partielle est permise en brouillon, la complétude n'est exigée qu'à la validation.
- **Départages saisis dans F-08** : ils figurent dans `GET /admin/editions/{id}/matchs` (tour `POOLS`, `purpose: TIEBREAK`).

## Départage entre poules : paramètres

`ICreateTiebreakRequest.parameters` (`{ topPerPool, bestNextCount }`) est facultatif : il n'est utile que pour un départage `BOUNDARY` tant que la liste n'est pas figée, car les égalités entre poules dépendent de n et m. Sans lui, seules les égalités de poule peuvent être départagées. Pour une égalité de poule, il est inutile.

## Tour choisi par l'administrateur (decisions 673e5b4b)

`IRoundDrawPreview` porte `allowedRoundKinds`, les tours que l'administrateur peut tirer ; `roundKind` n'est renseigné que s'il est **déduit**.

- Vivier de 2, 4, 8 ou 16 joueurs, ou premier tour d'une qualification `withPlayoff` : `roundKind` est déduit (2 la finale, 4 les demies, 8 les quarts, 16 les huitièmes ; PLAYOFF pour les barrages), `allowedRoundKinds` vaut `[roundKind]` et `POST …/tirages/tour` peut omettre le champ. Fourni, il doit valoir la valeur déduite, sinon 409.
- Autre taille de vivier : `roundKind` vaut `null` dans l'aperçu avec `blockedBy` null, `allowedRoundKinds` liste les tours possibles, et `POST …/tirages/tour` **exige** `roundKind` (400 `VALIDATION_FAILED` avec `details` s'il manque ; 409 `DRAW_INCONSISTENT` s'il n'est pas permis).
- Ordre : un tour ne peut pas précéder un tour déjà tiré (`KNOCKOUT_ROUND_ORDER`) ; le PLAYOFF n'est possible que tant qu'aucun tour de phase finale n'a été tiré.
- Contrôles au tirage et à la validation : chaque affiche a deux côtés, tout le vivier du tour est tiré sans doublon, un vivier impair est refusé (sauf barrages, où seuls les barragistes sont tirés, jamais un premier de poule, RG14).
- Gardes de taille : un tirage `ROUND_OF_16` porte exactement 16 joueurs (demande de l'utilisateur) ; un tirage `FINAL` exactement 2, **contrainte d'intégrité technique et non règle produit** : sans elle, il n'y aurait pas un seul champion (`finalStage: CHAMPION`). Aucune autre contrainte de taille : on n'invente pas de règle de barrage.

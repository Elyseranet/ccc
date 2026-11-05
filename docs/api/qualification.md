# API administrateur : qualification, départages et tirage de tour (B-13)

Contrat des routes sous `/api/v1`, publié avant le code pour F-24 et F-25. Les DTO sont dans `src/interfaces/qualification.interface.ts` (nouveaux) et `src/interfaces/draw.interface.ts` (existants). Toutes ces routes exigent le rôle `ADMIN` : **401** `UNAUTHORIZED` sans session, **403** `FORBIDDEN` pour un participant, rôle vérifié avant toute lecture du corps. Réponses `Cache-Control: no-store`, erreurs au format `IApiError`, corps JSON validés par schéma `zod` strict (champ inconnu : **400** `VALIDATION_FAILED`). `{id}` d'une édition accepte l'UUID ou le code.

**Pas d'`If-Match`** : ni l'édition ni les tirages n'ont de version ; l'idempotence vient de l'état, comme pour le tirage des poules (B-11). **Aucun aléa côté serveur** (A1, RG12) : le tirage est physique, le serveur enregistre les affiches.

## Routes

| Route | Corps | Réponse | Rôle |
|---|---|---|---|
| `GET /admin/editions/{id}/qualification` | query facultative `?topPerPool=&bestNextCount=` | `200` `IQualificationStatus` | État de la qualification sans rien écrire : classements, matchs bloquants, égalités à départager, départages créés, qualifiés calculés |
| `POST /editions/{id}/qualification` | `IQualificationParameters` | `200` `IQualificationResult` | Arrête la liste des qualifiés (RG18) et passe l'édition à `QUALIFIED` |
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

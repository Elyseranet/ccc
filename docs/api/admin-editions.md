# API administrateur : éditions, identité, participants (B-10)

Routes sous `/api/v1`. Les DTO sont dans `src/interfaces/` (`edition.interface.ts`, `competitor.interface.ts`), les schémas dans `src/schemas/`, la logique dans `src/services/edition.service.ts` et `competitor.service.ts`.

Toutes ces routes exigent le rôle `ADMIN` : **401** sans session, **403** pour un participant. Les corps JSON sont validés par schéma `zod` strict (limite 16 Ko) : tout champ inconnu donne **400** `VALIDATION_FAILED`. `{id}` accepte l'UUID ou le code d'une édition (`2027b`).

Chaque écriture journalise un événement structuré avec `userId` et `editionId` (ou `competitorId`), sans donnée personnelle : `edition_created`, `edition_updated`, `competitor_updated`, `participant_added`, `participant_removed`.

## `POST /api/v1/editions`

Corps : `{ year, name, heldOn?, description?, location? }` (`heldOn` au format `YYYY-MM-DD`, date calendaire réelle ; `year` entre 2000 et 2100). Réponse **201** : `IEditionSummary`, statut `CREATED`, origine `APP`.

`code` et `chronologicalRank` sont calculés sous verrou (`pg_advisory_xact_lock`) : des créations simultanées ne produisent ni doublon ni trou.
- `chronologicalRank` : rang le plus élevé existant + 1. Le rang suit donc l'ordre de **création**, et l'ACP (5 dernières éditions) suit ce rang : une édition créée après coup pour une date antérieure serait mal ordonnée.
- `code` (`buildEditionCode`, `src/utils/edition-code.util.ts`) : `2027` pour la première édition de l'année, puis `2027b`, `2027c`… Le suffixe suit toujours le plus grand déjà utilisé (`2012a`, `2012b` donnent `2012c`). Règle tranchée (CE-1, décision du 2026-10-21, `docs/design/ux/decisions.md`) : le serveur génère le code, et un `code` dans le corps donne 400. 409 `EDITION_CODE_EXHAUSTED` après `z`.
- Une insertion concurrente hors verrou (import, script) qui prendrait le même code ou le même rang donne un **409** `EDITION_CONFLICT`, jamais un 500.

## `PATCH /api/v1/editions/{id}`

Corps : `{ name?, heldOn?, description?, location? }`, un champ au moins. **R-9 : `code` est immuable.** `code`, `year`, `chronologicalRank` et `status` sont refusés en **400**. **409** `EDITION_CLOSED` si l'édition est `CLOSED`. Réponse **200** : `IEditionSummary`. Le changement invalide l'ETag public de l'édition.

## `PATCH /api/v1/competiteurs/{id}`

Corps : `{ displayName?, firstName?, lastName?, nickname? }`, un champ au moins. Pas d'avatar (`PUT /competiteurs/{id}/avatar`, B-16), pas de téléphone. **404** `COMPETITOR_NOT_FOUND`. Réponse **200** : `ICompetitorPublic`. Le changement invalide l'ETag public des éditions où le compétiteur est inscrit.

## `POST /api/v1/editions/{id}/participants`

Corps, exactement l'une des deux formes :
- `{ "competitorId": "<uuid>" }` rattache un compétiteur existant (**404** `COMPETITOR_NOT_FOUND` s'il n'existe pas) ;
- `{ "newCompetitor": { email, firstName, lastName, nickname?, phone? } }` crée, en une transaction, le compétiteur, le compte `INVITED`, l'invitation (service `createCompetitorWithAccount`, B-09) et la participation. **409** `EMAIL_ALREADY_USED` si l'email est pris ; rien n'est écrit.

Réponse **201** : `IAddParticipantResult` (`IEditionParticipant` + `invitationSent`). `invitationSent` vaut `null` pour un compétiteur existant. Pour un nouveau compétiteur, l'email d'invitation part **après le commit** de la transaction, par le port mail de B-09 : `true` si l'envoi réussit, `false` s'il échoue (le compte et l'inscription existent, l'échec est journalisé sans email ni jeton, et le renvoi passe par `POST /competiteurs/{id}/invitation`).

La première inscription fait passer l'édition de `CREATED` à `REGISTRATION`.

| Statut | Code | Cas |
|---|---|---|
| 409 | `PARTICIPANT_ALREADY_REGISTERED` | compétiteur déjà inscrit (invariant 1), y compris sous concurrence |
| 409 | `REGISTRATION_CLOSED` | tirage des poules validé, ou édition au-delà de `REGISTRATION` (l'ajout reste permis pendant un brouillon : B-11 refusera la validation s'il reste un inscrit non affecté, Q2) |
| 409 | `EDITION_CLOSED` | édition `CLOSED` |

## `DELETE /api/v1/editions/{id}/participants/{participationId}`

Retire un inscrit tant que le tirage des poules n'est **pas validé** (Q1). Pendant un tirage `DRAFT`, le retrait est permis et supprime, dans la même transaction, l'affectation de la participation dans le brouillon. Réponse **204**. **404** si la participation n'appartient pas à l'édition. **409** `REGISTRATION_CLOSED` une fois le tirage validé (ou l'édition au-delà de `REGISTRATION`) ; **409** `EDITION_CLOSED`. L'édition reste en `REGISTRATION` même si le dernier inscrit est retiré.

## `GET /api/v1/admin/editions/{id}/participants`

Inscrits vus par l'administrateur : `IAdminParticipant[]` = `IEditionParticipant` + `editionsPlayed` (toutes éditions, même calcul que la liste des compétiteurs) + `account`. `account` vaut `null` pour un compétiteur sans compte (archive), sinon `{ state, invitationExpiresAt }` avec `state` = `ACCOUNT_STATE` : `INVITED` (invitation la plus récente ni consommée ni expirée), `INVITATION_EXPIRED` (expirée, remplacée, ou absente), `ACTIVE` (`invitationExpiresAt: null`). **Aucun email ni téléphone.** `Cache-Control: no-store`. 401 / 403 hors administrateur, 404 si l'édition est inconnue. Le renvoi d'invitation passe par `POST /competiteurs/{id}/invitation` (B-09).

# T-SEC-08 — Scores : `If-Match` facultatif sur l'enregistrement et la validation

- **Origine** : revue de sécurité de la vague 3a, finding LOW L4, le 2026-10-22.
- **Statut** : À faire. Hors vague 3a. Contient une **question ouverte** à poser à l'utilisateur.
- **Fichiers** : `src/server/api/v1/matchs/[id]/score.put.ts` et `validation.post.ts` (`ifMatchRequired: false`), `src/utils/match-score-route.util.ts`, `src/services/match.service.ts`.

## Constat

- `PUT /matchs/{id}/score` et `POST /matchs/{id}/validation` acceptent une requête sans `If-Match`.
- Deux administrateurs qui saisissent le même match peuvent donc s'écraser (« lost update »).
- Le `SELECT … FOR UPDATE` sérialise les écritures, mais il ne détecte pas qu'un administrateur a travaillé sur une version périmée.
- La correction (`POST /matchs/{id}/correction`, A15) n'est pas concernée par ce constat.

## Question ouverte (utilisateur)

- **Q1** : rendre `If-Match` obligatoire (428 sans en-tête, 412 si la version a changé), ce qui oblige le front à envoyer l'ETag lu ? Ou assumer « le dernier écrit gagne » pour l'enregistrement et la validation ?

## Critères d'acceptation

- [ ] Comportement conforme à Q1, couvert par des tests d'API (sans en-tête, ETag périmé, ETag à jour).
- [ ] Contrat front mis à jour (`docs/api/matchs.md`), coordonné avec le `frontend-lead`.

- **Q1 tranchée par l'utilisateur (2026-10-28)** : voir `decisions.md`, « SEC-Q ».

## Contrat figé avec le `frontend-lead` (2026-11-01), commun à T-SEC-08 et T-SEC-10 L1

Décision utilisateur SEC-Q (T-SEC-08 Q1, T-SEC-10 Q1) : contrôle de version **obligatoire**. Un seul dev, `dev-b12`, porte les deux tickets dans une seule branche.

**Routes concernées** :
- `PUT /matchs/{id}/score` ;
- `POST /matchs/{id}/validation` ;
- `PATCH /competiteurs/{id}` ;
- `POST /matchs/{id}/correction` : **alignée sur 428 et 412** (décision utilisateur, `decisions.md`, f924eda). Elle répondait 400 sans en-tête et 409 `MATCH_VERSION_CONFLICT` si la version était périmée. `MATCH_VERSION_CONFLICT` disparaît au profit de `VERSION_CONFLICT`. Amender `docs/api/matchs.md` dans la branche ; l'amendement de la Spec API sera soumis à l'utilisateur au merge.

**Source de la version** : un champ `version: number` dans le DTO lu, pas d'ETag par élément (une liste ne peut pas en porter).
- Matchs : `IAdminMatch.version` (existe, `GET /admin/editions/{id}/matchs`).
- Compétiteur : `ICompetitorDetail.version` (ajout, `GET /competiteurs/{id}`), adossé à une nouvelle colonne `competitors.version` (`@VersionColumn`, migration avec `up`, `down` et rollback documenté). C'est **la version de l'identité** : nom affiché, prénom, nom et pseudo, c'est-à-dire ce qu'écrit le PATCH.
- **L'avatar n'avance pas la version.** La mise à jour de `competitors.updated_at` par l'avatar (M1, pour l'ETag des éditions) fixe la colonne `version` explicitement pour empêcher l'incrément automatique de TypeORM. Les routes avatar sont inchangées : `PUT` répond `{ avatarUrl }`, `DELETE` répond 204, sans If-Match.

**Format** : le front envoie `If-Match: "<version>"`, un ETag fort entre guillemets. Le serveur accepte aussi `<version>` et `W/"<version>"` (`IF_MATCH_VERSION_PATTERN`). Une valeur mal formée donne 400 `BAD_REQUEST`.

**Erreurs** (nouveaux membres de `API_ERROR_CODE`) :

| Cas | Statut | `code` | Corps |
|---|---|---|---|
| `If-Match` absent | **428** | `PRECONDITION_REQUIRED` | message seul |
| Version périmée | **412** | `VERSION_CONFLICT` | `details: { currentVersion: number }`. Pas l'état complet : le front recharge |

**Réponse d'une écriture réussie** : la nouvelle version est dans le corps, sans en-tête ETag.
- `PUT /matchs/{id}/score` répond `IAdminMatch`, avec `version` à jour.
- `POST /matchs/{id}/validation` et `/correction` répondent `IMatchValidationResult`, avec `match.version` à jour.
- `PATCH /competiteurs/{id}` répond **`ICompetitorIdentity extends ICompetitorPublic { version: number }`** (ajout ; la réponse était `ICompetitorPublic`).

**Tests attendus en plus des critères ci-dessus** :
- 428 et 412 sur chaque route concernée ;
- `details.currentVersion` exact ;
- une saisie puis une validation enchaînées avec la version renvoyée ;
- un PUT puis un DELETE d'avatar laissent `version` inchangée, mais changent l'ETag de l'édition ;
- la migration fait aller, retour et aller, puis `migration:generate` répond « No changes », et `db:seed:archives` s'applique toujours.

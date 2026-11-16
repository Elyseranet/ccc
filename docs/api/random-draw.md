# Tirage au sort par le serveur (B-26)

Amendement A1 (décision utilisateur 2026-11-16) : l'appli peut tirer au sort, la saisie du tirage physique reste possible. Spec API : « `POST /tirages/{id}/tirage-au-sort` ».

## `POST /api/v1/tirages/{id}/tirage-au-sort` (administrateur)

Tire le brouillon `{id}` (poules, ouvert par `POST /editions/{id}/tirages/poules`, ou tour, ouvert par `.../tirages/tour`) et écrit les affectations dans le brouillon, au format de `PUT /tirages/{id}/affectations`. Ne valide rien : relire, corriger au besoin par `PUT`, puis `POST /tirages/{id}/validation`.

- **Corps** facultatif : `{ "replace": true | false }` (défaut `false`), strict.
- **Réponse 200** : `IAdminDraw`, `status: "DRAFT"`, `assignments` remplies. `Cache-Control: no-store`.
- **Poules** : têtes de série (fixées à la création) une par poule, poule tirée au hasard ; autres inscrits poule après poule, `drawnOrder` à la suite des têtes de série ; tailles de poule au plus à un joueur d'écart, plus grandes poules d'abord.
- **Tour** : vivier du tour mélangé globalement (RG13, RG14) ; affiches 1..k, côtés 1 puis 2 ; barrages : premiers de poule exclus. Contrôle « tour complet » avant écriture.
- Hasard : `crypto.randomInt` + Fisher-Yates (`src/utils/random-draw.util.ts`, générateur injectable).

| Statut | Code | Cas |
|---|---|---|
| 400 | `VALIDATION_FAILED` | identifiant mal formé, corps non strict ou `replace` non booléen |
| 401 / 403 | `UNAUTHORIZED` / `FORBIDDEN` | sans session / participant |
| 404 | `NOT_FOUND` | tirage inconnu |
| 409 | `DRAW_DRAFT_STARTED` | le brouillon contient déjà un tirage (poules : une affectation avec `poolNumber` ; tour : une affectation) et `replace` n'est pas `true` |
| 409 | `DRAW_ALREADY_VALIDATED` | tirage déjà validé |
| 409 | `DRAW_SEED_WITHDRAWN` | poules : une tête de série s'est retirée, recommencer le tirage |
| 409 | `DRAW_INCONSISTENT` | tour : le vivier ne forme pas des affiches de deux joueurs (nombre impair…), tailles imposées non tenues ; brouillon intact |
| 409 | `QUALIFICATION_NOT_DONE`, `ROUND_NOT_COMPLETED`, `REGISTRATION_CLOSED`, `EDITION_CLOSED` | comme pour le `PUT` |

# Tirage au sort par le serveur, une étape à la fois (B-26)

Amendement A1 (décision utilisateur 2026-11-16) : l'appli peut tirer au sort, la saisie du tirage physique reste possible. Le tirage se fait **au clic, une étape à la fois** (écran projecteur) : rien n'est connu à l'avance, aucun état n'est gardé entre deux appels. Spec API : « `POST /tirages/{id}/tirage-au-sort` ».

## `POST /api/v1/tirages/{id}/tirage-au-sort` (administrateur, sans corps)

Tire la **prochaine étape** du brouillon `{id}` (poules, ouvert par `POST /editions/{id}/tirages/poules`, ou tour, ouvert par `.../tirages/tour`) parmi les joueurs restants, l'écrit dans le brouillon et ne valide rien. L'étape se déduit de l'état courant du brouillon, qu'il ait été saisi à la main ou tiré : on peut alterner saisie et clics.

**Réponse 200** (`Cache-Control: no-store`) : `IRandomDrawResult`

```json
{ "draw": { "…IAdminDraw, status DRAFT…": "" },
  "step": { "assignments": [ { "participationId": "…", "displayName": "…", "poolNumber": 2, "pairingIndex": null, "sidePosition": null, "drawnOrder": 7, "…": "" } ],
            "remaining": 5 } }
```

- `step.assignments` : ce qui vient d'être tiré, au format `IDrawAssignment` (noms compris). **Poules** : une affectation (`poolNumber` = poule du joueur). **Tour** : deux affectations (`pairingIndex` = numéro de l'affiche, `sidePosition` 1 et 2), ou une seule quand elle complète une affiche saisie à moitié.
- `step.remaining` : joueurs restant à tirer ; `0` = brouillon complet, l'écran propose la validation (`POST /tirages/{id}/validation`).
- `draw` : le brouillon entier à jour, pour que l'écran se resynchronise.

**Poules** (RG11, RG16) : les têtes de série sont **placées à la main d'abord** (`PUT /affectations`, `poolNumber` renseigné). Chaque clic tire un joueur parmi les restants et le place dans la première poule qui n'est pas à sa taille (poule après poule ; tailles au plus à un joueur d'écart, plus grandes poules d'abord). `drawnOrder` suit l'ordre des clics.

**Tour** (RG13, RG14) : hasard pur sur le vivier du tour (barrages : sans les premiers de poule), aucune contrainte de poule d'origine. Chaque clic tire la prochaine affiche, deux joueurs, au plus petit numéro d'affiche libre. Avant tout tirage, le tour entier est contrôlé comme à la validation.

Hasard : `crypto.randomInt`, tirage sans remise (étape de Fisher-Yates), `src/utils/random-draw.util.ts`, générateur injectable. Les écritures passent par le code de `PUT /tirages/{id}/affectations` : mêmes contrôles qu'une saisie manuelle. Deux clics simultanés sont sérialisés (verrous édition puis tirage) : jamais deux fois la même place.

| Statut | Code | Cas |
|---|---|---|
| 400 | `VALIDATION_FAILED` | identifiant mal formé |
| 401 / 403 | `UNAUTHORIZED` / `FORBIDDEN` | sans session / participant |
| 404 | `NOT_FOUND` | tirage inconnu |
| 409 | `DRAW_DRAFT_COMPLETE` | rien à tirer : tout le monde est déjà affecté |
| 409 | `DRAW_ALREADY_VALIDATED` | tirage déjà validé |
| 409 | `DRAW_SEED_WITHDRAWN` | poules : une tête de série s'est retirée |
| 409 | `DRAW_INCONSISTENT` | poules : une tête de série n'est pas encore placée dans une poule, ou les poules saisies à la main n'ont plus de place ; tour : vivier impair (barrages compris), taille imposée non tenue (16 aux huitièmes, 2 en finale) ; rien n'est écrit |
| 409 | `QUALIFICATION_NOT_DONE`, `ROUND_NOT_COMPLETED`, `REGISTRATION_CLOSED`, `EDITION_CLOSED` | comme pour le `PUT` |

Recommencer un brouillon déjà tiré : l'écran vide le brouillon (`PUT /affectations` avec la liste des seules têtes de série placées pour les poules, liste vide pour un tour) après confirmation, puis reclique.

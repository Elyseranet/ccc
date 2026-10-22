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

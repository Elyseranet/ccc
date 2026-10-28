# T-SEC-09 — Logs de migration et lecture du corps après un 408

- **Origine** : revue de sécurité de la vague 3a, findings LOW L5 et L6, le 2026-10-22.
- **Statut** : À faire. Hors vague 3a. Il n'y a pas de question ouverte : une seule correction possible pour chacun.

## L5 — Message brut de PostgreSQL dans les logs de migration

- **Où** : `src/utils/run-migrations.util.ts:30` et `src/utils/run-migrations-cli.util.ts:17` journalisent `error.message` dans `migrations_failed`.
- **Problème** : le message d'une erreur `pg` peut contenir le nom d'utilisateur, la base et l'hôte. Ces informations finissent dans `docker logs`.
- **Correctif** : journaliser `error.name` et le `code` SQLSTATE (ou `errno`), sans le message.

## L6 — Lecture du corps poursuivie après un 408

- **Où** : `src/utils/request-body.util.ts` (`readRequestBody`).
- **Problème** : après le dépassement du délai N3, la réponse 408 part, mais le flux de la requête continue d'être lu jusqu'au plafond `maxBytes`.
- **Correctif** : détruire le flux (`req.destroy()` ou équivalent) dès le dépassement, pour libérer la connexion.

## Critères d'acceptation

- [ ] L5 : test unitaire. Une erreur dont le message contient `user=`, `database=` ou `host=` n'apparaît pas dans le log.
- [ ] L6 : test unitaire. Après le délai, le flux est détruit et plus aucun octet n'est lu.

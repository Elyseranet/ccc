# T-SEC-09 — Logs de migration et lecture du corps après un 408

- **Origine** : revue de sécurité de la vague 3a, findings LOW L5 et L6, le 2026-10-22.
- **Statut** : **Fermé** (2026-11-02), mergé dans `develop` @ `5779571` ; voir « Fermeture ».

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

## Traitement (dev-b09, 2026-11-01)

L5 : `describeErrorForLog` (`log-sanitize.util.ts`) ne renvoie que `errorName` et `errorCode` (SQLSTATE, sinon `errno`) ; une sous-commande inconnue journalise un texte d'usage constant. L6 : écart avec le libellé du ticket, le flux est mis en pause au dépassement du délai puis détruit une fois la réponse 408 écrite, car `req.destroy()` ferme la socket et ferait perdre le 408 si on l'appelait avant l'écriture.

## Fermeture — 2026-11-02 (chef de projet)
- `feature/T-SEC-09` @ `de74ae2` (80f816b, 930003e, de74ae2, mergés ensemble), mergé dans `develop` @ `5779571`.
- **L5** : les logs de migration ne contiennent plus que `{ errorName, errorCode }` (`describeErrorForLog`). Un test prouve qu'aucun `user=`, `database=` ni `host=` n'apparaît, et que le code SQLSTATE 28P01 est conservé.
- **L6** : `readRequestBody` met la lecture en pause au dépassement du délai, puis détruit le flux une fois le 408 écrit. Le détruire plus tôt ferait perdre la réponse, et cet écart avec le libellé est noté plus haut. Un test réel le vérifie, et un contrôle de mutation (appel d'arrêt retiré) fait bien échouer le test.
- **Contrôles** :
  - dev-b09 et backend-lead : test:api 25 fichiers, 250 tests sur base neuve, test:run 607, typecheck vert, gitleaks propre ;
  - frontend-lead : Playwright complet **202 verts, 0 échec, 0 instable**, les 110 zones identiques à develop, et les écritures couvertes par l'e2e inchangées ;
  - chef de projet après le merge : typecheck vert, test:run 620.
- **Reste ailleurs** : rien.

# T-REL-02 — Livrer les pages des tickets fermés : accueil, joueurs, fiche joueur, face-à-face

- **Statut** : À faire. Ouvert le 2026-11-04 par le chef de projet (décision utilisateur du 2026-11-04).
- **Pilote** : `frontend-lead`.
- **Origine** : préparation de l'environnement de dev (T-OPS-04). Sur `develop` (975c617), `src/consts/page-delivery.const.ts` ne marque `delivered: true` que `ROUTES.EDITION` et `ROUTES.ADMIN_MORE`. Les pages des tickets mergés et fermés F-01 (accueil), F-04 (joueurs, fiche joueur) et F-05 (face-à-face) répondent donc 404 dans l'image de production (garde OPS-3). Le commentaire de `page-delivery.const.ts` prévoit pourtant que le ticket d'écran passe sa ligne à `true` quand l'écran est branché sur l'API réelle. Je ne sais pas si l'absence de bascule était un oubli ou un choix : aucun ticket ne le dit.

## Périmètre
1. Pour chacune de `ROUTES.HOME`, `ROUTES.PLAYERS`, `ROUTES.PLAYER` et `ROUTES.HEAD_TO_HEAD` :
   - vérifier que tous ses `endpoints` existent (aucun `pendingTicket`) et que la liste correspond aux appels réels de la page ;
   - passer `delivered: true`.
2. Les autres pages déjà mergées dont la ligne serait restée fausse (à vérifier, par exemple `ROUTES.EDITIONS`) : les lister, et les livrer seulement si leur ticket est fermé. Sinon, les signaler.
3. Mettre à jour `tests/e2e-release/page-delivery.spec.ts` (`DELIVERED_PAGES`).

## Critères d'acceptation
- [ ] `test:run` (dont `page-delivery.test.ts`) et typecheck verts.
- [ ] `test:release` vert, et preuve dans le conteneur : chaque page livrée répond 200, les pages non livrées répondent 404.
- [ ] Playwright complet vert ; il compte comme run mesuré de T-QA-06 si la charge est relevée.
- [ ] gitleaks propre ; `/security-review` sans high ni medium (une page livrée devient publique).

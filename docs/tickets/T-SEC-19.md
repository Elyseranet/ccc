# T-SEC-19 — `version` du compétiteur exposé sur la route publique

- **Statut** : À faire. Ouvert le 2026-11-05 par le chef de projet. Origine : revue de sécurité du diff de T-SEC-08-r3 (`develop...39c94c1`), défaut **low**.
- **Pilote** : `backend-lead`.

## Constat
`src/services/competitor.service.ts:304` et `:313` ajoutent `version` à `ICompetitorDetail`, qui est servi par la route **publique** `GET /api/v1/competiteurs/{id}` (`[id].get.ts`, sans authentification). Un visiteur anonyme peut donc lire le nombre de corrections d'identité d'un joueur. Ce n'est pas une donnée personnelle, mais c'est une métadonnée d'administration exposée à tous.

## À faire
- Ne renvoyer `version` que dans un DTO admin, par exemple `ICompetitorIdentity` ou une lecture admin dédiée, et la retirer du DTO public.
- Vérifier que F-13 (écran admin des compétiteurs) lit la version par la voie admin.
- Mettre à jour `docs/api/` et la Spec API.

## Critères d'acceptation
- [ ] Un test d'API prouve que la réponse publique ne contient pas `version`.
- [ ] La lecture admin la contient.
- [ ] test:api vert, `/security-review` propre.

# T-SEC-10 — Écritures admin : concurrence et cohérence des données

- **Origine** : seconde revue de sécurité de la vague 3a (`f4dd3e1`), findings LOW L1, L2, L3 et L5, le 2026-10-22.
- **Statut** : **Partiellement traité.** L1 est réglé par T-SEC-08-r3, mergé @ `4e87bfc` le 2026-11-05. Restent L2, L3 (avec B-14) et L5. Le ticket reste ouvert.
- **Lié à** : [T-SEC-08](T-SEC-08.md) (`If-Match` sur les scores), même question de fond pour L1.

## L1 — `updateCompetitorIdentity` sans transaction ni conflit

- **Où** : `src/services/competitor.service.ts:428` (`PATCH /competiteurs/{id}`).
- **Constat** : lecture puis `save` sans transaction ni contrôle de version. Deux administrateurs qui corrigent la même identité : le dernier écrit gagne, sans 409.

### Question ouverte (utilisateur)

- **Q1** : faut-il un contrôle de version (`If-Match`, 412/428) sur la correction d'identité, comme celui qui sera décidé pour les scores dans T-SEC-08 ? Ou accepter « le dernier écrit gagne » ?

**Q1 tranchée (SEC-Q, 2026-10-28)** : contrôle de version obligatoire. Contrat figé avec le `frontend-lead` le 2026-11-01, commun avec T-SEC-08 : voir la section « Contrat figé » de [T-SEC-08](T-SEC-08.md) (`ICompetitorDetail.version`, `ICompetitorIdentity`, 428 `PRECONDITION_REQUIRED`, 412 `VERSION_CONFLICT`, l'avatar n'avance pas la version). L1 est porté par le même dev et dans la même branche que T-SEC-08.

## L2 — `loadCareers` calcule les carrières de tous les compétiteurs

- **Où** : `src/services/competitor.service.ts:121`, appelé par `src/services/edition.service.ts:493` (participants admin, G1) pour `editionsPlayed`.
- **Constat** : aucun filtre par `competitorIds`. Le calcul porte sur tous les compétiteurs pour n'en afficher que les participants d'une édition.
- **Impact** : coût seulement. Avec environ 146 compétiteurs, je ne sais pas si c'est mesurable aujourd'hui ; la revue ne le chiffre pas.
- **Correctif** : paramètre optionnel `competitorIds` filtrant la requête.

## L3 — Les écritures de score ne verrouillent pas l'édition

- **Où** : `src/services/match.service.ts` (verrou `lockMatch`, `FOR UPDATE` sur la ligne du match, l. 56-58 ; écritures l. 121-135 et 150 et suivantes).
- **Constat** : le match est verrouillé, mais pas l'édition. Une clôture d'édition (B-14, à venir) peut donc croiser une correction de score.
- **Correctif** : à traiter avec B-14. Verrouiller la ligne de l'édition (`FOR SHARE` côté score, `FOR UPDATE` côté clôture), ou revérifier le statut de l'édition sous verrou.

## L5 — `heldOn` sans cohérence avec `year`

- **Où** : `src/server/schemas/edition.schema.ts` (`createEditionSchema`, `updateEditionSchema`).
- **Constat** : depuis L4 (corrigé dans la vague 3a, commit `86e69d2`), l'année de `heldOn` est bornée à 2000..2100. Elle peut encore différer de `year`, par exemple une édition 2027 tenue le 2030-01-01.
- **Correctif** : refuser en 400 une date dont l'année diffère de `year`. Pour `PATCH`, comparer à l'année stockée.

## Critères d'acceptation

- [ ] L1 conforme à Q1, avec des tests d'API.
- [ ] L2 : le calcul ne porte plus que sur les compétiteurs demandés (test de service).
- [ ] L3 : test de concurrence (clôture contre correction) avec B-14.
- [ ] L5 : tests unitaires des schémas et test d'API du `PATCH`.

- **Q1 tranchée par l'utilisateur (2026-10-28)** : voir `decisions.md`, « SEC-Q ».


## Avancement (2026-11-05)

- **L1 réglé** au merge `4e87bfc` :
  - `PATCH /competiteurs/{id}` exige `If-Match` (428 si l'en-tête manque, 412 `VERSION_CONFLICT` si la version est périmée) ;
  - la ligne est verrouillée en `pessimistic_write` dans une transaction ;
  - la colonne `competitors.version` est ajoutée.
  Preuves : voir la fermeture de T-SEC-08.
- **Restent ouverts** : L2, L3 (à traiter avec B-14) et L5.

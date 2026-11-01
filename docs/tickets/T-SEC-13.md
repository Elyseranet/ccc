# T-SEC-13 — Tirages : limite de débit sur les routes et coût de la proposition de têtes de série

- **Origine** : revue de sécurité de B-11 (`e383717..e3910c2`), finding LOW L4, le 2026-11-01.
- **Statut** : À faire. Hors B-11.

## Constat (d'après la revue, à revérifier au traitement)

- Les 5 routes du tirage ne passent par aucun `enforceRateLimit` :
  - `GET /editions/{id}/tetes-de-serie` ;
  - `POST /editions/{id}/tirages/poules` ;
  - `PUT /tirages/{id}/affectations` ;
  - `POST /tirages/{id}/validation` ;
  - `GET /admin/editions/{id}/tirages`.
  Les écritures sont réservées à l'admin, ce qui limite l'exposition. Je ne sais pas si la route des têtes de série est publique ou réservée à l'admin dans la version mergée : à vérifier.
- `loadSeedRanking` charge tout l'historique des participations pour calculer l'ACP des inscrits.

## À faire

- Budget de débit : celui des lectures publiques (`PUBLIC_READ`) si la route des têtes de série est publique, et une clé dédiée pour les écritures admin.
- Restreindre `loadSeedRanking` aux compétiteurs inscrits à l'édition et aux 5 dernières éditions closes (A8), avec le même résultat.

## Critères d'acceptation

- [ ] Tests d'API : 429 avec `Retry-After` au-delà du budget.
- [ ] Test sur données réelles : proposition de têtes de série identique avant et après la restriction.

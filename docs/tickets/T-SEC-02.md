# T-SEC-02 — Sécurité liée au déploiement : IP derrière proxy, SSL PostgreSQL

- **Origine** : `/security-review` de `feature/integration-wave1` (6b56a5c), le 2026-10-20. Ce sont deux constats qui dépendent du mode de déploiement, et celui-ci n'est pas encore défini (ARCHITECTURE.md, « Hébergement et mode de déploiement : non spécifiés »).
- **Statut** : Bloqué. Il attend la décision d'hébergement.
- **Dépendances** : B-01 (limiteur de débit, DataSource).

## Constats

1. **IP client derrière un reverse proxy**
   - `enforceRateLimit` lit l'IP de la connexion socket (`getRequestIP(event)` sans `xForwardedFor`).
   - Derrière un proxy, tous les clients partagent l'IP du proxy : le limiteur de `?q=`, du login et de `/health` devient global.
   - Lire `X-Forwarded-For` sans condition permettrait au contraire de contourner la limite en falsifiant l'en-tête.
2. **Connexion PostgreSQL sans SSL**
   - `buildDataSourceOptions` ne configure pas `ssl`.
   - C'est acceptable en local (Docker, réseau interne), mais pas si la base est joignable par un réseau non maîtrisé.

## À faire, une fois l'hébergement choisi

- Ne lire `X-Forwarded-For` que si la requête vient d'un proxy de confiance. La liste des proxys passe par une variable d'environnement, par exemple `NUXT_TRUSTED_PROXIES`. Ensuite, prendre l'adresse la plus à droite qui n'est pas un proxy de confiance.
- Activer `ssl` sur la DataSource selon l'environnement (`NUXT_DATABASE_SSL`, et le certificat CA si le fournisseur l'exige), sans aucun secret en dur.

## Critères d'acceptation

- [ ] Test : un `X-Forwarded-For` envoyé par un client non approuvé est ignoré ; envoyé par un proxy approuvé, il est pris en compte.
- [ ] Test : la DataSource active `ssl` quand la variable est positionnée.
- [ ] Le README documente les deux variables.
- [ ] `/security-review` est relancé sur la branche.

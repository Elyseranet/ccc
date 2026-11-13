# T-SEC-02 — Sécurité liée au déploiement : IP derrière proxy, SSL PostgreSQL

- **Origine** : `/security-review` de `feature/integration-wave1` (6b56a5c), le 2026-10-20. Ce sont deux constats qui dépendent du mode de déploiement, et celui-ci n'est pas encore défini (ARCHITECTURE.md, « Hébergement et mode de déploiement : non spécifiés »).
- **Statut** : **Fermé** (2026-11-13), mergé @ `da7319a6` (doc seule, branche `d7687eb4`, backend-lead). Le nombre de proxys a été mesuré sur la dev : `NUXT_TRUST_PROXY_HOPS = 1`. Le SSL PostgreSQL n'est pas nécessaire (décision utilisateur PROD-HOSTING). La variable de prod sera posée à la création de l'application de production dans Coolify (voir « Mesure »).
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

## Point 2026-10-28 (chef de projet) — **laissé ouvert**
- **Fait** : la moitié IP. Une politique de confiance du proxy est en place (`NUXT_TRUST_PROXY_HOPS`, défaut 0, plage 0 à 5). On prend l'IP de X-Forwarded-For seulement si la socket est privée ou en boucle locale. Correctif f4dd3e1, mergé avec la vague 3a @ `640842b`, avec tests unitaires et d'API.
- **Reste** : SSL vers PostgreSQL.

## Mesure du nombre de proxys (backend-lead, 2026-11-13) — ticket fermé

Décision utilisateur PROD-HOSTING (`decisions.md`, 2026-11-13) : la production tourne sur le même Coolify chez Hetzner, avec PostgreSQL dans le réseau Docker interne. **Le SSL PostgreSQL n'est donc pas nécessaire** : la moitié « SSL » de ce ticket est close sans code.

Nombre de proxys devant l'app, mesuré sur la dev (`https://ccc.dev.elysera.net`, `NUXT_TRUST_PROXY_HOPS=1`, version `eb852eda`) :
- **Réseau** : `ccc.dev.elysera.net` et `coolify.elysera.net` résolvent tous deux vers 178.105.208.132, le même hôte, sans CDN devant. Certificat Let's Encrypt et `alt-svc: h3` : c'est Traefik (Coolify) qui termine le TLS. Aucun en-tête `via` ni `cf-ray`.
- **Sonde** : 31 requêtes `GET /api/v1/competiteurs?q=fo` (limite de 30 par minute et par IP), chacune avec un `X-Forwarded-For` forgé différent (198.51.100.1 à .31, plage de documentation). Les 30 premières répondent 200, la 31e 429 (requestId `4a9dace7-8a85-4946-96fc-a53eccfc0685`, 18:36:13Z).
- **Ligne de log lue dans Coolify** par le chef de projet (application ccc, env dev), recopiée telle quelle :
  `{"requestId":"4a9dace7-8a85-4946-96fc-a53eccfc0685","key":"competitors-search","ip":"92.162.253.0/24","event":"rate_limit_exceeded","level":"warn","timestamp":"2026-11-13T18:36:13.665Z"}`
- **Lecture** : `ip` est l'adresse publique du client qui a lancé la sonde, en 92.162.253.x, vérifiée de son côté. Ce n'est ni la valeur forgée (198.51.100.x), ni une adresse privée de Traefik. Le serveur prend donc bien l'entrée ajoutée par l'unique proxy, et ignore ce que le client met à gauche. **Un seul saut : `NUXT_TRUST_PROXY_HOPS = 1`.**
- **Production** : l'application de production n'existe pas encore dans Coolify. `NUXT_TRUST_PROXY_HOPS=1` sera posée à sa création, par le chef de projet. Si un CDN ou un autre proxy est ajouté devant Coolify, refaire cette mesure.
- **Tests du nombre de sauts retenu** (existants, mergés avec la vague 3a, `f4dd3e1`) : `tests/unit/client-ip.util.test.ts` (« takes the entry appended by the single trusted proxy », « ignores what the client forged on the left of the chain », chaîne trop courte, socket publique ignorée) et `tests/api/trusted-proxy-rate-limit.test.ts` (« keys the budget on the client address appended by the proxy »). Aucun code ajouté par ce ticket.
- README : la valeur mesurée est documentée dans la table des variables ; la mention « SSL PostgreSQL à faire » est remplacée par la décision PROD-HOSTING.

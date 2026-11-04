# T-OPS-04 — Environnement de dev sur Coolify pour les premiers tests de l'utilisateur

- **Statut** : À faire. Ouvert le 2026-11-04 par le chef de projet (demande et décisions utilisateur du 2026-11-04).
- **Pilote** : `backend-lead`. L'utilisateur saisit les réglages dans Coolify : l'équipe n'y a pas accès.

## Décisions utilisateur (2026-11-04)
- Instance de dev **sur Coolify**, sur un domaine de dev, avec l'image de production et une base PostgreSQL Coolify.
- Mail : **Mailpit déployé sur Coolify**. Les invitations sont capturées, aucun vrai mail ne part.
- Code déployé : **`develop` tel quel**, redéployé à chaque merge.

## Livrable
Un guide pas à pas dans le README (section « Environnement de dev »), vérifié sur le code de `develop` :
1. Ressources Coolify : application (dépôt, branche `develop`, `Dockerfile`), PostgreSQL, Mailpit.
2. Liste exacte des variables à saisir, avec des valeurs d'exemple et sans aucun secret réel : `NUXT_PUBLIC_SITE_URL`, mail (`NUXT_MAIL_HOST`, `NUXT_MAIL_FROM`…), base, `NUXT_AUTH_DEVICE_COOKIE_SECRET`, `NUXT_TRUST_PROXY_HOPS=1`, `NUXT_AUTH_ALLOWED_ORIGINS` si besoin.
3. Healthcheck Coolify sur `/api/v1/health`.
4. Après déploiement : chargement des archives (`ccc-ops`), création du premier admin, lien d'invitation lu dans Mailpit.
5. Ce que l'utilisateur peut tester (pages livrées sur `develop`), et ce qui répond 404 (garde OPS-3).

## Point à vérifier avant d'écrire le guide
La garde PROD-1 refuse un `NUXT_MAIL_HOST` sans point (nom de service nu, L2 de la revue T-SEC-06). Dans Coolify, Mailpit est joignable par un nom de service interne, souvent sans point. Il faut établir comment l'app joint Mailpit sans exposer le SMTP publiquement. Si cela demande d'assouplir la garde, c'est un **arbitrage utilisateur** : le remonter, ne pas trancher.

## Critères d'acceptation
- [ ] Guide relu par le chef de projet, chaque commande vérifiée sur `develop`.
- [ ] Aucun secret dans le dépôt (gitleaks).
- [ ] L'utilisateur confirme que `/api/v1/health` répond 200 sur le domaine de dev.

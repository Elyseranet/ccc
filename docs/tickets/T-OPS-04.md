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

## Point du 2026-11-04 (chef de projet) — guide mergé, ticket laissé ouvert
- Guide `README.md`, section « Environnement de dev sur Coolify (T-OPS-04) », branche `docs/T-OPS-04` @ `a9a6938`, mergé dans `develop` @ `e1551f1`. Relu par le chef de projet ; gitleaks propre (backend-lead).
- **Reste pour fermer** :
  - le domaine de dev et le nombre de proxys, à fournir par l'utilisateur ;
  - le montage par l'utilisateur, puis sa confirmation que `/api/v1/health` répond 200 et que `getent hosts mailpit.ccc.internal` résout ;
  - au merge de T-REL-02, compléter la liste « testable » avec `/editions` et `/regles`, que T-REL-02 livre aussi.
- Points non vérifiés, signalés dans le guide : le réglage réseau commun Coolify, le nom de variable `MP_UI_AUTH` et la version de l'image Mailpit.

## Montage du 2026-11-04 (chef de projet, via le navigateur de l'utilisateur, Coolify `coolify.elysera.net`, projet CCC, environnement dev)
- **Constat avant intervention** : application `ccc` sur la branche `develop` (source « Public GitHub »), mais **dernier déploiement le 2026-10-21, commit `5cc4f6f`**, manuel. Aucun redéploiement automatique : une source « Public GitHub » ne reçoit pas de webhook. Base vide (`/api/v1/stats` à 0), pages publiques en 404. Pas de Mailpit. Variables présentes : `NUXT_DATABASE_*` (5) et `NUXT_AUTH_DEVICE_COOKIE_SECRET`.
- **Mailpit** : service Coolify « Mailpit » (modèle), compose modifié avant le premier démarrage :
  - port SMTP `1025` **non publié** sur l'hôte (le modèle publiait `1025:1025`) ;
  - alias réseau `mailpit.ccc.internal` sur le réseau externe `coolify` ;
  - interface protégée par `MP_UI_AUTH=${SERVICE_USER_MAILPIT}:${SERVICE_PASSWORD_MAILPIT}`, des identifiants générés par Coolify, jamais saisis ni recopiés ;
  - image `axllent/mailpit` sans version figée (point à figer, voir « Reste »).
- **Variables ajoutées à l'application** : `NUXT_PUBLIC_SITE_URL=https://ccc.dev.elysera.net`, `NUXT_MAIL_HOST=mailpit.ccc.internal`, `NUXT_MAIL_PORT=1025`, `NUXT_MAIL_SECURE=false`, `NUXT_MAIL_FROM=CCC <no-reply@ccc.dev.elysera.net>` (littéral), `NUXT_TRUST_PROXY_HOPS=1` (aucun CDN : `ccc.dev.elysera.net` résout directement sur 178.105.208.132, comme `coolify.elysera.net`).
- **Redéploiement** de `develop` @ `0c74425` : image construite, sonde de santé `healthy` à la première tentative, mise à jour sans coupure, ancien conteneur retiré.
- **Dans le conteneur** : `getent hosts mailpit.ccc.internal` résout (`fde0:8c1:58a::f`, exit 0) ; `ccc-ops db:seed:archives` donne `{"editions":16,"competitors":146,"matches":729,"validatedMatches":554}`, exit 0.
- **Vérification externe** (curl, 20:53) : `/api/v1/health` 200 ; `/`, `/editions/2026`, `/editions/2025`, `/joueurs`, `/joueurs/face-a-face`, `/regles` 200 ; `/editions` 302 vers `/editions/2026` ; `/palmares`, `/connexion`, `/admin` 404 ; `/admin/plus` 302 vers `/connexion` ; `/api/v1/stats` : 16 / 146 / 729 / 554 ; aucun lien `/palmares` sur l'accueil. Certificat Let's Encrypt valide jusqu'au 2027-01-19.
- **Reste** :
  - **pas de redéploiement automatique** : chaque merge sur develop demande un « Redeploy » dans Coolify, tant qu'aucune source GitHub App ni webhook n'est branché ;
  - l'interface web de Mailpit n'est servie qu'en **http** sur une adresse `sslip.io` générée : les identifiants et les liens d'invitation y circulent en clair. Il faut un domaine https (par exemple `mail.ccc.dev.elysera.net`, DNS à créer) avant de l'utiliser ;
  - figer la version de l'image Mailpit ;
  - premier administrateur (`ccc-ops user:create-admin`) : laissé à l'utilisateur, c'est son identité ; utile seulement après F-10 (connexion et invitation) ;
  - la route de santé n'affiche pas encore la version déployée (T-OPS-03).

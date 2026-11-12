# T-SEC-06 — Garde PROD-1 : contournements de la configuration stricte

- **Origine** : revue de sécurité de la vague 3a (`5efed01..feature/integration-wave3a`), finding LOW L1, le 2026-10-22.
- **Statut** : **Fermé** le 2026-11-12. Code et tests mergés @ `207d1af5` ; preuve Docker faite (voir « Preuve Docker »). Q1 tranchée par l'utilisateur (SEC-Q).
- **2026-11-12 — mergé dans develop @ `207d1af5`** (branche @ `5d50f5ad`), sous GATE-DEV (décision utilisateur : merge develop = typecheck + test:run ; gates complètes à la PR vers main, [T-REL-04](T-REL-04.md)). Preuve : typecheck vert et test:run 1126 réussis / 1 ignoré / 0 échec sur le résultat des 5 merges (chef de projet, worktree temporaire). **Reste ouvert** jusqu'à ce que le lead confirme, critère par critère, ce qui est couvert par le code mergé et ce qui reste.
- **Fichiers** : `src/consts/runtime-config.const.ts` (`LOCAL_HOSTNAMES`, `STRICT_RUNTIME_CONFIG_OFF_VALUES`), `src/utils/runtime-config-guard.util.ts`, `src/server/plugins/runtime-config-guard.ts`, `src/utils/create-admin-cli.util.ts`.

## Constat

Avec `NUXT_STRICT_RUNTIME_CONFIG` actif, la garde laisse passer :
- `NUXT_PUBLIC_SITE_URL` sur `::1`, `[::1]`, `0.0.0.0` ou un sous-domaine `*.localhost` ;
- `NUXT_MAIL_HOST` à `0.0.0.0`, `[::1]` ou un nom de service sans point (`mailpit`) ;
- `NUXT_MAIL_FROM` laissé à sa valeur par défaut (`no-reply@ccc.local`) ;
- `auth.secureCookie=false` (`NUXT_AUTH_SECURE_COOKIE`), non contrôlé ;
- les identifiants SMTP (`NUXT_MAIL_USER`, `NUXT_MAIL_PASSWORD`), non contrôlés.

Par ailleurs, `NUXT_STRICT_RUNTIME_CONFIG=false`, `0` ou vide désactive toute la garde, alors que l'image pose `true`. Les commentaires « Aucun contournement : pas de mode recette » (`src/utils/runtime-config-guard.util.ts:38`) et « Aucun mode recette » (`Dockerfile:68`) sont donc inexacts.

## Question ouverte (utilisateur)

- **Q1** : faut-il refuser au démarrage `NUXT_STRICT_RUNTIME_CONFIG=false` dans l'image de production, ce qui interdirait tout mode recette sur cette image ? Ou garder la désactivation possible, en la journalisant en `warn` au démarrage ?

## À faire (hors Q1)

- Compléter la liste des hôtes locaux : `::1`, `[::1]`, `0.0.0.0`, `*.localhost`, et un nom d'hôte SMTP sans point.
- Refuser le `from` par défaut et `secureCookie=false` en mode strict.
- Décider si l'absence d'identifiants SMTP est refusée. Cela dépend du fournisseur SMTP, qui n'est pas encore choisi (A3).
- Corriger ces deux commentaires.

## Critères d'acceptation

- [ ] Tests unitaires de `assertStrictRuntimeConfig` pour chaque valeur listée ci-dessus.
- [ ] Les messages nomment les variables, jamais leurs valeurs.
- [ ] Preuve Docker : refus au démarrage avec une configuration fautive, démarrage réussi avec une configuration valide.

- **Q1 tranchée par l'utilisateur (2026-10-28)** : voir `decisions.md`, « SEC-Q ».

## Traitement (dev-b09, 2026-11-01)

- **Q1 (tranchée)** : un fichier marqueur `/app/.ccc-production-image`, posé par le Dockerfile dans l'étage runner et propriété de root, désigne l'image de production. `assertStrictRuntimeConfig` reçoit `productionImage` (calculé par `isProductionImage()`, le même appel pour le plugin Nitro et `user:create-admin`). Marqueur présent et `NUXT_STRICT_RUNTIME_CONFIG` éteint ou absent : le démarrage échoue avec un message qui nomme la variable. Marqueur absent : comportement inchangé (faux par défaut). Limite assumée : root dans le conteneur ou une reconstruction de l'image peut retirer le marqueur.
- Hôtes locaux refusés : `localhost`, `127.0.0.1`, `::1`, `[::1]`, `0.0.0.0`, `*.localhost` (site et SMTP) ; hôte SMTP vide ou sans point (`mailpit`). `from` vide ou resté au défaut (`@ccc.local`) refusé. `secureCookie=false` refusé.
- **Identifiants SMTP non rendus obligatoires** : le fournisseur de production n'est pas choisi (A3) et certains relais n'exigent pas d'identifiants. À revoir quand il le sera.
- Commentaires inexacts corrigés (`runtime-config-guard.util.ts`, `Dockerfile`). Les messages nomment les variables, jamais leurs valeurs (testé avec un faux secret).
- **`docker-compose.local.yml` supprimé** (décision utilisateur, usage local de l'image : `npm run dev` seulement, voir `decisions.md`). Il ne servait qu'au démarrage local de l'image, désormais impossible sans configuration stricte valide. Le commentaire de `docker-compose.yml` qui y renvoyait est retiré. `docs/tickets/T-OPS-01.md` (archive d'un ticket fermé) n'est pas modifié.

## Revue de sécurité de f2bbb02 (2026-11-02), corrections de dev-b09

- **M1** : les hôtes sont normalisés par `URL` avant comparaison (minuscules, point final et crochets IPv6 retirés, formes numériques comme `127.1` ou `2130706433` ramenées à `127.0.0.1`) puis comparés par `net.BlockList` aux plages `LOCAL_ADDRESS_RANGES` (`src/consts/runtime-config.const.ts`) : tout `127.0.0.0/8`, `0.0.0.0`, `::`, `::1`, et les IPv4 mappées sous toutes leurs formes. Restent refusés par nom : `localhost` et `*.localhost`. Cas couverts par les tests : `localhost.`, `a.localhost.`, `[::ffff:127.0.0.1]`, `[::ffff:7f00:1]`, `[0:0:0:0:0:ffff:7f00:1]`, `[::]`, `127.0.0.2`, `127.255.255.254`, `127.1`, `2130706433`.
- **M2** : l'hôte SMTP passe par la même normalisation et le même prédicat ; une IPv6 sans crochets (valeur acceptée par nodemailer) est reconnue ; une adresse IP publique reste acceptée.
- **L1** : le `from` par défaut est comparé sur le domaine **exact** `ccc.local` (avec ou sans nom affiché, sans point final, insensible à la casse), plus sur une fin de chaîne.
- **Plages privées et link-local (décision utilisateur du 2026-11-02)** : refusées pour `NUXT_PUBLIC_SITE_URL` seulement (10/8, 172.16/12, 192.168/16, 169.254/16, fc00::/7, fe80::/10, IPv4 mappées comprises ; constante `PRIVATE_ADDRESS_RANGES`, vérifiées par `BlockList`). L'hôte SMTP les **accepte**, pour un relais interne de Coolify : tests `10.0.0.25`, `172.20.0.5`, `192.168.1.25`, `fd00::25`, `[fd00::25]`, `169.254.1.1`, `fe80::1` et `[::ffff:10.0.0.25]` acceptés. Message du site : « NUXT_PUBLIC_SITE_URL must be a public https URL (no localhost, private or link-local address) ».
- **L2** (Low, non bloquant) : les noms de service SMTP sans point (`postfix`, `mailpit`) sont refusés (`smtpHostViolation`), voulu et documenté (README, `.env.example`). À reconsidérer si le fournisseur choisi (A3) l'exige. La revue signalait aussi les IPv6 littérales : **vérifié**, avec 3c43862 les IPv6 non locales sont acceptées (tests « public IPv6 SMTP host » `[2001:db8::25]` et « public IPv6 SMTP host without brackets » `2001:db8::25`, plus `https://[2001:db8::1]` pour le site) ; les IPv6 locales (`::`, `::1`, `[::ffff:127.0.0.1]`) restent refusées.
- **L3** (Low, non bloquant) : hors image, `isStrictRuntimeConfig` traite `''`, `false` et `0` comme désactivé. **Vérifié** : Nitro lit l'environnement avec `destr` (`nitropack/dist/runtime/internal/utils.env.mjs`), et `destr('null')` donne `null`, `destr('undefined')` donne `undefined` ; ces deux valeurs éteignent le mode strict (cas `null` et `undefined` des tests de la garde). Cela ne concerne que les lancements HORS image : dans l'image, le marqueur force le mode strict et un indicateur éteint, `null` ou `undefined` compris, fait refuser le démarrage (tests « marker present, flag off »). Non corrigé : `undefined` doit rester « éteint » pour la CLI (variable absente), et le runtime Nitro ne permet pas de distinguer `undefined` issu de la chaîne `"undefined"` d'une variable absente.
- **I4** (Info) : la CLI lit `NUXT_AUTH_SECURE_COOKIE` en chaîne brute, alors que `resolveSecureCookie` peut recevoir le nombre `0` via `destr`. `resolveSecureCookie(0)` renvoie `true` (cookie sécurisé, par lecture du code : seules `false`, `'false'` et `'0'` éteignent), alors que la CLI refuse `'0'` : l'incohérence va dans le sens du refus, sans danger. Un parseur partagé est possible, non fait.

## Revue de sécurité de adf4371..701f727 (2026-11-05), corrections de dev-b09

- **L1** : `mailFromDomain` n'admet plus que deux formes, `adresse` ou `Nom <adresse>`. L'adresse doit valider entièrement `ACCOUNT_EMAIL_PATTERN` (réutilisé, pas de seconde regex d'email ; déplacé dans `src/consts/email.const.ts` et ré-exporté par `account.const.ts`, car l'importer depuis `account.const.ts` tirait les types navigateur de `common-components.interface.ts` dans la compilation de la CLI et dans le projet serveur du typecheck) et son domaine doit être un nom d'hôte (`MAIL_FROM_DOMAIN_PATTERN` : étiquettes de lettres, chiffres et tirets, au moins deux). Toute autre forme est une violation (échec fermé) : `no-reply@ccc.local (x)`, `no-reply@ccc.local;`, `CCC <no-reply@ccc.local> x`, `a@b`, chaîne vide, nom sans adresse, `<adresse>` sans nom, deux adresses. Acceptés : `CCC <no-reply@ccc.example.org>`, `no-reply@ccc.example.org`, un nom entre guillemets.
- **L2** : `0.0.0.0/32` devient `0.0.0.0/8`. Les IPv6 qui embarquent une IPv4, NAT64 (`64:ff9b::/96`), 6to4 (`2002::/16`, IPv4 dans les octets 2 à 5) et IPv4-compatibles (`::/96`), voient leur IPv4 embarquée extraite par UNE fonction (`embeddedIPv4`, `runtime-config-guard.util.ts`, formes dans `EMBEDDED_IPV4_FORMS`) puis passée dans les mêmes `BlockList` IPv4 (locales, et privées pour le site). Une adresse publique de ces formes reste acceptée (témoins `[64:ff9b::808:808]`, `[2002:808:808::]`, `[::808:808]`). Constaté par un test, pas supposé : `net.BlockList` rapproche les adresses MAPPÉES des plages IPv4 mais NE rapproche PAS NAT64, 6to4 ni IPv4-compatibles (`check` renvoie `false`), d'où l'extraction.
- **L3** (`NUXT_AUTH_SECURE_COOKIE` lu en chaîne brute dans `create-admin-cli.util.ts`) : accepté, rien ne change. Quand la valeur arrive comme nombre `0` via `destr`, `resolveSecureCookie` garde le cookie sécurisé alors que la CLI lit `'0'` comme éteint et refuse : l'écart va dans le sens du refus.

## Point au 2026-11-12 (backend-lead), après le merge `207d1af5`

- **Critère 1 fait** : `tests/unit/runtime-config-guard.test.ts` couvre chaque valeur listée (hôtes locaux, `0.0.0.0/8`, IPv4 dans IPv6, adresses privées et link-local de l'URL du site, `from` par défaut, `secureCookie=false`, secret d'appareil, marqueur de l'image).
- **Critère 2 fait** : les messages nomment les variables, jamais leurs valeurs ; testé avec de faux secrets (`tests/unit/runtime-config-guard.test.ts`, cas `s3cret`). La revue de sécurité du diff le confirme.
- **Critère 3 reste** : la preuve Docker (refus au démarrage avec une configuration fautive, démarrage réussi avec une configuration valide) n'a pas été faite. Le ticket reste ouvert pour ce seul critère.
- **Hors critères, à revoir avec A3** : les identifiants SMTP ne sont pas rendus obligatoires, parce que le fournisseur n'est pas choisi (A3). À rouvrir dans un ticket quand A3 sera tranché.

## Preuve Docker (backend-lead, 2026-11-12)

Image de production construite depuis `a9ec8379` (develop + correctif T-OPS-05 ; avant ce correctif, l'image ne démarrait pas du tout). Chaque conteneur est lancé avec les variables en ligne de commande, sans `.env`, sur la base `ccc_bl_docker_test`. Résultats :

| Configuration | Résultat |
|---|---|
| Site `http://localhost:3000`, SMTP absent, `from` par défaut | sortie 1 : `Invalid production configuration (NUXT_STRICT_RUNTIME_CONFIG is on): NUXT_PUBLIC_SITE_URL must be a public https URL (…); NUXT_MAIL_HOST must name a real SMTP server (…); NUXT_MAIL_FROM must be set to a real sender, not the default` |
| Même configuration avec `NUXT_STRICT_RUNTIME_CONFIG=false` | sortie 1 : `NUXT_STRICT_RUNTIME_CONFIG cannot be turned off in the production image` (Q1, marqueur de l'image) |
| Site https, SMTP réel, mais `NUXT_AUTH_SECURE_COOKIE=false` | sortie 1 : `NUXT_AUTH_SECURE_COOKIE must not be turned off` |
| Secret d'appareil absent | sortie 1 : `NUXT_AUTH_DEVICE_COOKIE_SECRET is required in production (at least 32 characters)` |
| Configuration valide (site https, SMTP réel, `from` réel, secret de 32 octets) | migrations appliquées, serveur à l'écoute, `GET /api/v1/health` → 200 |

Les messages nomment les variables, jamais leurs valeurs : ni le mot de passe de la base ni le secret d'appareil n'apparaissent dans les logs (0 occurrence, vérifié avec `grep`).

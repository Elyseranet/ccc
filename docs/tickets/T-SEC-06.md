# T-SEC-06 — Garde PROD-1 : contournements de la configuration stricte

- **Origine** : revue de sécurité de la vague 3a (`5efed01..feature/integration-wave3a`), finding LOW L1, le 2026-10-22.
- **Statut** : À faire. Hors vague 3a (décision du `project-manager`). Contient une **question ouverte** à poser à l'utilisateur, à ne pas trancher sans lui.
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
- **Hors périmètre, non traité** : refuser les plages privées (10/8, 172.16/12, 192.168/16, fc00::/7) et link-local (169.254/16, fe80::/10) est une décision remontée au team-lead ; un relais SMTP du réseau interne de Coolify peut être légitime. Un test garde ce comportement (`10.0.0.25` accepté).
- **L2** (non bloquant) : les noms de service SMTP nus (sans point, comme `mailpit`) sont refusés. C'est voulu en production ; un relais interne nommé par un nom de service Docker ne passerait pas. À reconsidérer si le fournisseur choisi (A3) l'exige.
- **L3 et I4** : non bloquants, listés par le team-lead ; leur contenu exact ne m'a pas été communiqué (à compléter quand il le sera).

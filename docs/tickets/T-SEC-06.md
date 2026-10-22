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

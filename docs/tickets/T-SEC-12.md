# T-SEC-12 — Comptes et déploiement : création d'admin, CSRF, origine derrière proxy, secret d'appareil

- **Origine** : seconde revue de sécurité de la vague 3a, findings LOW L8 à L12, le 2026-10-22.
- **Statut** : **Fermé** le 2026-11-12. L8, L9, L10 et L12 mergés @ `207d1af5` ; L11 vérifié sur le déploiement de dev (voir « L11 vérifié »). L10 tranché par l'utilisateur (SEC-Q, Q1).
- **2026-11-12 — mergé dans develop @ `207d1af5`** (branche @ `5d50f5ad`), sous GATE-DEV (décision utilisateur : merge develop = typecheck + test:run ; gates complètes à la PR vers main, [T-REL-04](T-REL-04.md)). Preuve : typecheck vert et test:run 1126 réussis / 1 ignoré / 0 échec sur le résultat des 5 merges (chef de projet, worktree temporaire). **Reste ouvert** jusqu'à ce que le lead confirme, critère par critère, ce qui est couvert par le code mergé et ce qui reste.

## L8 — `user:create-admin` : course sur l'email

- **Où** : `src/utils/create-admin-cli.util.ts:45-47`. La vérification « un compte existe déjà » se fait hors transaction.
- **Constat** : en cas de course, c'est le message brut de la base qui s'affiche. Par ailleurs, `createAdminWithInvitation` ne normalise pas l'email lui-même : il dépend de son appelant.
- **Correctif** : intercepter la violation d'unicité (SQLSTATE `23505`) dans le CLI et afficher « Un compte existe déjà ». Normaliser l'email dans `createAdminWithInvitation`.

## L9 — Lien d'invitation admin en clair sur la sortie standard

- **Où** : `src/utils/create-admin-cli.util.ts:49`. C'est voulu (B-09), puisqu'il n'y a pas encore de SMTP en production.
- **À faire** : documenter dans le runbook de déploiement (README, `ccc-ops user:create-admin`) que le lien est un secret valable 7 jours. Il ne doit pas être copié dans un ticket ou un chat, et il faut lancer la commande dans un terminal sans journalisation partagée.

## L10 — Écriture acceptée sans `Origin` ni `Sec-Fetch-Site`

- **Où** : `src/utils/csrf.util.ts:23`.
- **Constat** : c'est documenté. Les cookies de session sont `SameSite=Lax`, ce qui couvre les requêtes intersites des navigateurs actuels.

### Question ouverte (utilisateur)

- **Q1** : accepter ce risque tel quel, ou refuser les écritures sans aucun de ces deux en-têtes ? Refuser bloquerait les clients non navigateurs, comme les scripts et `curl`.

## L11 — Origine propre reconstruite derrière le proxy

- **Où** : `src/server/middleware/10.auth.ts:28` (`getRequestURL(event).origin`, depuis `Host` et `X-Forwarded-Proto`).
- **Risque** : refuser des écritures légitimes (403 `FORBIDDEN_ORIGIN`) si le proxy de Coolify transmet un autre `Host` ou ne pose pas `X-Forwarded-Proto`.
- **Fait dans la vague 3a** : le README dit de le vérifier au premier déploiement, et de poser au besoin `NUXT_AUTH_ALLOWED_ORIGINS=https://<domaine>`.
- **Reste** : la vérification réelle, au premier déploiement.

## L12 — Secret du cookie d'appareil éphémère hors production

- **Où** : `src/utils/device-cookie.util.ts:21`. Hors `NODE_ENV=production`, un secret aléatoire est généré sans avertissement.
- **Correctif** : l'exiger quand `NUXT_STRICT_RUNTIME_CONFIG` est actif, dans la garde PROD-1. À traiter avec [T-SEC-06](T-SEC-06.md).

## Critères d'acceptation

- [ ] L8 : test de la course (violation d'unicité traduite en message clair) et normalisation de l'email.
- [ ] L9 : runbook à jour.
- [ ] L10 conforme à Q1.
- [ ] L11 : vérifié au premier déploiement, résultat consigné dans ce ticket.
- [ ] L12 : test de la garde stricte.

- **Q1 tranchée par l'utilisateur (2026-11-01)** : accepter tel quel et documenter. Voir `decisions.md`, « SEC-Q ».

## Traitement (dev-b09, 2026-11-01)

- **L8** : `createAdminWithInvitation` normalise l'email ; `user:create-admin` traduit la violation d'unicité 23505 de `users.email` (`isEmailCollision`, partagé avec `createCompetitorWithAccount`) en « Un compte existe déjà pour cet email. ». Tests : normalisation et course sur deux créations concurrentes (base).
- **L9** : runbook ajouté au README (section Authentification, après « Premier administrateur »).
- **L10** : accepté tel quel (SEC-Q Q1), documenté dans le README avec la raison.
- **L11** : déjà documenté (README, `NUXT_AUTH_ALLOWED_ORIGINS`) ; la vérification réelle reste à faire au premier déploiement.
- **L12** : `NUXT_AUTH_DEVICE_COOKIE_SECRET` d'au moins 32 caractères exigé par la garde stricte (voir T-SEC-06).

## Point au 2026-11-12 (backend-lead), après le merge `207d1af5`

- **L8 fait** : `tests/db/invitation-acceptance.test.ts` (« stores the email normalized », « a race on the same email surfaces as a recognizable unique violation, one admin remains ») ; `tests/unit/email-collision.util.test.ts` ; message « Un compte existe déjà pour cet email. » (`src/utils/create-admin-cli.util.ts:53,60`).
- **L9 fait** : runbook dans le README (Authentification, « Premier administrateur »).
- **L10 fait** : accepté tel quel (SEC-Q, Q1), documenté dans le README.
- **L12 fait** : garde stricte, secret d'appareil d'au moins 32 caractères : `tests/unit/runtime-config-guard.test.ts` (secret absent, indéfini, 31 caractères refusés ; 32 acceptés).
- **L11 reste** : vérifier au premier déploiement réel (Coolify) que l'origine reconstruite derrière le proxy est bien celle du domaine, ou poser `NUXT_AUTH_ALLOWED_ORIGINS`, puis consigner le résultat ici. Je ne sais pas si ce déploiement a déjà eu lieu : rien n'est consigné dans ce ticket. Le ticket reste ouvert pour ce seul point.

## L11 vérifié (backend-lead, 2026-11-12)

Requêtes réelles sur l'environnement de dev déployé par Coolify (`https://ccc.dev.elysera.net`, T-OPS-04 ; `NUXT_TRUST_PROXY_HOPS=1`). Écriture sans session, `POST /api/v1/auth/logout`, corps `{}` :

| En-tête `Origin` | Réponse |
|---|---|
| `https://ccc.dev.elysera.net` | **204** : l'origine reconstruite derrière le proxy est bien celle du domaine en https |
| `http://ccc.dev.elysera.net` | 403 `FORBIDDEN_ORIGIN` |
| `https://evil.example` | 403 `FORBIDDEN_ORIGIN` |

L'origine propre est donc reconstruite correctement, et `NUXT_AUTH_ALLOWED_ORIGINS` n'est pas nécessaire sur cet environnement. À refaire sur l'environnement de production, au premier déploiement, avec la même commande `curl`.

# T-SEC-12 — Comptes et déploiement : création d'admin, CSRF, origine derrière proxy, secret d'appareil

- **Origine** : seconde revue de sécurité de la vague 3a, findings LOW L8 à L12, le 2026-10-22.
- **Statut** : À faire. Hors vague 3a, sauf L11, documenté dans la vague (README, commit `cf960ac`). L10 contient une **question ouverte** à poser à l'utilisateur.

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

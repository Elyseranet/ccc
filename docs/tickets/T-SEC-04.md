# T-SEC-04 — Constats LOW de la revue de sécurité de la vague 2

- **Origine** : revue de sécurité de `feature/integration-wave2` @ 918308d, le 2026-10-20. Elle compte 0 critical, 0 high, 3 medium (corrigés avant merge) et 7 low. Ce ticket regroupe les low **non bloquants** qui ne sont pas traités dans la vague 2.
- **Statut** : À faire (L2, L3) ; L7 est fermé avec B-16.
- **Vague** : 3
- **Dépendances** : B-08 (mergé avec la vague 2).

## Constats

1. **L2 — `server/utils/auth/password.util.ts:10`** : scrypt (64 Mio, N=2^16) passe par le pool libuv. Des connexions simultanées peuvent saturer ce pool et ralentir tout le serveur.
   - Correctif : un sémaphore global de concurrence sur le hachage, dont le nombre de calculs simultanés vient de `runtimeConfig`. Au-delà, la requête répond 503 avec `Retry-After`.
   - Test : N+1 hachages simultanés donnent N calculs et une réponse 503.
2. **L3 — `server/utils/auth/session-token.util.ts:18-27`, plus `login.post.ts`, `logout.post.ts` et `middleware/auth.ts`** : l'attribut `Secure` et le préfixe `__Host-` du cookie dépendent de `process.env.NODE_ENV`. Un déploiement mal configuré, qui ne serait pas en `production`, servirait un cookie de session sans `Secure`.
   - Correctif : une option de configuration explicite, `runtimeConfig.auth.secureCookie` (`NUXT_AUTH_SECURE_COOKIE`), vraie par défaut, et désactivable seulement en développement local.
   - Test : avec l'option vraie, le cookie est `__Host-`, Secure, Path=/ et sans Domain ; avec l'option fausse, il n'est ni l'un ni l'autre.
3. **L7 — `server/schemas/auth.schema.ts:17-24`** : n'importe quelle URL https est acceptée comme avatar. Une image hébergée chez un tiers permet de suivre les visiteurs (IP, heure).
   - **Fermé par B-16** : l'URL d'avatar disparaît au profit d'un téléversement servi par l'API. Ce point sera fermé dans le même tour que le merge de B-16, avec le test « `avatarUrl` refusé par PATCH /moi » de B-16.

## Hors ticket

- **Dépendances** : couvert par `npm audit` et gitleaks sur le SHA final de la vague 2 (périmètre AUDIT-1 / T-SEC-01).
- **Import legacy (B-04)** : la revue ne l'avait pas relu (« je ne sais pas »). Une relecture de sécurité ciblée du parseur et de l'importer est faite pendant l'intégration de la vague 2 ; son résultat est consigné dans B-04.

## Critères d'acceptation

- [ ] L2 et L3 sont corrigés et testés comme décrit ci-dessus.
- [ ] Le README documente le sémaphore et `NUXT_AUTH_SECURE_COOKIE`.
- [ ] L7 est fermé avec le SHA du merge de B-16.

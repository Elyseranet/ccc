# T-SEC-04 — Constats LOW de la revue de sécurité de la vague 2

- **Origine** : revue de sécurité de `feature/integration-wave2` @ 918308d, le 2026-10-20. Elle compte 0 critical, 0 high, 3 medium (corrigés avant merge) et 7 low. Ce ticket regroupe les low **non bloquants** qui ne sont pas traités dans la vague 2.
- **Statut** : **Fermé** (2026-10-28), mergé dans `develop` @ `640842b` (vague 3a) ; voir « Fermeture ».
- **Vague** : 3
- **Dépendances** : B-08 (mergé avec la vague 2).

## Constats

1. **L2 — `../../src/server/utils/auth/password.util.ts:10`** : scrypt (64 Mio, N=2^16) passe par le pool libuv. Des connexions simultanées peuvent saturer ce pool et ralentir tout le serveur.
   - Correctif : un sémaphore global de concurrence sur le hachage, dont le nombre de calculs simultanés vient de `runtimeConfig`. Au-delà, la requête répond 503 avec `Retry-After`.
   - Test : N+1 hachages simultanés donnent N calculs et une réponse 503.
2. **L3 — `../../src/server/utils/auth/session-token.util.ts:18-27`, plus `login.post.ts`, `logout.post.ts` et `middleware/auth.ts`** : l'attribut `Secure` et le préfixe `__Host-` du cookie dépendent de `process.env.NODE_ENV`. Un déploiement mal configuré, qui ne serait pas en `production`, servirait un cookie de session sans `Secure`.
   - Correctif : une option de configuration explicite, `runtimeConfig.auth.secureCookie` (`NUXT_AUTH_SECURE_COOKIE`), vraie par défaut, et désactivable seulement en développement local.
   - Test : avec l'option vraie, le cookie est `__Host-`, Secure, Path=/ et sans Domain ; avec l'option fausse, il n'est ni l'un ni l'autre.
3. **L7 — `../../src/server/schemas/auth.schema.ts:17-24`** : n'importe quelle URL https est acceptée comme avatar. Une image hébergée chez un tiers permet de suivre les visiteurs (IP, heure).
   - **Fermé par B-16** : l'URL d'avatar disparaît au profit d'un téléversement servi par l'API. Ce point sera fermé dans le même tour que le merge de B-16, avec le test « `avatarUrl` refusé par PATCH /moi » de B-16.

4. **N1 — cookie d'appareil volé** (revue ciblée de integration-wave2 @ d5fcc33, 2026-10-21) : un attaquant qui possède un cookie d'appareil valide (SEC-A4) dispose d'un second flux d'essais, avec son propre compteur. Ce flux reste ralenti de la même façon (5 essais libres, puis 2^(n−5) s plafonnés à 300 s) et borné par la limite par IP. Il échappe en revanche au délai posé par les clients non reconnus.
   - Correctif à étudier : lier le cookie à une empreinte légère du client, ou plafonner le nombre d'essais cumulés sur tous les appareils d'un compte dans une fenêtre. Le changement de mot de passe révoque désormais les appareils (correctif N2, livré avant le merge de la vague 2).
   - Test : deux flux en parallèle (avec et sans cookie) ne dépassent pas le plafond global retenu.
5. **N3 — aucun délai applicatif sur la lecture du corps** : un client lent (slowloris) peut garder une requête ouverte tant que le corps n'est pas complet. Le plafond de 16 Kio (M2) borne la taille, pas la durée.
   - Correctif : un délai de lecture du corps en constante (par exemple 10 s), avec une réponse 408 au-delà, dans `readBoundedJsonBody`. Ou le documenter comme relevant du reverse proxy (Coolify/Traefik), ce qui renvoie à T-SEC-02.
   - Test : un corps envoyé plus lentement que le délai est interrompu en 408.

## Hors ticket

- **Dépendances** : couvert par `npm audit` et gitleaks sur le SHA final de la vague 2 (périmètre AUDIT-1 / T-SEC-01).
- **Import legacy (B-04)** : la revue ne l'avait pas relu (« je ne sais pas »). Une relecture de sécurité ciblée du parseur et de l'importer est faite pendant l'intégration de la vague 2 ; son résultat est consigné dans B-04.

## Critères d'acceptation

- [ ] L2 et L3 sont corrigés et testés comme décrit ci-dessus.
- [ ] Le README documente le sémaphore et `NUXT_AUTH_SECURE_COOKIE`.
- [ ] L7 est fermé avec le SHA du merge de B-16.

## Fermeture — 2026-10-28 (chef de projet)
- Vague 3a `feature/integration-wave3a` @ `7a59d09`, mergée dans `develop` @ `640842b` (2026-10-28).
- **Contrôles** :
  - backend-lead :
    - test:api 243/243 sur 97e27f9, aucun code serveur jusqu'à 7a59d09 ;
    - 5 passes de stabilité 243/243 sur 77fda80 ;
    - test:db 103 ; test:run 569 ; typecheck vert ; test:bundle vert ;
    - migrations up, down et up, puis generate « No changes » ;
    - seed : 16 / 146 / 729 / 554, Deseine inchangé ;
    - Docker : PROD-1 refusé puis démarré, T-OPS-02 sans aucune ligne `query:`, smoke sharp (EXIF retiré, image réorientée ; image arm64) ;
    - gitleaks propre, axios absent, audit identique à develop (AUDIT-1), `--omit=dev` 0 ;
  - frontend-lead : Playwright complet sur 7a59d09, **149 verts, 0 échec, 0 instable** ;
  - chef de projet après le merge : typecheck vert, test:run 591, `npm audit --omit=dev` 0, axios absent.
- **Défauts trouvés et corrigés pendant l'intégration** :
  - `node:crypto` atteint par un service chargé côté client (97e27f9, garde `client-import-graph.test.ts`) ;
  - nom du cookie de session e2e (7a59d09, garde `e2e-session-cookie.test.ts`) ;
  - revues de sécurité : M (jeton dans les logs, 4eac910), M (proxy, f4dd3e1), M1 (ETag avatar, 2ab8304), L4 (86e69d2).
- **Non couvert par les revues de sécurité** : `draw.service.ts`, `invitation.service.ts` hors `acceptInvitation`, `login.post.ts`, lectures de `match.service.ts`. LOW suivis dans T-SEC-06 à T-SEC-12.
- **Au premier déploiement** :
  - poser `NUXT_TRUST_PROXY_HOPS=1` ;
  - vérifier l'origine des écritures (L11) ;
  - retester l'envoi d'avatar sur l'architecture réelle.
- Connexion en `nuxt dev` avec le cookie `__Host-` : mesurée **OK dans Chromium** (backend-lead, base `_test` jetable). **Firefox et WebKit (Safari) non mesurés** : binaires Playwright absents.
- **Reste ailleurs** : voir les tickets T-SEC-06 à T-SEC-12, B-18, B-19 et T-QA-04.

# T-OPS-02 — Constats LOW de la revue de sécurité de T-OPS-01

- **Statut** : **Fermé** (2026-10-28), mergé dans `develop` @ `640842b` (vague 3a) ; voir « Fermeture ».
- **LOW-1** : pendant le `migration:run` de l'entrypoint, les journaux du conteneur contiennent les requêtes SQL (`query: CREATE TABLE …`). On y trouve du DDL, sans secret ni donnée personnelle (observé dans `docker logs`). L'option `logging` de la `DataSource` n'a pas été vérifiée dans le code. **Correctif** : réduire le niveau de journalisation des migrations en production.
- **LOW-2** : le middleware `page-delivery` répond 404 aux pages non livrées. Ce n'est **pas** un contrôle d'accès. **Action** : aucune, sinon ne jamais le présenter comme la protection d'une page admin livrée. L'autorisation reste portée par le middleware `admin` et par le serveur.
- **Compatibilité avec PROD-1 (B-09)** : l'image pose `NUXT_STRICT_RUNTIME_CONFIG=true`. La preuve `docker logs` doit donc passer au conteneur des valeurs valides (`NUXT_PUBLIC_SITE_URL` en https, ni localhost ni 127.0.0.1, `NUXT_MAIL_TRANSPORT=smtp`, `NUXT_MAIL_HOST` autre que localhost, `NUXT_MAIL_FROM`), sinon le serveur refusera de démarrer après les migrations. Ce refus est voulu, mais il fausserait la preuve. Les migrations (`ccc-ops migrate`) ne dépendent pas de cette configuration.
- **Fermeture** : LOW-1 est corrigé, et la sortie de `docker logs` d'un démarrage sans requêtes SQL en est la preuve.

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
- **Reste ailleurs** : voir les tickets T-SEC-06 à T-SEC-12, B-18, B-19 et T-QA-04.

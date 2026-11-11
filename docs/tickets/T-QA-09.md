# T-QA-09 — e2e a11y et visual alignés sur le thème 32c99a70

- **Statut** : **Fermé** (2026-11-11) par le chef de projet, mergé dans `develop` @ `3dd0ca0c` ; voir « Fermeture ».
- **Historique** : En cours. Ouvert le 2026-11-11 par `frontend-lead`, à la demande du `project-manager` (arbitrage utilisateur : option 1, le thème « Au bord de la mer » fait foi).
- **Branche** : `feature/T-QA-09-theme-e2e`, rebasée sur `feature/T-SEC-21` @ 5d833e49 (audit à 0 high/critical, nuxt 4.6.1). Elle sera validée avec T-SEC-21 sur une intégration develop + T-SEC-21 + T-QA-09.

## Constat (develop 226e94a4, Playwright complet, base `ccc_frontlead_test`)

249 passés, 36 échoués (2 a11y, 34 visual), 21 non lancés (projet `writes`, qui dépend de a11y et visual).
Contrôle sur 918dc05e (avant le thème), projets visual et a11y : 7 échecs, F-12 (5) et F-05 (2). Le thème explique donc 29 des 36 échecs.

## Causes, preuve par preuve

1. **Couleurs codées en dur dans deux specs a11y** (F-01:91, F-04:154). Elles attendaient `rgb(22, 11, 46)` et `rgb(255, 178, 26)` (ancien thème), et le thème rend `rgb(14, 36, 47)`, c'est-à-dire `action.primary.fg` = `#0e242f`. Correction : les specs résolvent le token dans le navigateur (`tests/e2e/helpers/theme-color.ts`), plus aucune valeur codée en dur.
2. **Bordure des cartes** (F-01, F-03a, F-04, F-05, F-06, F-10 : 1,0 à 2,7 % par zone). Les tokens de couleur de la maquette et de l'app sont identiques : 0 écart sur les 77 variables de `CCC_HH_DARK`, résolues par `themeToCss` pour `src/themes/ccc.theme.ts` et `docs/design/ui/happy-hour/theme.ts`. `tokens.css` régénéré (`npm run docs:tokens`) : aucun écart. L'écart vient du token choisi. La maquette borde `.card` en `border.default` (hh.css:81). `origam-card` borde par défaut en `border.subtle` (CSS d'Origam : `--origam-card---border-color: var(--origam-color__border---subtle)`). Pixel mesuré sur le filet : app `rgb(59, 88, 104)`, soit subtle à 0,3 sur la surface ; maquette `rgb(100, 133, 150)`, soit default à 0,7. Avec l'ancien thème (0,09 et 0,18) l'écart passait sous le seuil. Correction : `borderColor: border.default` dans les props de `origam-card` du thème, comme `origam-table`. La tuile face-à-face de l'accueil, sans filet visible dans la maquette, passe sa bordure transparente par prop au lieu d'une règle CSS que la prop du thème écrasait.
3. **F-05 ff-bilans, ff-rencontres, ff-duel : instable avant le thème.** (a) `resolvePair` enchaîne jusqu'à une centaine de lectures publiques par worker, contre un budget public de 300 par minute et par IP, et les e2e partagent une seule IP. La réponse n'était pas contrôlée (« rows is not iterable »). Correction : statut contrôlé dans le helper, budget public relevé pour le serveur e2e comme les budgets invitation et avatar (F-10). (b) La zone se mesurait avant son rendu côté client (`getBoundingClientRect` de null). Correction : la spec attend la zone.
4. **F-09 writes, « rattacher un profil existant » : instable.** Le test comptait tous les courriels capturés, alors que les autres tests d'écriture en envoient en parallèle (`fullyParallel`). Correction : seuls les courriels du profil sont comptés.

## Hors thème : remonté, non masqué

- **F-12 admin Plus (5 zones), échec antérieur au thème** (918dc05e : plus-liens 26 à 28 %, plus-edition 3,2 à 3,7 %, plus-deconnexion 1,6 %). Traité dans [F-12b](F-12b.md) (option 1, validée par le `project-manager`).

## Garde du budget public

Le budget public relevé ne s'active que par `NUXT_RATE_LIMIT_PUBLIC_READ_MAX_REQUESTS`, passé à la seule commande du serveur Playwright (`playwright.config.ts`, `webServer.command`, `nuxt dev`). Le runtimeConfig (`nuxt.config.ts`, `publicRead.maxRequests: 300`) et `.env.example` gardent 300 par minute. L'image (Dockerfile) lance `node .output/server/index.mjs` sans cette variable. Garde : `tests/unit/e2e-rate-limit.test.ts`. Les variables posées dans Coolify ne sont pas vérifiables depuis le dépôt.

## Bordure des cartes : écrans touchés

Toutes les `origam-card` passent en `border.default`. Les zones visuelles comparées à une maquette couvrent l'accueil, l'édition (chiffres, podium, étapes), les joueurs et la fiche, le face-à-face, les règles (jeu, tournoi, variantes), le compte et les participants admin. **Seul écran à carte sans zone visuelle : l'onglet « Tirages » de l'édition (`EditionDraws.vue`)**. Sa bordure change sans comparaison à une maquette.

## Mesures (branche @ 4b978a6d, base 5d833e49)

- typecheck : vert, 0 erreur hors Origam.
- TU (`npm run test:run`) : 77/77 fichiers, 740 réussis, 1 ignoré, 0 en échec.
- Playwright complet (`playwright.config.ts`, base `ccc_fl_qa09_test`) : **307 passés, 0 échec, 0 non lancé** (writes compris). Avant : develop 226e94a4, 249 passés, 36 échoués, 21 non lancés.
- Release (`npm run build` puis `playwright.release.config.ts`, base sans édition d'écriture) : 42 passés, 2 en échec, pour la même raison sur la base 5d833e49 : `E2E_ADMIN_SESSION` non fourni (`page-delivery.spec.ts:99` et `:115`). Avec une base où les tests d'écriture ont laissé des éditions 2098 et 2099, la tuile champion « sans palmarès » mesure 176 px au lieu de 223 px (aucune édition close la plus récente) : c'est un effet des données, pas du code.
- npm audit : 0 high, 0 critical (3 low, 15 moderate).
- gitleaks `5d833e49..HEAD` : aucune fuite.
- Revue de sécurité du diff : faite à la main par le `frontend-lead`, l'agent de revue n'ayant rendu aucun rapport. Aucune vulnérabilité. Relu : nouvelle page derrière `middleware: 'admin'` ; aucun import de `src/server` ; aucun secret ; relèvement de budget limité à `nuxt dev` lancé par Playwright.

## Fermeture (2026-11-11, chef de projet)

- Mergé dans `develop` @ `3dd0ca0c` (fast-forward, au-dessus de T-SEC-21 `5d833e49`).
- Mesures `frontend-lead` sur `3dd0ca0c` : Playwright complet 307 passés, 0 échec, 0 non lancé, writes compris, deux runs consécutifs (base develop : 249 / 36 / 21) ; TU 740 réussis, 1 ignoré ; typecheck vert ; `npm audit` 0 high, 0 critical ; gitleaks aucune fuite. test:db et test:api : mesures T-SEC-21 sur `5d833e49`, aucun fichier `src/server` dans ce diff.
- Revue de sécurité : faite à la main par `frontend-lead` (l'agent de revue n'a rendu aucun rapport) et relue par le chef de projet ; aucune vulnérabilité. Le budget public relevé n'existe que dans la commande du serveur Playwright, et `tests/unit/e2e-rate-limit.test.ts` garde les 300/min de production.
- Non vérifié : l'onglet « Tirages » de la page édition (`EditionDraws.vue`), seul écran à carte sans zone visuelle, n'a pas été regardé avec la nouvelle bordure. Les variables posées dans Coolify ne sont pas vérifiables depuis le dépôt.

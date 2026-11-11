# T-QA-09 — e2e a11y et visual alignés sur le thème 32c99a70

- **Statut** : En cours. Ouvert le 2026-11-11 par `frontend-lead`, à la demande du `project-manager` (arbitrage utilisateur : option 1, le thème « Au bord de la mer » fait foi).
- **Branche** : `feature/T-QA-09-theme-e2e`, depuis develop 226e94a4. Passe côté front juste après T-SEC-21.

## Constat (develop 226e94a4, Playwright complet, base `ccc_frontlead_test`)

249 passés, 36 échoués (2 a11y, 34 visual), 21 non lancés (projet `writes`, qui dépend de a11y et visual).
Contrôle sur 918dc05e (avant le thème), projets visual et a11y : 7 échecs, F-12 (5) et F-05 (2). Le thème explique donc 29 des 36 échecs.

## Causes, preuve par preuve

1. **Couleurs codées en dur dans deux specs a11y** (F-01:91, F-04:154). Elles attendaient `rgb(22, 11, 46)` et `rgb(255, 178, 26)` (ancien thème), et le thème rend `rgb(14, 36, 47)`, c'est-à-dire `action.primary.fg` = `#0e242f`. Correction : les specs résolvent le token dans le navigateur (`tests/e2e/helpers/theme-color.ts`), plus aucune valeur codée en dur.
2. **Bordure des cartes** (F-01, F-03a, F-04, F-05, F-06, F-10 : 1,0 à 2,7 % par zone). Les tokens de couleur de la maquette et de l'app sont identiques : 0 écart sur les 77 variables de `CCC_HH_DARK`, résolues par `themeToCss` pour `src/themes/ccc.theme.ts` et `docs/design/ui/happy-hour/theme.ts`. `tokens.css` régénéré (`npm run docs:tokens`) : aucun écart. L'écart vient du token choisi. La maquette borde `.card` en `border.default` (hh.css:81). `origam-card` borde par défaut en `border.subtle` (CSS d'Origam : `--origam-card---border-color: var(--origam-color__border---subtle)`). Pixel mesuré sur le filet : app `rgb(59, 88, 104)`, soit subtle à 0,3 sur la surface ; maquette `rgb(100, 133, 150)`, soit default à 0,7. Avec l'ancien thème (0,09 et 0,18) l'écart passait sous le seuil. Correction : `borderColor: border.default` dans les props de `origam-card` du thème, comme `origam-table`. La tuile face-à-face de l'accueil, sans filet visible dans la maquette, passe sa bordure transparente par prop au lieu d'une règle CSS que la prop du thème écrasait.
3. **F-05 ff-bilans, ff-rencontres, ff-duel : instable avant le thème.** (a) `resolvePair` enchaîne jusqu'à une centaine de lectures publiques par worker, contre un budget public de 300 par minute et par IP, et les e2e partagent une seule IP. La réponse n'était pas contrôlée (« rows is not iterable »). Correction : statut contrôlé dans le helper, budget public relevé pour le serveur e2e comme les budgets invitation et avatar (F-10). (b) La zone se mesurait avant son rendu côté client (`getBoundingClientRect` de null). Correction : la spec attend la zone.
4. **F-09 writes, « rattacher un profil existant » : instable.** Le test comptait tous les courriels capturés, alors que les autres tests d'écriture en envoient en parallèle (`fullyParallel`). Correction : seuls les courriels du profil sont comptés.

## Hors thème : remonté, non masqué

- **F-12 admin Plus (5 zones), échec antérieur au thème** (918dc05e : plus-liens 26 à 28 %, plus-edition 3,2 à 3,7 %, plus-deconnexion 1,6 %). La maquette a reçu l'entrée « Phase finale » (491ecd55, décision c9790abd), dont la route (F-24 à F-26) n'existe pas encore. Le champ « Édition active » est décalé d'environ 1 px. Arbitrage remonté au `project-manager`.

## Mesures sur la branche

À compléter avec le SHA final.

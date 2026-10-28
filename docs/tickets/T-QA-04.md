# T-QA-04 — Test sensible à la charge : « keeps at most 20 devices per account »

- **Statut** : **Fermé** (2026-10-28), mergé dans `develop` @ `1148710` ; voir « Fermeture ».
- **Test** : `tests/api/auth.test.ts`, `trusted device cookie (SEC-A4) > keeps at most 20 devices per account`.

## Constat

- Passe `test:api` sur `feature/integration-wave3a` @ `97e27f9`, le 2026-10-28 : « Tests 1 failed | 242 passed (243) », avec « Test timed out in 120000ms » ; le test a duré 149 169 ms.
- Le test enchaîne 22 connexions, donc 22 hachages scrypt au profil de production (N=2^16, r=8, p=2, 64 MiB, `src/consts/auth.const.ts`), sous le sémaphore L2 (2 calculs simultanés).
- Contexte de charge : deux suites `test:api` tournaient en même temps (intégration 3a et B-18), chacune avec son `nuxt build`, plus un run Playwright du front. La charge moyenne de la machine était d'environ 9.
- Le même test est passé dans les 5 passes de `77fda80` et dans les autres passes isolées. Le code testé (auth, cookie d'appareil) n'avait pas changé entre ces passes.

## Pistes (choix technique du `backend-lead` au moment du traitement)

1. **Réduire le coût de scrypt en test seulement**, par exemple N=2^14 via une variable lue uniquement par la configuration de test. Le profil de production reste couvert par un test unitaire dédié de `password.util`. Risque : un réglage de test qui fuit en production. Il faut donc une garde : refus si `NUXT_STRICT_RUNTIME_CONFIG` est actif.
2. **Monter le timeout de ce seul test**, de façon justifiée (22 hachages, plafond mesuré sous charge plus une marge). Aucun risque pour la production, mais la suite reste lente sous charge.
3. **Réduire le nombre de connexions du test** : semer 19 appareils directement en base, puis faire 2 connexions pour franchir le plafond de 20. Le comportement testé, l'éviction au-delà de 20, reste couvert avec 2 hachages au lieu de 22.

Je penche pour la piste 3 : elle supprime la cause sans toucher à la configuration. À confirmer au traitement.

## Critères d'acceptation

- [ ] Le test garantit toujours qu'un compte garde au plus 20 appareils, les plus anciens étant évincés.
- [ ] Sa durée est mesurée avant et après, et notée dans ce ticket.
- [ ] 5 passes `test:api` vertes avec une autre suite lourde en parallèle.

## Traitement (dev-b09, 2026-10-28, piste 3)

Le test sème 19 appareils de confiance directement en base (`createdAt` échelonnés, une minute d'écart, tous plus anciens que les connexions réelles), puis fait 2 vraies connexions. `registerDevice` évince par `createdAt` décroissant au-delà de `MAX_DEVICES_PER_USER` : le plafond est franchi à la seconde connexion. Il vérifie qu'il reste exactement 20 appareils, que le plus ancien semé est évincé, que le deuxième et le dernier semés restent, et que l'appareil de la dernière connexion (nonce lu dans son cookie signé) est conservé. Scrypt et le timeout ne changent pas.

Mesure, test seul (`npx vitest run --config vitest.api.config.ts tests/api/auth.test.ts -t "keeps at most 20 devices"`, machine à charge moyenne ~20) :
- avant : 5156 ms (22 connexions) ;
- après : 710 ms (2 connexions).

Contrôle de mutation : en inversant l'ordre d'éviction (`createdAt` croissant au lieu de décroissant) dans `device-store.util.ts`, le nouveau test échoue (« expected […] to not include » le nonce du plus ancien) ; l'ordre a été remis.

## Fermeture — 2026-10-28 (chef de projet)
- `feature/T-QA-04-r` @ `c1b06c3` (cherry-pick de a0aa079 sur develop 566525c), mergé dans `develop` @ `1148710`. Seuls `tests/api/auth.test.ts` et ce ticket sont touchés. Aucun code de production, scrypt et timeout inchangés.
- **Correctif** (piste 3) : 19 appareils semés en base dans l'ordre d'éviction, puis 2 vraies connexions. Le test vérifie qu'il reste 20 appareils, que le plus ancien est évincé et que le nonce de la dernière connexion est conservé. Contrôle de mutation : avec l'ordre d'éviction inversé, le test échoue.
- **Mesures** (dev-b09) :
  - test seul : 5 156 ms avant, 710 ms après ;
  - **5 passes test:api complètes** sur a0aa079, chacune sur base neuve, toutes 24/24 et 243/243. Durées : 1 174,8 / 1 039,2 / 825,6 / 769,7 / 699,6 s. Test « 20 devices » : 960 / 1 096 / 956 / 726 / 860 ms ;
  - **sous charge parallèle** : la passe 1 (20:47:20–21:06:56) a recouvert pendant environ 18 min le test:api de B-19 de dev-b12 (20:48:41–21:09:44, heures rapportées par dev-b12) ;
  - tête rebasée c1b06c3 : test:run 593, typecheck vert, gitleaks propre, passe test:api complète 25/25 et 250/250 (865,2 s, test « 20 devices » 823 ms).
- **Revue** : backend-lead. Pas de Playwright, puisque seuls des tests d'API changent (règle précisée par le chef de projet).
- **Après le merge** : typecheck vert, test:run 602.
- **Reste ailleurs** : T-QA-05 (`request-body-timeout`), autre test sensible au temps.

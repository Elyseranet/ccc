# T-QA-04 — Test sensible à la charge : « keeps at most 20 devices per account »

- **Statut** : À faire. Ouvert le 2026-10-28 par `backend-lead`, à la demande du `project-manager` (règle : signaler tout test instable).
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

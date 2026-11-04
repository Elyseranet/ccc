# T-QA-07 — Tests sensibles à la charge : ralentissement par compte (SEC-A2) dans `auth.test.ts`

- **Statut** : À faire. Ouvert le 2026-11-04 par `backend-lead` (règle : signaler tout test instable). Même famille que [T-QA-04](T-QA-04.md), fermé.
- **Tests** : `tests/api/auth.test.ts` › « login throttle per account (SEC-A2) » :
  - « has no delay up to 5 failures, then 2 s; during the delay it answers 429 without checking the password » (l. 136 sur develop d85caf8) ;
  - « a third party failing 10 times does not lock the owner out past the delay » (l. 176).

## Constat (mesures réelles)

- 2026-11-03, passe `test:api` sur T-SEC-15 (69d63f0), machine chargée : « a third party failing 10 times… » échoue sur délai dépassé, avec **553 793 ms** pour un délai de 120 s.
- 2026-11-04 15:38-15:59, passe `test:api` de `dev-b12` sur T-SEC-08 (1fc8eac) : « has no delay up to 5 failures… » échoue sur délai dépassé, avec **145 204 ms**. La passe a été interrompue ensuite par une coupure de session, donc la charge réelle pendant la passe n'est pas connue.
- Les deux tests passent sur une machine calme (passes vertes de T-SEC-15 et de B-11).

## Cause probable (à vérifier)

- Le premier test enchaîne 7 vraies connexions, donc 7 hachages scrypt (N=2^16) sous le sémaphore L2 (2 calculs simultanés), plus une attente réelle de 2,3 s.
- Le second attend un délai réel de ralentissement : 32 s au 10e échec, d'après le commentaire du test.
- Sous charge, chaque hachage peut prendre plusieurs secondes, et le délai de 120 s par test est dépassé.

## Pistes (choix technique au traitement)

1. Comme pour T-QA-04 : semer directement en base l'état du compteur (`failedLoginCount`, `throttledUntil`) au lieu de produire les échecs par de vraies connexions, en ne gardant qu'une ou deux vraies connexions pour vérifier le comportement.
2. Pour l'attente réelle du délai : positionner `throttledUntil` dans le passé en base plutôt que d'attendre, ou rendre l'horloge du ralentissement injectable en test, sans toucher au comportement de production.

## Critères d'acceptation

- [ ] Les garanties SEC-A2 restent couvertes : 5 échecs sans délai, puis 2^(n-5) s plafonné à 300 s ; 429 pendant le délai sans vérifier le mot de passe ; propriétaire non bloqué au-delà du délai.
- [ ] Durée de chaque test mesurée avant et après, notée dans ce ticket.
- [ ] 5 passes `test:api` vertes, dont au moins une sous charge parallèle réelle.

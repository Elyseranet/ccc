# T-QA-05 — Test unitaire sensible au temps : `request-body-timeout.test.ts`

- **Statut** : À faire. Ouvert le 2026-10-28 par `backend-lead` (règle : signaler tout test instable).
- **Test** : `tests/unit/request-body-timeout.test.ts` (délai N3 de lecture du corps, T-SEC-04). Il ouvre un vrai serveur h3 en local et envoie les corps octet par octet, avec des délais réels : 150 ms de délai total sur la route `/raw`, des écarts de 20 à 80 ms entre les morceaux.

## Constat

- 2026-10-28, `test:run` sur `feature/B-19-r` (rebase de B-19) pendant que la machine était chargée (suites `test:api` en parallèle) : 1 échec dans ce fichier au premier passage. Seul, il passe 4/4 ; le second passage complet de `test:run` est vert (591).
- Déjà observé pendant la vague 2 sous forte charge, sans ticket jusqu'ici.
- Je ne sais pas lequel des 4 cas a échoué : le rapport ne le précise pas. Il faudra capturer la sortie au prochain échec.

## Pistes (choix technique au traitement)

1. **Horloge simulée** (`vi.useFakeTimers`) pour le délai, si `readRequestBody` le permet sans fausser le test du flux réel.
2. **Élargir les marges** entre les délais du test (150 ms de délai, morceaux à 40 ou 80 ms) pour qu'un ordonnancement retardé de quelques dizaines de millisecondes ne fasse pas basculer le résultat. Le comportement testé reste le même : délai total, pas d'inactivité.
3. Isoler ce fichier dans un projet Vitest séquentiel.

## Critères d'acceptation

- [ ] Le cas qui échoue est identifié, avec sa sortie.
- [ ] Le test garde ses quatre garanties : 408 et fermeture au-delà du délai, délai total et non d'inactivité, corps à temps accepté, 413 prioritaire.
- [ ] 10 passages de `test:run` verts pendant qu'une suite `test:api` tourne en parallèle.

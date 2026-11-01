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

## Traitement (dev-b09, 2026-11-01)

**Reproduction.** Non reproduite naturellement : 120 exécutions du fichier (30 sous 40 brûleurs CPU `yes`, 30 sous 150, 60 à 20 en parallèle sous 60 brûleurs), 0 échec. Le mécanisme est en revanche démontré en bloquant la boucle d'événements 400 ms pendant la lecture du corps (`setTimeout` + attente active dans le gestionnaire `/json`, version d'origine du test) : 2 cas sur 4 échouent, « a body delivered in time is accepted » (408 au lieu de 200 : le délai total de 300 ms expire avant le traitement des données) et « a body sent slower than the deadline… » avec `Error: read ECONNRESET`. Deux causes :
1. des marges trop étroites (délai de 300 ms sur la route `/json`, 150 ms sur `/raw`) ;
2. le client du test rejetait sur `error` : après un 408 ou un 413, le serveur ferme la socket alors que le client écrit encore, et le système peut renvoyer un ECONNRESET, même si la réponse est déjà arrivée.

**Correctif (piste 2, test seul).** Délai `/json` de 1,5 s et `/raw` de 1 s ; écarts entre morceaux de 400 ms (cas lent, corps complet ~8 s) et 100 ms (délai total, corps complet ~4 s), chacun inférieur au délai (un délai d'inactivité ne se déclencherait jamais) ; durées 408 bornées des deux côtés ; le client ignore une erreur de socket quand la réponse est déjà arrivée. Même test avec le même blocage de 400 ms de la boucle : 4 cas sur 4 passent, trois fois de suite. Les quatre garanties sont conservées. Pas de timers simulés : ils ne pilotent pas le flux de la vraie socket. Aucun code de production touché.

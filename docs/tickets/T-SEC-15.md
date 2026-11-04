# T-SEC-15 — Délai de lecture (T-SEC-09 L6) : le client peut recevoir un RST au lieu du 408

- **Statut** : À faire, **priorité haute** : `test:run` de `develop` est rouge environ 3 fois sur 4 sur la machine du `frontend-lead`. Ouvert le 2026-11-02 par `backend-lead`.
- **Origine** : T-SEC-09, mergé dans `develop` @ 5779571.

## Constat

- `tests/unit/request-body-destroy.test.ts` › « readRequestBody after the deadline (L6) › answers 408 first, then destroys the request stream and stops reading the body » est instable : `Error: read ECONNRESET` après environ 410 ms. Le fichier rejoué seul 4 fois chez le `frontend-lead` : 3 échecs, 1 succès. Le même échec apparaît aussi dans un `test:run` complet. Chez `dev-b09`, au moment du merge, le test était vert.
- `src/utils/request-body.util.ts` met la requête en pause au dépassement du délai, puis appelle `req.destroy()` sur `res` `finish` (ou `close`).

## Hypothèse (à vérifier, je ne l'ai pas mesurée)

- `finish` signifie que la réponse est remise au système, pas reçue par le client.
- Fermer une socket qui a encore des données entrantes non lues (le corps en pause) fait envoyer un **RST** par la pile TCP. Ce RST peut faire perdre au client le 408 encore en transit.
- Si c'est la cause, le défaut n'est pas propre au test : **un vrai client lent peut recevoir une remise à zéro de la connexion au lieu du 408**.

## Pistes

- Fermeture « en douceur » : `Connection: close`, fin de la réponse, demi-fermeture, puis lecture et rejet des octets restants, bornée par `maxBytes` et par un court délai de grâce, avant de détruire.
- Le compromis avec L6 (« plus aucun octet lu ») est à expliciter : on rejette sans les traiter des octets déjà émis, dans une limite fixe.

## Critères d'acceptation

- [ ] Cause confirmée par une mesure : capture ou reproduction déterministe.
- [ ] Un client lent reçoit le 408 de façon fiable.
- [ ] Le test passe 10 fois sur 10 chez le `frontend-lead`, et 10 fois sur 10 sous charge.
- [ ] Les garanties de L6 restent tenues, ou l'écart est documenté avec sa borne.

- **Lien** : T-SEC-09 est rouvert pour ce défaut (c55bdf4). Les deux tickets se ferment ensemble au merge du correctif. Mesure du chef de projet sur develop cf01fa5 : 2 échecs sur 5 rejeux du fichier seul.

## Traitement (dev-b09, 2026-11-02)

**Cause mesurée.** Sonde jetable, un processus par essai, avec l'implémentation de T-SEC-09 (pause puis `destroy` à `finish`) : 16 essais, le client reçoit le 408 complet 16 fois sur 16, sans erreur avant la réponse, puis un `read ECONNRESET` après la réponse 13 fois sur 16. L'instabilité du test venait du test : `once(socket, 'close')` rejette sur tout événement `error`, même après un 408 complet. Le RST réel vient de la fermeture d'une socket dont le tampon de réception contient le corps non lu (retenu par la pause) : Node ferme dès que la réponse est écrite (`Connection: close`).

**Un vrai client reçoit-il un RST au lieu du 408 ?** Sur loopback, non : 56 essais sur 56 ont reçu le 408 complet avant tout reset. Sur un lien réel plus lent, je ne sais pas : non mesuré.

**Correctif.** `readRequestBody` ne met plus la requête en pause après le délai : la lecture continue, les octets sont jetés sans être conservés ni traités, au plus `maxBytes` octets ET au plus `REQUEST_BODY_DRAIN_GRACE_MS` (1,5 s, `src/consts/request.const.ts`) ; au premier des deux seuils, ou à la fermeture de la réponse, la requête est détruite. Sans borne de durée, un client lent aurait pu continuer d'écrire après le 408 (slowloris que N3 voulait couper). Le tampon de réception est vide à la fermeture : FIN ordinaire. Mesure : 16 essais, 408 complet 16 sur 16, aucune erreur avant la réponse, reset après la réponse 2 fois sur 16 (contre 13).

**Écart avec L6** (« plus aucun octet lu ») : au plus `maxBytes` octets lus puis jetés, pendant au plus `REQUEST_BODY_DRAIN_GRACE_MS`, sans aucun traitement. **Test** : le client ne rejette plus sur une erreur de socket ; il exige un 408 complet avant toute erreur, un deuxième cas borne la lecture en octets, un troisième en durée (réponse jamais écrite, client qui écrit 1 octet toutes les 100 ms : requête détruite dans le délai de grâce plus une marge). Limite : sur loopback le test ne distingue pas l'ancienne implémentation de la nouvelle ; la preuve de l'amélioration est la mesure ci-dessus.

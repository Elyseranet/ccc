# T-QA-12 — F-11 zone `ti-tetes` instable à 1440 : +8 px intermittent, cause probable le chargement des polices

- **Statut** : Ouvert (2026-11-15). Ouvert par le chef de projet à la demande de frontend-lead. Assigné : dev-f08, après le merge de F-30.
- **Constat** (dev-f08, develop `97ae9bce` non modifié, sous verrou, load 4,9 à 5,7) : `tests/e2e/writes/F-11.zones.spec.ts`, zone `ti-tetes` (liste des têtes de série du tirage), 1440 px :
  - lancement complet 1 : 5,412 % (maquette 533 px, app 541 px) ; 390 : 0,147 % ;
  - lancement complet 2 : 0,162 % (533 / 533) ; 390 : 0,147 % ;
  - sonde de 8 répétitions à 1440 (load ~4,5) : 532,7 px à chaque fois, 8 lignes de 47,0 px.
  - Même zone vue par dev-f19 le 2026-11-14 : 9,33 % (541 / 533) puis 0,162 / 0,147 % ; dev-f13 a vu 541 / 533 sous charge le 2026-11-14.
- **Hors cause** : F-41. La zone ne contient aucun bouton « Changer » (ils sont dans `ti-saisie`, stable à 0,396 / 0,433 % dans les deux lancements, y compris celui où `ti-tetes` a cassé).
- **Cause probable, NON prouvée** : une ligne mesurée avant la fin du chargement des polices (+1 px par ligne × 8 lignes = +8 px). Le commentaire du spec signale déjà une hauteur de ligne instable sous charge pendant le chargement des polices (47 à 55,66 px). Le lancement en échec n'a pas été capturé.

## Critères d'acceptation

- [ ] Reproduire l'échec avec capture : hauteurs de ligne et `document.fonts.status` au moment de la capture.
- [ ] Si la cause est les polices : attente de `document.fonts.ready` (ou d'une hauteur stable) dans le `settle` partagé. Vérifier aussi si un visiteur réel voit un saut de mise en page ; si oui, correction côté app (préchargement), pas seulement le test.
- [ ] Si la cause n'est pas les polices : rapporter avant toute modification.
- [ ] N lancements consécutifs à 1440 et 390 sous verrou, load < 10, tous sous 1 %. Seuil de 1 % inchangé, aucune zone masquée ou exclue.

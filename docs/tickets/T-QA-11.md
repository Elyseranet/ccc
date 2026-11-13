# T-QA-11 — Zone publique F-21 « départage à N côtés » : marge de 0,003 point à 390

- **Statut** : À faire (2026-11-13). Ouvert par le chef de projet au merge de F-21 (`7c28e546`).
- **Constat** : `tests/e2e/writes/F-21.zones.spec.ts`, zone de la ligne publique de départage contre `edition.html?matchs=departage`. Avant le masquage de la cellule N° (code d'édition généré par le test) : 1440 entre 0,605 et 0,624 % ; 390 à 0,929 % sur 4 lancements et 1,953 % sur 1. Après : la cellule N° reçoit le même texte fixe des deux côtés (`44ed0385`), et l'écart MONTE à 0,997 % à 390 (5 lancements identiques) et jusqu'à 0,953 % à 1440. Le code de l'app est identique entre les deux mesures (seuls le test et la fiche ont changé).
- **Problème** : retirer une source de variation ne devrait pas augmenter l'écart. La valeur injectée crée sans doute un écart propre : largeur, police ou injection qui diffère entre la maquette et l'app. À 0,003 point du seuil, le moindre changement de rendu de cette ligne la fera passer au rouge.
- **Attendu** : lire l'image d'écart, expliquer la hausse, puis corriger l'injection ou masquer la cellule par un aplat identique des deux côtés. Objectif : une marge expliquée, sans toucher au seuil de 1 % ni à `AppDataTable`.

## Critères d'acceptation

- [ ] Cause de la hausse documentée ici, avec l'image d'écart.
- [ ] 5 lancements consécutifs à 390 et 1440 sous verrou, avec une marge expliquée.

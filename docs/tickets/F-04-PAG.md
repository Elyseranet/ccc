# F-04-PAG — Remédiation : écart visuel de origam-pagination (liste des joueurs)

- **Statut** : Ouvert (2026-10-22). Ticket de remédiation de la dérogation F-04-PAG (`docs/design/ux/decisions.md`).
- **Contexte** : F-04 abandonne le pager maison au profit de `origam-pagination`. D'après la mesure de dev-f04 sur la v3, l'écart avec la maquette est de 7,36 % sur une zone et de 66,8 % sur l'autre, au-dessus du seuil de 1 %.
- **À faire** :
  1. remesurer sur la branche F-04 intégrée et lister précisément les écarts ;
  2. écrire la fiche Origam et la déposer (`docs/tickets/origam/`) ;
  3. corriger par thème (props d'abord) ce qui peut l'être ;
  4. lever la dérogation (masque ou seuil) quand Origam est corrigé, puis fermer.

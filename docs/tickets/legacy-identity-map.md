# Correspondance des identités legacy — brouillon de décision (A5)

- **Statut** : **à décider par l'utilisateur, ligne par ligne.** Rien n'est tranché ici.
- **Ticket** : [B-04](B-04.md). L'import réel refuse de tourner tant qu'une ligne n'a pas de décision. Une fois le tableau rempli, B-04 le transcrit dans `server/database/seeds/data/legacy-identity-map.json`.
- **Source** : snapshot `server/database/seeds/data/ccc-workbook.json`, lu le 2026-10-20 (onglets `scores` et `Data`).

## Comment lire ce tableau

- **Graphie orpheline** : un nom qui apparaît dans les matchs (`scores`) sans aucune ligne au classement (`Data`). Ces joueurs n'ont aujourd'hui ni points ni place au classement.
- **Candidat** : le nom de `Data` le plus proche **par similarité de texte**, calculée automatiquement. C'est une piste de lecture, pas une preuve d'identité.
- **Le candidat joue-t-il la même édition ?** Ce sont les matchs du candidat dans la même édition, sous son propre nom. Un même joueur ne peut pas être dans deux poules. En revanche, un nom écrit d'une façon en poule et d'une autre en phase finale est compatible avec une seule personne. Ce n'est qu'un indice.
- **Pré-rempli ST** : la Spec technique (« Écarts constatés ») affirme que ces 4 paires désignent la même personne. La case est pré-remplie, **à confirmer**.

Décisions possibles pour chaque ligne :
- **Fusionner** avec le candidat : la graphie devient un alias, et les matchs sont rattachés au compétiteur existant.
- **Fusionner avec un autre** compétiteur, à nommer.
- **Créer** un nouveau compétiteur : il n'aura pas de points, puisque `Data` ne lui en donne pas.

## Tableau

| # | Graphie orpheline (`scores`) | Éditions et tours | Matchs (avec score, victoires) | Adversaires | Candidat dans `Data` (éditions avec points) | Le candidat joue-t-il la même édition ? | Pré-rempli ST | **Décision** |
|---|---|---|---|---|---|---|---|---|
| 1 | `Andrea Busetto` | 2025 : Poule1 | 6 (6, 2 V) | Clara Boudehen, Clément Fossati, Emma Barré, Kevin Mercurio, Margaux Duburc, Pauline Bailly | `Andréa Busetto` (2018 à 2025) | non | **Fusionner**, à confirmer | |
| 2 | `Rémi Bastien` | 2025 : Poule2 ; 2026 : Poule4 | 10 (10, 3 V) | Arnaud Prioul, Guillaume Boutin, Jérémy Febvre, Laurie Charlier, Léo Fossati, Margot Delory, Nicolas Deseine, Paul Lejemmetel | `Remi Bastien ` (avec espace final ; 2013, 2014, 2016 à 2020, 2022 à 2026) | non | **Fusionner**, à confirmer | |
| 3 | `Vincent K/Vern` | 2024 : Huitième | 1 (1, 0 V) | Paul Lejemmetel | `Vincent K/vern` (2022, 2024) | oui, 4 matchs en Poule8 | **Fusionner**, à confirmer | |
| 4 | `Gauthier RIchard` | 2026 : Poule3 | 6 (6, 2 V) | Arthur Vaur, Caroline Jecpa, Charly Duburc, Domitille Boutin, Jérémie Febvre, Lucie Jecepa | `Gauthier Richard` (2026) | non | **Fusionner**, à confirmer | |
| 5 | `Domitille Boutin` | 2026 : Poule3, Huitième | 7 (7, 5 V) | Arthur Vaur, Caroline Jecpa, Charly Duburc, Gauthier RIchard, Guillaume Boutin, Jérémie Febvre, Lucie Jecepa | `Domi Boutin` (2014 à 2019, 2022 à 2024, 2026) | non | — (la SF dit explicitement qu'aucune source ne tranche) | |
| 6 | `Audrey JeCpa` | 2026 : Poule1 | 6 (6, 1 V) | Claire Deseine, Claire Furic, Estelle Bastien, Ludovic Febvre, Nicolas Furic, Simon Vaur | `Audrey Jecepa` (2026) | non | — | |
| 7 | `Caroline Jecpa` | 2026 : Poule3 | 6 (6, 0 V) | Arthur Vaur, Charly Duburc, Domitille Boutin, Gauthier RIchard, Jérémie Febvre, Lucie Jecepa | `Caroline Jecepa` (2026) | non | — | |
| 8 | `Lucie JeCpa` | 2026 : Huitième | 1 (1, 0 V) | Arnaud Prioul | `Lucie Jecepa` (2026) | oui, 6 matchs en Poule3 | — | |
| 9 | `Aurélie Jochet` | 2026 : Poule2, Huitième | 6 (6, 2 V) | Benoit Bastien, François Jaget, Jeanne Robidel, Léo Fossati, Margaux Duburc, Thomas Duburc | `Aurélie Jochel` (2023, 2026) | non | — | |
| 10 | `Jérémie Febvre` | 2026 : Poule3 | 6 (6, 5 V) | Arthur Vaur, Caroline Jecpa, Charly Duburc, Domitille Boutin, Gauthier RIchard, Lucie Jecepa | `Jérémy Febvre` (2022 à 2026) | oui, 2 matchs (Huitième, Quart) | — | |
| 11 | `Edouart Laroche` | 2025 : Huitième | 1 (1, 0 V) | Paul Lejemmetel | `Edouard Laroche` (2021, 2022, 2023, 2025) | oui, 6 matchs en Poule4 | — | |
| 12 | `Salomé Grand-Guillot` | 2015 : Poule1 | 5 (0 avec score) | Antoine Gallais, Aurèle Pelerin, Domi Boutin, Marion Pallier, Thomas Graffin | `Salomé Grand Guillot` (2015) | oui, 1 match (Huitième) | — | |
| 13 | `Marion Cobra` | 2017 : Poule2 | 4 (4, 1 V) | Clément Fossati, Juan Dewey, Paul Lejemmetel, Romain Bellegrade | aucun candidat évident. Le plus proche par le texte est `Marion Leroy` (2017, 2018), avec une ressemblance faible | non | — | |

Notes :
- Ligne 13 : le prénom correspond, pas le nom. **Je ne sais pas** s'il s'agit d'un surnom.
- 3 autres noms **existent** dans `Data`, mais jouent une édition sans avoir de points pour celle-ci : `Marion Pallier` (2016), `Eleonore Deseine` et `Marie-Lyne Gallais` (2017). Ils ne sont pas orphelins, donc ils ne figurent pas dans ce tableau. B-04 importe leur participation avec une issue inconnue, et le rapport les liste.

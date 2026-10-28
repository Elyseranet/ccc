# T-QA-03 — Base de test : état commun « édition 2026 en phase de poules » (QA-2)

- **Statut** : À faire. Ouvert le 2026-10-28 par `frontend-lead`, en application de la décision utilisateur QA-2 (`docs/design/ux/decisions.md`, 5552c1e).
- **Origine** : F-01 (dev-f05). `src/assets/seeds/archives.sql` met les 16 éditions en `CLOSED`, 2026 compris : sur la base de test, aucun écran ne peut montrer une édition en cours (accueil, tableau de bord, saisie des scores, tirages).
- **Assigné à** : dev-f05. Prérequis partagé, **mergé avant F-01**.
- **Dépend de** : rien (develop @ 5552c1e).

## Périmètre

1. Dans `tests/e2e/helpers/prepare-database.ts` (exécuté par `global-setup`), **après** le chargement d'`archives.sql` : l'édition 2026 passe en phase de poules (`POOLS_PLAYING`), et une **part fixe et documentée** de ses matchs de poule repasse à « programmé » (`SCHEDULED`), sans score enregistré ni validé.
2. La règle est **déterministe** : la sélection des matchs ne dépend ni de l'ordre d'insertion ni d'un aléa (ordre explicite, par exemple par poule puis par séquence), elle est décrite dans un commentaire du helper et dans le README (section « e2e sur les vraies données »).
3. Les valeurs de la règle (nombre ou proportion de matchs, critère d'ordre) sont des constantes nommées dans `tests/e2e/helpers/e2e.const.ts`, pas des littéraux.
4. Aucune donnée inventée (ARCH-8) : on ne crée ni édition, ni joueur, ni match ; on « rembobine » des lignes existantes de 2026. La sortie JSON de `prepare-database` indique l'état produit (statut de 2026, matchs programmés / joués / validés).
5. Cohérence des données dérivées : tout ce que l'API calcule pour 2026 (avancement des poules, `validatedMatchCount`, classement provisoire, palmarès sans champion 2026) doit rester cohérent avec cet état ; vérifier les compteurs exposés par `GET /editions`, `GET /editions/{id}` et `GET /stats`.

## Critères d'acceptation

- [ ] Deux exécutions successives de `prepare-database` donnent exactement le même état (mêmes ids de matchs `SCHEDULED`) : test automatisé.
- [ ] `GET /editions/{id 2026}` renvoie le statut de phase de poules et un avancement cohérent avec la part de matchs repassés à « programmé » (test d'API ou e2e).
- [ ] La suite e2e complète reste verte ; les zones visuelles qui lisent 2026 et changent (F-03, parcours joueurs de F-04 si mergé) sont listées avec leurs ratios avant/après ; aucune zone de la coque ne bouge.
- [ ] README mis à jour (état produit, règle, raison : QA-2).
- [ ] typecheck à 0, `test:run` vert, gitleaks propre ; base e2e propre à l'agent (`ccc_<agent>_test`).

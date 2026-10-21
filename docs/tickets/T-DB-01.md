# T-DB-01 — Dérive de schéma de la migration M0 (`legacy_workbook_rows`)

- **Origine** : signalé par dev-b08 lors de la génération de M2 et M3 (2026-10-20).
- **Constat** : après M0 + M1, `db:migration:generate` propose systématiquement 5 lignes (up) / 4 (down) sur `legacy_workbook_rows`, retirées à la main de M2 et M3 :
  - nom de FK : `FK_legacy_workbook_rows_import` en base, `fk_369f526676c81e7163597ebea76` attendu par l'entité (naming strategy snake_case) ;
  - défauts de `formulas` et `style_ids` : `'{}'` en base, `'{}'::jsonb` attendu.
- **Risque** : chaque future migration générée devra être nettoyée à la main ; un oubli renommerait la FK en production.
- **Correctif** : aligner l'entité `legacy-workbook-row.entity.ts` sur la base (nom de FK explicite via `foreignKeyConstraintName`, défaut `'{}'::jsonb`) **ou** une migration dédiée qui aligne la base sur l'entité. Preuve de fermeture : `db:migration:generate` après toutes les migrations ne propose plus aucune ligne.
- **Repro** : appliquer M0 puis M1, lancer `db:migration:generate`.


## Fermeture — 2026-10-21

- **Statut** : fermé. Mergé dans `develop` au commit `124c85a` (branche d'intégration `feature/integration-wave2` @ `a72d6aa`). Dérive de schéma M0 corrigée (`7267504`) ; `migration:generate` ne trouve plus aucun changement.
- **Vérifié (sorties réelles sur `a72d6aa`, back-lead ; relances du chef de projet notées)** : `test:run` 25 fichiers / 290 tests (relancé par le chef de projet sur `a72d6aa` puis sur `develop` après merge : 290/290) ; `test:api` ×5 sur base neuve : 12 fichiers / 121 tests, exit 0 à chaque lancement ; `test:db` 60/60, seed legacy (2 478 lignes), import (committed, 0 écart bloquant), `test:db` 60/60 sur la même base ; migrations M0→M4 run / revert ×4 / run OK ; `migration:generate` : « No changes in database schema were found » ; gitleaks : aucune fuite (relancé par le chef de projet) ; `npm ls axios` vide ; 0 `.env` dans les worktrees.
- **Vérification par l'API** (build de prod `a72d6aa`) : `GET /competiteurs?q=nicolas deseine` → 39 victoires / 13 défaites / 19 résultats inconnus ; `GET /stats` → 16 éditions, 146 compétiteurs, 729 matchs dont 554 avec score, 175 inconnus ; R-8 : séries ACP et All Time, 138 joueurs × 1 247 valeurs, 0 écart avec le classeur ; `/classements/acp` et `/classements/all-time` : 145 lignes, 0 écart avec les colonnes D et J de `Data`.
- **Sécurité** : revue ciblée 0 critical / 0 high / 0 medium ; N2 corrigé (`887aee6`) ; N1 et N3 reportés dans [T-SEC-04](T-SEC-04.md).
- **Waiver AUDIT-1** : `npm audit` 12 high + 2 critical sur la chaîne de dev Nuxt 4.6.1, 0 avec `--omit=dev` ; remédiation [T-SEC-01](T-SEC-01.md).

# T-DB-01 — Dérive de schéma de la migration M0 (`legacy_workbook_rows`)

- **Origine** : signalé par dev-b08 lors de la génération de M2 et M3 (2026-10-20).
- **Constat** : après M0 + M1, `db:migration:generate` propose systématiquement 5 lignes (up) / 4 (down) sur `legacy_workbook_rows`, retirées à la main de M2 et M3 :
  - nom de FK : `FK_legacy_workbook_rows_import` en base, `fk_369f526676c81e7163597ebea76` attendu par l'entité (naming strategy snake_case) ;
  - défauts de `formulas` et `style_ids` : `'{}'` en base, `'{}'::jsonb` attendu.
- **Risque** : chaque future migration générée devra être nettoyée à la main ; un oubli renommerait la FK en production.
- **Correctif** : aligner l'entité `legacy-workbook-row.entity.ts` sur la base (nom de FK explicite via `foreignKeyConstraintName`, défaut `'{}'::jsonb`) **ou** une migration dédiée qui aligne la base sur l'entité. Preuve de fermeture : `db:migration:generate` après toutes les migrations ne propose plus aucune ligne.
- **Repro** : appliquer M0 puis M1, lancer `db:migration:generate`.

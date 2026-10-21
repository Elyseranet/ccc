# T-QA-01 — Échecs non reproduits de `test:run` / `test:release` après modification de fichiers

- **Origine** : rapport dev-ops sur `feature/T-OPS-01` @ `ed7feca` (2026-10-21).
- **Constat** : une seule fois chacun, juste après des modifications de fichiers : `test:release` « 1 failed » et `vitest` complet « 7 failed ». Une dizaine de relances ensuite : toutes vertes. Cause inconnue. Hypothèse **non vérifiée** : état froid de `.nuxt` / cache Vite.
- **Risque** : faux négatif en CI (pas un contournement de la garde de release), mais un test instable masque les vraies régressions.
- **À faire** : reproduire (modifier un fichier, relancer à froid, `--repeat-each`), relever les noms des tests en échec et la cause ; corriger ou documenter un `nuxt prepare` préalable dans les scripts. Ne pas se contenter d'une relance verte.
- **Fermeture** : cause identifiée et corrigée, preuve sur N relances à froid.

# T-QA-13 — `alignToPixel` sans effet quand sa marge fusionne : généraliser le correctif et traiter les écarts masqués

- **Statut** : Ouvert (2026-11-18)
- **Constat (F-71, dev-f71)** : `alignToPixel` aligne une zone au pixel en ajoutant une `margin-top`. En flux bloc, cette marge fusionne avec celle du frère et le décalage n'a aucun effet ; dans une grille ou un flex, il s'applique. F-71 (AsyncState en grille) l'a révélé sur F-03b `matchs-tableau` @1440. F-71 corrige 5 copies (`visual/F-02`, `F-03b`, `F-05`, `F-13`, `F-35`) : `position: relative; top: <delta>px`, `transform: translateY` pour les éléments `absolute`/`fixed`.
- **Restent sur l'ancienne version** : `tests/e2e/visual/F-03a.spec.ts`, `tests/e2e/visual/F-10.spec.ts`, `tests/e2e/helpers/home-visual.ts` (importé par les specs writes F-21, F-24, F-25, F-26, F-39, F-44, F-68).
- **Écarts masqués révélés par l'alignement effectif (mesures dev-f71, 2026-11-18)** : F-03a `edition-selecteur` @1440 0,688 % → 3,063 % ; F-10 `compte-profil-force` @1440 0,052 % → 6,055 % (boîtes 671x53 app / 671x54) ; F-68 `administrateurs-ligne-vous` @1440 0,191 % → 3,03 %. Avec `translateY` partout : 54 échecs.
- **Décision utilisateur (2026-11-18)** : ticket séparé de F-71.
- **À faire** : une seule implémentation partagée de `alignToPixel` (supprimer les copies locales) ; pour chacune des 3 zones, établir s'il s'agit d'un vrai écart de rendu (corriger l'app) ou d'un artefact de mesure (justifier, remonter un seuil par zone au chef de projet).
- **Critères** : aucune copie locale ; suite visuelle et writes complètes vertes, charge < 10 au lancement ; aucune référence mise à jour sans accord.

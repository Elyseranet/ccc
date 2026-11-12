# T-REL-04 — PR develop → main : gates complètes

- **Statut** : Ouvert (2026-11-12). Décision utilisateur GATE-DEV (`decisions.md`) : les merges sur develop ne passent que typecheck + test:run ; **la PR develop → main porte les gates complètes**.
- **Gates** : Playwright complet (routes, a11y, visual, writes) à 0 échec et 0 non lancé ; e2e de release ; `test:db` ; `test:api` ; `npm audit` 0 high/critical ; gitleaks ; revue de sécurité du diff `main..develop`.
- **Merges de develop sans Playwright complet** (à couvrir par cette PR) :
  - F-19 @ `75d95e59` (dernier run complet : 1 échec `net::ERR_ABORTED` sur visual/F-02 @1440, 30 non lancés) ;
  - F-29 @ `9e81f13f` (visual F-01 de la maquette non lancé) ;
  - B-13 @ `eab64fb0`, F-07 @ `2b725955`, T-SEC-06/12-r3 @ `207d1af5`.
  - F-13 @ `6bed4417` (colonnes du tableau des compétiteurs à mesurer) ;
  - F-11 @ `08adda09` (`e2e-release/page-delivery.spec.ts` relu, non lancé).
- **Ajout (2026-11-12, T-OPS-05)** : la PR vers main doit aussi **construire l'image Docker et la démarrer** (migrations puis serveur) ; aucune autre gate ne l'a fait, d'où la régression T-OPS-05.

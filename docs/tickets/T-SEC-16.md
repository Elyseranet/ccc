# T-SEC-16 — Auto-héberger les polices (plus de requête vers Google Fonts)

- **Statut** : Ouvert (2026-11-02, chef de projet). Il fait suite à la revue de sécurité indépendante de F-10 (M1).
- **Constat** : `nuxt.config.ts` (l. 36-42) charge Google Fonts sur toutes les pages, y compris `/invitation/<jeton>`. F-10 pose `referrer-policy: no-referrer` sur `/invitation/**` et `strict-origin-when-cross-origin` ailleurs, donc le jeton ne fuit plus par le Referer. Il reste une requête vers un tiers sur chaque page : l'IP et l'en-tête User-Agent du visiteur partent chez Google.
- **À faire** :
  1. héberger les fichiers de police dans `src/assets/` (ou `public/`), avec les mêmes familles et graisses que celles utilisées ;
  2. retirer la feuille Google Fonts ;
  3. vérifier que les zones visuelles restent identiques (comparaison zone par zone) ;
  4. vérifier la licence des polices pour l'auto-hébergement.
- **Fermeture** : plus aucune requête vers fonts.googleapis.com ni fonts.gstatic.com (preuve dans les requêtes réseau de l'e2e), et les zones visuelles identiques.

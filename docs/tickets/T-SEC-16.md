# T-SEC-16 — Auto-héberger les polices (plus de requête vers Google Fonts)

- **Statut** : Ouvert (2026-11-02, chef de projet). Il fait suite à la revue de sécurité indépendante de F-10 (M1).
- **Constat** : `nuxt.config.ts` (l. 36-42) charge Google Fonts sur toutes les pages, y compris `/invitation/<jeton>`. F-10 pose `referrer-policy: no-referrer` sur `/invitation/**` et `strict-origin-when-cross-origin` ailleurs, donc le jeton ne fuit plus par le Referer. Il reste une requête vers un tiers sur chaque page : l'IP et l'en-tête User-Agent du visiteur partent chez Google.
- **À faire** :
  1. héberger les fichiers de police dans `src/assets/` (ou `public/`), avec les mêmes familles et graisses que celles utilisées ;
  2. retirer la feuille Google Fonts ;
  3. vérifier que les zones visuelles restent identiques (comparaison zone par zone) ;
  4. vérifier la licence des polices pour l'auto-hébergement.
- **Fermeture** : plus aucune requête vers fonts.googleapis.com ni fonts.gstatic.com (preuve dans les requêtes réseau de l'e2e), et les zones visuelles identiques.

## Réalisation (dev-f13, branche `feature/T-SEC-16-fonts`)

- **Source (relevée le 2026-11-12)** : feuille `https://fonts.googleapis.com/css2?family=Bagel+Fat+One&family=Gabarito:wght@400..900&display=swap` demandée avec un User-Agent Chrome. Fichiers récupérés tels que servis par Google : Gabarito v9 (une police variable, graisses 400 à 900) sous `https://fonts.gstatic.com/s/gabarito/v9/` (sous-ensembles `latin` et `latin-ext`) ; Bagel Fat One v2 (graisse 400) sous `https://fonts.gstatic.com/s/bagelfatone/v2/` (`latin` et `latin-ext`).
- **Sous-ensembles** : `latin` et `latin-ext`, avec les `unicode-range` de Google. Les sous-ensembles coréens que Google sert aussi pour Bagel Fat One ne sont pas repris (inutiles ici, aucune page n'affiche de coréen) : un caractère hors latin retombe sur la police système.
- **Fichiers** (racine de `public/`, décision frontend-lead : pas de nouveau sous-dossier) : `gabarito-latin.woff2`, `gabarito-latin-ext.woff2`, `bagel-fat-one-latin.woff2`, `bagel-fat-one-latin-ext.woff2`, `OFL-Gabarito.txt`, `OFL-Bagel-Fat-One.txt`. Licences : textes OFL 1.1 pris dans le dépôt `google/fonts` (`ofl/gabarito/OFL.txt`, `ofl/bagelfatone/OFL.txt`) : © 2023 The Gabarito Project Authors, © 2022 The Bagel Fat Project Authors.
- **Code** : 4 `@font-face` en tête de `src/assets/css/main.css` (`font-display: swap`) ; `nuxt.config.ts` : `FONTS_URL`, les deux `preconnect` et la feuille Google retirés, deux `preload` (`gabarito-latin.woff2`, `bagel-fat-one-latin.woff2`). Les maquettes `docs/design` chargent toujours Google Fonts (non modifiées : la comparaison visuelle les utilise).
- **À mesurer (feu vert frontend-lead)** : aucune requête vers `fonts.googleapis.com` / `fonts.gstatic.com` sur quelques écrans ; zones visuelles F-01, F-02, F-04, F-06, F-13 et bracket F-03b inchangées.

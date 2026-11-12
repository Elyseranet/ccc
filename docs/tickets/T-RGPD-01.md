# T-RGPD-01 — Google Fonts chargées depuis le CDN Google

- **Origine** : revue sécurité de F-00 (2026-10-20), constat informatif.
- **Constat** : `nuxt.config.ts` charge Bagel Fat One et Gabarito depuis `fonts.googleapis.com` ; l'IP du visiteur est transmise à Google.
- **Piste** : auto-héberger les polices (fichiers `woff2` dans `public/`), ce qui supprime aussi un tiers et peut améliorer le LCP mesuré dans F-00.
- **Statut** : **Fermé** (2026-11-12). Arbitré par l'utilisateur (décision LEGAL-1 : polices hébergées sur le site avant publication des pages légales) et réalisé par [T-SEC-16](T-SEC-16.md), mergé @ `5131c165` : plus aucune requête vers Google mesurée sur 7 écrans.

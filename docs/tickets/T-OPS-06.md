# T-OPS-06 — Rotation des journaux serveur à 6 mois

- **Statut** : Ouvert (2026-11-12). Décision utilisateur LEGAL-1 : journaux conservés 6 mois, rotation configurée.
- **Constat** (ba-legal) : aucune durée n'est bornée aujourd'hui ; elle dépend de Coolify et Docker.
- **À faire** : configurer la rotation (pilote de logs Docker / Coolify, ou destination des logs) pour ne garder que 6 mois ; documenter dans le README ; preuve de la configuration.
- **Débloque** : la valeur `legal.privacy.retention_logs_value` = « 6 mois » (F-19).

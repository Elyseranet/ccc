# T-SEC-22 — Garde-fou PROD-1 : accepter un nom de service sans point comme hôte SMTP

- **Statut** : En revue (2026-11-16). Ouvert par `backend-developer` sur décision de l'utilisateur du 2026-11-16.
- **Origine** : CCC utilise le Mailpit partagé du projet Coolify TOOLS, joignable sur le réseau Docker `coolify` sous un nom de conteneur sans point (`mailpit-rge5j512cvbevgm9qvtf5emw`, variable serveur `MAIL_DEV_ID`). `smtpHostViolation` refusait tout nom sans point.
- **Décision** : un alias à point est posé côté infra (hors périmètre) ET le garde-fou accepte un nom de service sans point.
- **Fait** : `smtpHostViolation` (`src/utils/runtime-config-guard.util.ts`) ne refuse plus que l'hôte vide, non analysable ou local (`localhost`, `*.localhost`, bouclages, formes IPv4/IPv6 locales). Adresses privées toujours acceptées (décision du 2026-11-02). Message d'erreur, JSDoc et tableau du README (« Variables obligatoires en production ») mis à jour. `create-admin-cli.util.ts` appelle `assertStrictRuntimeConfig` : aucun changement.
- **Tests** : `tests/unit/runtime-config-guard.test.ts` : refus d'un nom sans point retiré, acceptation ajoutée (nom de service, avec port, avec point final) ; refus de `localhost` et des bouclages inchangés.
- **Branche** : `feature/T-SEC-22-smtp-bare-host`.

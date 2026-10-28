# T-SEC-11 — Schéma : contrainte de taille d'avatar et index d'expiration des invitations

- **Origine** : seconde revue de sécurité de la vague 3a, findings LOW L6 et L7, le 2026-10-22.
- **Statut** : À faire. Hors vague 3a. Il faut une nouvelle migration TypeORM, avec `up`, `down` et rollback documenté. Les migrations déjà livrées ne sont pas modifiées.

## L6 — La contrainte porte sur `byte_size`, pas sur le contenu

- **Où** : `src/server/db/migrations/1792574239790-CreateCompetitorAvatars.ts:24`, `CONSTRAINT "chk_competitor_avatars_byte_size" CHECK ("byte_size" <= 2097152)`.
- **Constat** : `byte_size` est écrit par l'application. Rien ne garantit en base qu'il égale `octet_length(content)`.
- **Correctif** : `CHECK (octet_length("content") <= 2097152 AND "byte_size" = octet_length("content"))`.

## L7 — Pas d'index sur `invitations.expires_at`

- **Où** : `src/server/db/migrations/1792574200566-CreateInvitations.ts`. Index existants : `token_hash` (unique) et `user_id`.
- **Constat** : l'invalidation au renvoi filtre par `user_id`, qui est indexé. Une purge des invitations expirées, qui n'existe pas encore, filtrerait sur `expires_at` sans index.
- **Correctif** : à faire seulement si une purge est ajoutée. Je ne sais pas si une purge est prévue ; aucune spec ne la mentionne à ma connaissance.

## Critères d'acceptation

- [ ] Migration `up` et `down`, puis `migration:generate` répond « No changes ».
- [ ] Test `test:db` : une ligne dont `byte_size` diffère du contenu est refusée.

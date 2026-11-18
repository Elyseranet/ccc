# API : administrateurs et lien compte admin / fiche joueur (B-31, B-32)

**Statut : B-31 implémenté (branche `feature/B-31-admin-invitations`), B-32 non implémenté.** Contrat arrêté. Décisions utilisateur Q1 à Q10 du 2026-11-18 (détail dans `docs/tickets/B-31.md` et `docs/tickets/B-32.md`) ; les marqueurs **[Qx]** renvoient à la décision qui fixe le point.

Routes sous `/api/v1`. Rôle `ADMIN` exigé sur toutes (`requireRole(event, USER_ROLE.ADMIN)`) : **401** `UNAUTHORIZED` sans session, **403** `FORBIDDEN` pour un participant, vérifié avant toute lecture du corps. Réponses en `Cache-Control: no-store`. Erreurs au format `IApiError`. Corps validés par zod `.strict()` (champ inconnu : **400** `VALIDATION_FAILED`), 16 Ko au plus (**413**).

Rappels de l'existant (vérifiés dans le code le 2026-11-18) :

- `users` : `role` (`ADMIN` | `PARTICIPANT`), `status` (`INVITED` | `ACTIVE`, pas de statut « désactivé »), `competitor_id` unique et nullable (`uq_users_competitor_id`), email unique en minuscules.
- `resolveSession` relit `users.role` et `users.status` **à chaque requête** : un changement de rôle s'applique à la requête suivante, sans attendre l'expiration de la session.
- Un administrateur créé par `npm run user:create-admin` n'a pas de fiche (`competitor_id` nul) ; à l'acceptation, prénom et nom saisis ne sont stockés nulle part (`acceptInvitation` ne met à jour que le compétiteur lié), d'où `displayName` = email dans `toAdminActor`.

## B-31 — Gérer les administrateurs

| Route | Réponse |
|---|---|
| `GET /admin/administrateurs` | `200` `IAdminAccount[]` |
| `POST /admin/administrateurs` | `201` `IAdminInvited` (création) ou `200` `IAdminInvited` (promotion **[Q4]**) |
| `POST /admin/administrateurs/{id}/invitation` | `200` `IInvitationResent` |
| `PATCH /admin/administrateurs/{id}` | `200` `IInvitationResent` |
| `DELETE /admin/administrateurs/{id}` | `204` |

`{id}` = UUID du compte (`users.id`) ; UUID mal formé : **400** `VALIDATION_FAILED` ; compte inconnu **ou non administrateur** : **404** `NOT_FOUND` (on ne distingue pas les deux).

### `GET /admin/administrateurs`

Tous les comptes `role = ADMIN`, triés : `ACTIVE` d'abord, puis par email.

```json
[
  {
    "id": "5d1c…",
    "email": "orga@example.org",
    "status": "ACTIVE",
    "invitationExpiresAt": null,
    "invitationExpired": false,
    "competitor": { "id": "c1…", "displayName": "Arnaud Prioul" },
    "lastLoginAt": "2026-11-18T09:12:00.000Z",
    "createdAt": "2026-10-30T14:00:00.000Z",
    "isSelf": true
  },
  {
    "id": "8e2a…",
    "email": "aide@example.org",
    "status": "INVITED",
    "invitationExpiresAt": "2026-11-25T10:00:00.000Z",
    "invitationExpired": false,
    "competitor": null,
    "lastLoginAt": null,
    "createdAt": "2026-11-18T10:00:00.000Z",
    "isSelf": false
  }
]
```

`invitationExpiresAt` : échéance de la dernière invitation non consommée (`null` pour un compte actif). Aucun hash (mot de passe, jeton) n'est sérialisé. Pas de pagination : l'effectif attendu est de quelques comptes.

### `POST /admin/administrateurs`

Corps `{ "email": string }` (même règle que `POST /competiteurs` : format, 254 caractères, normalisé en minuscules par `normalizeEmail`).

| Cas | Effet | Réponse |
|---|---|---|
| email inconnu | compte `ADMIN` / `INVITED`, sans fiche, sans mot de passe + invitation 7 jours ; mail **variante administrateur** après le commit | `201` `{ id, accountStatus: "INVITED", promoted: false, invitationSent, invitationExpiresAt }` |
| email d'un compte `PARTICIPANT` `INVITED` **[Q4]** | `role` → `ADMIN`, fiche conservée, nouvelle invitation (ancien lien 410), mail variante administrateur | `200` `{ id, accountStatus: "INVITED", promoted: true, invitationSent, invitationExpiresAt }` |
| email d'un compte `PARTICIPANT` `ACTIVE` **[Q4]** | `role` → `ADMIN`, fiche, mot de passe et sessions conservés ; mail d'information sans lien **[Q5]** | `200` `{ id, accountStatus: "ACTIVE", promoted: true, invitationSent, invitationExpiresAt: null }` |
| email d'un compte déjà `ADMIN` | rien | `409` `ALREADY_ADMIN` |

Échec d'envoi du mail : `invitationSent: false`, rien n'est annulé, le renvoi reste possible (même comportement que `sendInvitationEmail`, A14).

### `POST /admin/administrateurs/{id}/invitation`

Renvoi : nouvelle invitation, liens précédents ramenés à l'instant (410), mail variante administrateur. `200` `{ invitationSent, invitationExpiresAt }`. `409` `ACCOUNT_ACTIVE` si le compte est actif.

### `PATCH /admin/administrateurs/{id}`

Corps `{ "email": string }`. Correction de l'email d'un administrateur **non activé** : email remplacé, nouvelle invitation, ancien lien 410, mail à la nouvelle adresse. `200` `{ invitationSent, invitationExpiresAt }`.

`409` `ACCOUNT_ACTIVE` si le compte est actif (l'administrateur gère son email lui-même, comme un joueur, B-29) ; `409` `EMAIL_ALREADY_USED` si l'email appartient à un autre compte.

### `DELETE /admin/administrateurs/{id}`

Retire l'accès administrateur. En une transaction, sous verrou `FOR UPDATE` de **tous** les comptes `ADMIN` (deux retraits croisés concurrents ne peuvent pas vider la liste) :

| Compte visé | Effet **[Q1] [Q2]** |
|---|---|
| `ACTIVE` | `role` → `PARTICIPANT` ; toutes ses sessions révoquées (`revokedAt`) ; fiche, mot de passe et historique (`validated_by_user_id`, `created_by_user_id`) conservés |
| `INVITED` sans fiche | ligne `users` supprimée ; ses invitations partent en cascade (`ON DELETE CASCADE`), le lien répond alors 404 |
| `INVITED` avec fiche (joueur promu) | `role` → `PARTICIPANT`, invitations en cours conservées |

| Statut | Cas |
|---|---|
| `204` | accès retiré |
| `404` `NOT_FOUND` | compte inconnu ou non administrateur |
| `409` `LAST_ADMIN` | le retrait laisserait **zéro administrateur `ACTIVE`** |
| `409` `CANNOT_REVOKE_SELF` | `{id}` = l'appelant **[Q3]** |

## B-32 — Relier un compte administrateur à sa fiche joueur

**[Q6]** : n'importe quel administrateur relie depuis la fiche joueur ; aucune nouvelle route d'écriture, on étend `PUT /competiteurs/{id}/compte` (B-29), que l'écran F-62 appelle déjà. Pas de variante « Ma fiche joueur » côté profil (pas de `PUT /moi/fiche`). L'écran choisit l'administrateur dans `GET /admin/administrateurs` (un admin `INVITED` y figure, avec la mention « invité ») et envoie son email.

### `PUT /competiteurs/{id}/compte` — comportement étendu

Corps inchangé `{ "email": string }`. Seul le cas « l'email appartient déjà à un compte » change :

| Propriétaire de l'email | Compte actuel de la fiche | Effet | Réponse |
|---|---|---|---|
| aucun / le compte de la fiche | — | inchangé (B-29) | `200` comme aujourd'hui, `linked: false` |
| compte `ADMIN` sans fiche | aucun | `users.competitor_id` = la fiche | `200` `{ accountStatus: <statut de l'admin>, linked: true, invitationSent: false, invitationExpiresAt: null }` |
| compte `ADMIN` sans fiche | `INVITED` (joueur jamais connecté) | **[Q7]** compte INVITED du joueur supprimé (ses invitations en cascade, ses liens 404), puis lien comme ci-dessus | idem |
| compte `ADMIN` sans fiche | `ACTIVE` | rien : fusion de deux comptes actifs hors périmètre **[Q7]** | `409` `ACCOUNT_ACTIVE` |
| compte `ADMIN` déjà relié à une autre fiche | — | rien | `409` `ACCOUNT_ALREADY_LINKED` |
| compte `PARTICIPANT` | — | rien (inchangé) | `409` `EMAIL_ALREADY_USED` |

Changement de contrat : `IAccountEmailSet` gagne `linked: boolean`, `accountStatus` s'élargit à `USER_STATUS` et `invitationExpiresAt` devient nullable. L'écran F-62 doit en tenir compte (ticket front à ouvrir par le frontend-lead).

La fiche reste verrouillée (`pessimistic_write`, déjà en place) et `uq_users_competitor_id` garantit l'unicité en cas de course ; une violation de cette contrainte se traduit en `409` `ACCOUNT_ALREADY_LINKED`.

### Pas de déliaison **[Q8]**

Aucune route ne délie un compte de sa fiche (pas de `DELETE /competiteurs/{id}/compte`). Une erreur de lien se corrige en base par l'exploitant.

## Nouveaux codes `API_ERROR_CODE` (ajout seul, règle de l'enum)

| Code | Statut | Route |
|---|---|---|
| `ALREADY_ADMIN` | 409 | `POST /admin/administrateurs` |
| `LAST_ADMIN` | 409 | `DELETE /admin/administrateurs/{id}` |
| `CANNOT_REVOKE_SELF` | 409 | `DELETE /admin/administrateurs/{id}` **[Q3]** |
| `ACCOUNT_ALREADY_LINKED` | 409 | `PUT /competiteurs/{id}/compte` |

Réutilisés : `VALIDATION_FAILED`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `COMPETITOR_NOT_FOUND`, `EMAIL_ALREADY_USED`, `ACCOUNT_ACTIVE`, `PAYLOAD_TOO_LARGE`.

## Entrées `API_ROUTES` prévues (à ajouter par le ticket, avec `pendingTicket` tant que le fichier n'existe pas)

| `API_ENDPOINT` | `file` | `pendingTicket` |
|---|---|---|
| `ADMINS` | `admin/administrateurs/index.get.ts` | `B-31` |
| `ADMIN_INVITE` | `admin/administrateurs/index.post.ts` | `B-31` |
| `ADMIN_INVITATION_RESEND` | `admin/administrateurs/[id]/invitation.post.ts` | `B-31` |
| `ADMIN_EMAIL_UPDATE` | `admin/administrateurs/[id]/index.patch.ts` | `B-31` |
| `ADMIN_REVOKE` | `admin/administrateurs/[id]/index.delete.ts` | `B-31` |

`COMPETITOR_ACCOUNT_EMAIL_SET` existe déjà et ne change pas de fichier.

## Sécurité

- **Qui** : tout administrateur `ACTIVE` peut inviter, renvoyer, corriger et retirer (un seul niveau d'administration, pas de super-admin dans le modèle).
- **Dernier administrateur** : refus `LAST_ADMIN` si le retrait laisse zéro `ADMIN` `ACTIVE` (un `INVITED` ne compte pas : il peut ne jamais activer). Contrôle et écriture sous verrou des lignes `ADMIN`.
- **Rétrogradation** : effet immédiat (rôle relu à chaque requête) ; les sessions sont quand même révoquées pour forcer une reconnexion propre.
- **CLI** : `npm run user:create-admin` reste la voie du premier administrateur (base vide) et de secours ; même `issueInvitation`, lien affiché une fois, sans mail.
- **Énumération d'emails** : ces routes ne sont lisibles que par un administrateur, qui voit déjà l'email de chaque compte (`account` de `GET /competiteurs/{id}`, B-29) : `409 EMAIL_ALREADY_USED` / `ALREADY_ADMIN` n'apprend rien de plus. Aucune surface publique n'est ajoutée ; `GET`/`POST /auth/invitation/{jeton}` gardent leur limite de débit.
- **Limite de débit** : aucune sur les routes admin, comme A14 et B-29 (limite connue, non bloquante).
- **Journalisation** : logs structurés via `logger` et `LOG_EVENT` (nouveaux `admin_invited`, `admin_promoted`, `admin_invitation_resent`, `admin_email_updated`, `admin_revoked`, `admin_competitor_linked`), champs `actorUserId`, `targetUserId`, `competitorId` ; **jamais** d'email, de jeton ni de lien. Pas de table d'audit (A17) **[Q9]**.

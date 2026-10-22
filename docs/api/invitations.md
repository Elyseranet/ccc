# API : invitations et première connexion (B-09)

Routes sous `/api/v1`. Les DTO sont dans `src/interfaces/` (`competitor-creation.interface.ts`, `invitation.interface.ts`). Les erreurs ont la forme `IApiError`.

| Route | Accès | Réponse |
|---|---|---|
| `POST /competiteurs` | administrateur | `201` `ICompetitorCreated` |
| `POST /competiteurs/{id}/invitation` | administrateur | `200` `IInvitationResent` |
| `GET /auth/invitation/{jeton}` | public | `200` `IInvitationPreview` |
| `POST /auth/invitation/{jeton}` | public, jeton valide | `200` `IMe`, cookie de session posé |

## Le jeton

- 32 octets aléatoires, encodés en base64url (43 caractères). Il n'existe en clair que dans l'email : seul son SHA-256 est stocké (`invitations.token_hash`). Il n'est ni renvoyé par l'API, ni journalisé.
- Valable 7 jours (`INVITATION_TTL_DAYS`, A14), usage unique.
- Le lien est `<runtimeConfig.public.siteUrl>/invitation/<jeton>`. L'en-tête `Host` n'entre jamais dans sa construction.
- Un renvoi invalide les liens précédents : leur échéance est ramenée à l'instant du renvoi, ils répondent donc `410`.

## `POST /competiteurs`

Corps (`INewCompetitor`, `.strict()` : tout autre champ, `avatar` compris, donne `400`) :

| Champ | Règle |
|---|---|
| `email` | obligatoire, format email, 254 caractères au plus ; stocké en minuscules |
| `firstName`, `lastName` | obligatoires, 1 à 80 caractères, sans caractère de contrôle |
| `nickname` | optionnel, 80 caractères au plus |
| `phone` | optionnel, même format que `PATCH /moi` (`PHONE_PATTERN`) |

Le compétiteur reçoit `displayName = "Prénom Nom"`. Le compte est `INVITED`, rôle `PARTICIPANT`, sans mot de passe. Il n'y a pas d'avatar : il se téléverse ensuite (B-16).

Réponse `201` : `{ competitorId, invitationSent, invitationExpiresAt }`. L'email part **après le commit** ; si l'envoi échoue, le compte existe, `invitationSent` vaut `false`, un événement `invitation_send_failed` est journalisé (sans email, sans jeton) et le renvoi reste possible.

| Statut | Cas |
|---|---|
| `400` `VALIDATION_FAILED` | corps invalide ou champ inconnu |
| `401` / `403` | anonyme / participant |
| `409` `EMAIL_ALREADY_USED` | email déjà rattaché à un compte ; rien n'est créé |
| `413` | corps de plus de 16 Ko |

## `POST /competiteurs/{id}/invitation`

Nouvelle invitation, ancien lien invalidé, email renvoyé. Réponse `200` : `{ invitationSent, invitationExpiresAt }`.

`404` `COMPETITOR_NOT_FOUND` compétiteur inconnu ; `422` compétiteur sans compte (compétiteur historique : aucun email connu) ; `409` compte déjà actif.

## `GET /auth/invitation/{jeton}`

`200` `{ firstName, nickname }` (valeurs à pré-remplir, `null` si absentes). `404` jeton inconnu ou mal formé ; `410` jeton expiré, consommé ou invalidé par un renvoi.

## `POST /auth/invitation/{jeton}`

Corps (`IAcceptInvitationRequest`, `.strict()`) : `password` obligatoire (15 à 128 caractères, comme B-08) ; `firstName`, `lastName`, `nickname`, `phone` optionnels (un champ omis garde la valeur saisie par l'administrateur). Pas d'avatar.

En une transaction : le jeton est consommé (un seul gagnant sous deux requêtes concurrentes), le mot de passe est défini, le compte passe `ACTIVE`, le profil est complété, une session est ouverte. Réponse `200` : `IMe`, avec le cookie de session (mêmes attributs qu'au login). `404` / `410` comme ci-dessus ; `400` corps invalide ; `503` `SERVICE_BUSY` si le calcul du mot de passe est saturé (T-SEC-04).

## Limite de débit

`GET` et `POST /auth/invitation/{jeton}` partagent un budget par IP (clé `invitation-token`, 30 requêtes par 15 minutes par défaut, `NUXT_RATE_LIMIT_INVITATION_TOKEN_*`), contre le devinage de jetons. Au-delà : `429` avec `Retry-After`.

## Premier administrateur

`npm run user:create-admin` (email lu sur l'entrée standard, `NUXT_PUBLIC_SITE_URL` requis) crée l'administrateur `INVITED` et affiche **une fois** son lien de première connexion sur la sortie standard. Même jeton, même durée de 7 jours, usage unique. Le jeton n'est jamais journalisé.

## Configuration de l'envoi

`runtimeConfig.mail` : `NUXT_MAIL_HOST`, `NUXT_MAIL_PORT`, `NUXT_MAIL_SECURE`, `NUXT_MAIL_USER`, `NUXT_MAIL_PASSWORD`, `NUXT_MAIL_FROM`. Les défauts visent Mailpit en local (`localhost:1025`, sans authentification). En production : fournisseur SMTP et `NUXT_PUBLIC_SITE_URL` à renseigner (les défauts pointent vers `localhost`). `NUXT_MAIL_TRANSPORT=capture` avec `NUXT_MAIL_CAPTURE_FILE` est réservé aux tests d'API : aucun email n'est envoyé.

# T-SEC-07 — Avatars : concurrence de sharp et cache d'un avatar supprimé

- **Origine** : revue de sécurité de la vague 3a, findings LOW L2 et L3, le 2026-10-22.
- **Statut** : À faire. Hors vague 3a. L3 contient une **question ouverte** à poser à l'utilisateur.
- **Fichiers** : `src/utils/avatar-image.util.ts`, `src/services/avatar.service.ts`, `src/consts/avatar.const.ts` (`AVATAR_CACHE_IMMUTABLE`), routes `src/server/api/v1/moi/avatar.*` et `src/server/api/v1/competiteurs/[id]/avatar.*`.

## L2 — Pas de plafond de concurrence sur sharp

- Chaque envoi décode puis ré-encode l'image. D'après la revue, un décodage peut occuper environ 160 Mo. Je n'ai pas mesuré ce chiffre moi-même.
- Le limiteur par IP (10 envois par 10 minutes) borne un client, mais pas plusieurs clients simultanés.
- **Piste** : réutiliser `ConcurrencyGate` (`src/utils/concurrency-gate.util.ts`, déjà utilisé pour scrypt) avec 1 ou 2 décodages simultanés, et répondre 503 `SERVICE_BUSY` avec `Retry-After` au-delà. Éventuellement, plafonner `limitInputPixels` (`AVATAR_MAX_INPUT_PIXELS`, 16 M proposé par la revue).

## L3 — Un avatar supprimé reste servi par les caches

- La réponse de l'avatar est marquée cacheable un an, avec `immutable`. L'URL est versionnée (`?v=`), donc un nouvel avatar n'est pas masqué par l'ancien.
- En revanche, après une suppression, l'ancienne URL reste servie par les caches navigateur et les CDN. C'est un enjeu de vie privée.

### Question ouverte (utilisateur)

- **Q1** : accepter ce risque, avec une durée de cache longue et immuable ? Ou réduire le cache (`private`, `max-age` court, sans `immutable`), au prix de plus de requêtes ?

## Critères d'acceptation

- [ ] L2 : test de la porte de concurrence (503 et `Retry-After` au-delà du plafond), et test du plafond de pixels si retenu.
- [ ] L3 : en-têtes conformes à la décision Q1, avec un test d'API.

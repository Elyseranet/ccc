# API : avatar (B-16)

Décision AV-1 (2026-10-20) : la photo envoyée est **stockée en base** (`competitor_avatars.content`, `bytea`). Décision AV-2 : `sharp` 0.35.5, version exacte. Les erreurs ont la forme `IApiError` (`{ statusCode, code, message, details? }`).

## Routes

| Méthode et chemin | Accès | Corps / réponse |
|---|---|---|
| `PUT /api/v1/moi/avatar` | authentifié, sur **son** compétiteur (422 si le compte n'en a pas) | `multipart/form-data`, **un seul champ `file`** → `200 { avatarUrl }` (`IAvatarUploadResponse`) |
| `DELETE /api/v1/moi/avatar` | authentifié | `204` ; 404 si aucun avatar |
| `PUT /api/v1/competiteurs/{id}/avatar` | administrateur | même contrat ; 401 anonyme, 403 participant, 404 `COMPETITOR_NOT_FOUND` |
| `DELETE /api/v1/competiteurs/{id}/avatar` | administrateur | `204` ; 404 sans avatar ou `COMPETITOR_NOT_FOUND` |
| `GET /api/v1/competiteurs/{id}/avatar` | **public** (budget `PUBLIC_READ`) | les octets de l'image ; 404 sans avatar |

`PATCH /moi` n'accepte plus `avatarUrl` (400 `VALIDATION_FAILED`, hors liste blanche) : l'avatar ne se pose que par téléversement. Cela ferme L7 de T-SEC-04 (pistage des visiteurs par une URL externe).

Création d'un participant avec photo (F-09) : `POST /editions/{id}/participants` avec `newCompetitor` (JSON, sans avatar), puis `PUT /competiteurs/{competitorId}/avatar`.

## `avatarUrl` dans les DTO

`ICompetitorPublic.avatarUrl` et `IMeCompetitor.avatarUrl` valent `/api/v1/competiteurs/{id}/avatar?v={empreinte}` ou `null`. L'empreinte est formée des 16 premiers caractères du SHA-256 du contenu stocké : l'URL change à chaque nouvel avatar. Aucun DTO n'expose `content`, `sha256`, `byte_size` ni `mime_type`.

## Traitement du fichier

1. **Taille** : lecture en flux. `Content-Length` supérieur à 2 Mio + 16 Kio d'enveloppe multipart (`AVATAR_MAX_BYTES`, `AVATAR_MULTIPART_OVERHEAD_BYTES`) : 413 immédiat, corps non lu. Sans `Content-Length` (envoi par morceaux), la lecture s'arrête dès que ce plafond est franchi. Un fichier de plus de 2 Mio dans une enveloppe plus petite est refusé après lecture de l'enveloppe. Dans tous les cas : 413 `AVATAR_TOO_LARGE`.
2. **Délai de lecture** : le corps doit être complet en `AVATAR_UPLOAD_TIMEOUT_MS` (30 s, contre 10 s pour le JSON : 2 Mio en 10 s exigeraient 200 Kio/s), sinon 408 `REQUEST_TIMEOUT` et `Connection: close`. La lecture passe par `readRequestBody` (T-SEC-04, N3).
3. **Limite JSON (M2)** : les 16 Kio de `API_JSON_BODY_MAX_BYTES` ne s'appliquent qu'aux corps `application/json` ; la route d'avatar lit son flux elle-même.
4. **Type par signature** (jamais l'extension ni le `Content-Type` déclaré) : JPEG `FF D8 FF`, PNG `89 50 4E 47 0D 0A 1A 0A`, WebP `RIFF....WEBP`. Autre : 415 `AVATAR_UNSUPPORTED_TYPE`.
5. **Ré-encodage `sharp`** : `.rotate()` (orientation EXIF appliquée), redimensionnement à 512 px au plus sans agrandissement, même format en sortie, sans `withMetadata()` : EXIF (GPS compris), XMP et IPTC disparaissent. Plafond de 40 millions de pixels décodés (bombe de décompression). Fichier illisible ou tronqué : 422 `AVATAR_UNREADABLE`.
6. **Stockage** : un seul `upsert`, qui remplace l'avatar précédent.

## Service de l'image

`GET …/avatar` : `Content-Type` = type détecté et stocké, `X-Content-Type-Options: nosniff`, `Content-Disposition: inline`, `Content-Security-Policy: default-src 'none'`, `ETag` = `"<sha256>"`. `Cache-Control: public, max-age=31536000, immutable` quand `?v=` est la bonne empreinte, sinon `no-cache` (revalidation, `If-None-Match` correspondant → 304).

## Erreurs ajoutées à `API_ERROR_CODE`

| Cas | Statut | Code |
|---|---|---|
| Plus de 2 Mio | 413 | `AVATAR_TOO_LARGE` |
| Signature autre que JPEG, PNG, WebP | 415 | `AVATAR_UNSUPPORTED_TYPE` |
| Décodage impossible | 422 | `AVATAR_UNREADABLE` |
| Champ `file` absent, multiple, mal nommé, ou corps non multipart | 400 | `VALIDATION_FAILED` |
| Corps non reçu à temps | 408 | `REQUEST_TIMEOUT` |

## Schéma

Migration `CreateCompetitorAvatars` : table `competitor_avatars` (`competitor_id` clé primaire et FK `ON DELETE CASCADE`, `content` bytea, `mime_type` enum `avatar_mime_type`, `byte_size` avec `check <= 2097152`, `sha256` char(64), `updated_at`), suppression de `competitors.avatar_url`. `up` refuse de s'exécuter si une `avatar_url` est encore renseignée. `down` recrée `avatar_url` (vide) et supprime la table : **les images téléversées sont perdues**.

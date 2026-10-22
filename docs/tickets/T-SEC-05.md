# T-SEC-05 — Durcissement du convertisseur XLSX et des migrations du seed legacy

- **Origine** : relecture de sécurité ciblée de l'import legacy (B-04), le 2026-10-20 : 0 critical, 0 high, 1 medium et 5 low. Le medium et les deux low du code TypeScript sont corrigés avant le merge de la vague 2, par dev-b04. Ce ticket regroupe ce qui reste.
- **Statut** : **Fermé, sans objet** — voir « Fermeture ».
- **Vague** : 3
- **Contexte** : `scripts/xlsx_to_legacy_json.py` est un outil d'opérateur. Il convertit l'export XLSX du classeur en snapshot JSON. Le fichier d'entrée vient de l'organisateur ; le risque est faible, mais la règle de validation des entrées s'applique.

## Constats

1. **Convertisseur Python, `scripts/xlsx_to_legacy_json.py`** :
   - aucune borne sur le nombre de colonnes et de lignes ;
   - aucune borne sur la taille décompressée des membres de l'archive, ni sur le ratio de compression (bombe de décompression) ;
   - le XML est lu par `xml.etree.ElementTree`, qui repose sur Expat. La documentation Python (https://docs.python.org/3/library/xml.html, consultée le 2026-10-20) indique : « Expat versions lower than 2.7.2 may be vulnerable to the "billion laughs", "quadratic blowup" and "large tokens" vulnerabilities ». Le Python de la machine de développement embarque Expat 2.2.8 (`pyexpat.EXPAT_VERSION`, mesuré le 2026-10-20) ;
   - les cibles de relations (`xl/_rels/workbook.xml.rels`) ne sont pas contrôlées : un `..` ou un chemin absolu doit être refusé.
2. **`runMigrations()` hors transaction**, dans `../../src/server/database/seeds/seed-legacy-workbook.ts` : le seed applique les migrations avant d'ouvrir sa transaction. Un échec de migration ne doit pas laisser l'import à moitié appliqué. Il faut soit exiger que les migrations soient déjà appliquées (et échouer sinon), soit documenter et tester ce comportement.

## Correctifs

- Plafonds en constantes, dans le script : taille de l'archive, taille décompressée par membre et totale, ratio de compression, nombre de feuilles, de lignes et de colonnes.
- **Refus de tout `<!DOCTYPE` ou `<!ENTITY`** dans un membre XML **avant** l'analyse. Les attaques par entités reposent sur une DTD, qu'un XLSX légitime ne contient pas. Ce contrôle suffit sans ajouter de dépendance. **`defusedxml` n'est donc pas recommandé** : pas de dépendance Python externe pour un outil d'opérateur, donc pas d'arbitrage.
- Refus des cibles de relation contenant `..`, commençant par `/`, ou sortant de `xl/`.
- Le seed vérifie que les migrations sont à jour (`dataSource.showMigrations()`) et échoue sinon, sans les lancer lui-même. Le README est mis à jour (lancer `db:migration:run` avant `db:seed:legacy`).

## Critères d'acceptation

- [ ] Tests Python (`python3 -I -m unittest`, sans dépendance) :
  - XLSX avec DOCTYPE refusé ;
  - membre trop gros ou trop compressé refusé ;
  - relation `../` refusée ;
  - le vrai export produit toujours un snapshot identique (même SHA-256 de contenu).
- [ ] Test : `db:seed:legacy` sur une base sans migrations échoue avec un message explicite, sans écrire.
- [ ] README à jour.

## Fermeture — 2026-10-22

- **Statut** : fermé, **sans objet**. Par la décision ARCH-5 (`docs/design/ux/decisions.md`), le convertisseur XLSX en Python et les scripts de seed et d'import du classeur sont **supprimés**. Ils sont remplacés par un dump SQL figé (`src/assets/seeds/archives.sql`), mergé dans `develop` au commit `52c54de` (T-ARCH-01).
- La branche `feature/T-SEC-05` (`cc9255b` et `279ba8f`) n'est pas mergée et ne le sera pas.
- Le dump a été généré depuis la chaîne actuelle, après vérification : Deseine 39/13, 729 matchs, 0 écart bloquant.

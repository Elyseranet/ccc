# CCC

Application de gestion du championnat CCC, avec un site public et un back-office organisateur.

Le socle technique utilise Nuxt 4 et Nitro, PostgreSQL et TypeORM. Les premières vues suivent l'export de design fourni : accueil, compétition, compétiteurs, face-à-face, règlement, variantes, Hall of Fame et espace d'administration.

Les vues actuelles sont un prototype de présentation. Elles n'ont pas encore d'authentification ni de persistance métier. Le contenu du classeur historique est chargé dans des tables d'archive ; son rapprochement vers les futures entités métier reste à effectuer avant publication.

## Prérequis

- Node.js `22.22.3` ou une version prise en charge par Nuxt, selon la contrainte du champ `engines` dans `package.json`.
- npm.
- Une instance PostgreSQL accessible.

## Installation

```sh
npm install
cp .env.example .env
```

Renseigner `NUXT_DATABASE_PASSWORD` dans `.env`. Ne jamais committer ce fichier.

## Docker

La commande suivante construit l'application Nuxt et démarre l'application avec PostgreSQL :

```sh
docker compose up --build
```

L'application est disponible sur `http://localhost:3000` et PostgreSQL sur le port configuré par `NUXT_DATABASE_PORT` (5432 par défaut). Les données PostgreSQL restent dans le volume Docker `ccc_db_data`.

Pour arrêter les conteneurs sans supprimer les données :

```sh
docker compose down
```

Compose ne lance pas de migration au démarrage. Ne pas utiliser `docker compose down -v` sauf si la suppression des données PostgreSQL est intentionnelle.

## Développement

```sh
npm run dev
```

## Migrations TypeORM

Les migrations sont stockées dans `server/database/migrations/` et le schéma n'est pas synchronisé automatiquement.

```sh
npm run db:migration:generate -- server/database/migrations/NomMigration
npm run db:migration:run
npm run db:migration:revert
```

Les commandes nécessitent une connexion PostgreSQL valide définie dans l'environnement ou `.env`.
`npm run db:migration:revert` annule la migration la plus récente ; pour la migration d'archive, cela supprime ses deux tables et toutes les lignes qu'elles contiennent.

### Charger les archives du classeur

Le snapshot `server/database/seeds/data/ccc-workbook.json` conserve les lignes, les valeurs disponibles, les formules et les indices de format des cellules des onglets fournis. L'import crée les tables d'archive si nécessaire et peut être rejoué sans dupliquer une ligne.

```sh
NUXT_DATABASE_HOST=localhost npm run db:seed:legacy
```

Pour produire un snapshot après un nouvel export XLSX :

```sh
python3 scripts/xlsx_to_legacy_json.py "/chemin/vers/export.xlsx" server/database/seeds/data/ccc-workbook.json
```

Les valeurs source sont archivées sans transformer les tableaux de synthèse en données métier normalisées. Le rapprochement des identités et des rencontres reste à faire avant leur exploitation par les écrans du tournoi.

## Architecture

Voir [ARCHITECTURE.md](./ARCHITECTURE.md) pour les frontières applicatives, invariants métier et décisions confirmées ou encore ouvertes.

## Routes disponibles

- `/` — accueil public.
- `/competition` — présentation des phases de poules, du bracket et des scores.
- `/players` et `/head-to-head` — annuaire et comparaison des compétiteurs.
- `/rules`, `/variants` et `/hall-of-fame` — contenu public.
- `/admin` — tableau de bord prototype.
- `/admin/competitors`, `/admin/participants`, `/admin/draws`, `/admin/groups`, `/admin/bracket`, `/admin/scores` et `/admin/editions` — vues des modules de gestion.

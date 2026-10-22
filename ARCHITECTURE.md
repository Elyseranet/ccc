# Architecture initiale — CCC

> Statut : architecture initiale confrontée au scaffold Nuxt du 2026-10-10. Le socle Nuxt 4/Nitro, PostgreSQL et TypeORM est en place ; aucun module métier ni modèle d'entité n'est encore implémenté. Les specs fonctionnelle, API et technique restent des brouillons datés du 2026-09-04 ; leurs propositions ne sont pas des décisions déjà prises.

## Sources et contraintes

- La spec fonctionnelle décrit deux espaces : un back-office d'administration qui écrit, et un front public en lecture seule.
- L'historique recense 16 éditions (2012 à 2026), 145 compétiteurs et 1 414 matchs, dont 554 ont un score.
- Un identifiant d'édition doit être distinct de l'année : l'année 2012 a deux éditions.
- Le tirage décrit par la spec est physique, réalisé par une « main innocente » ; l'application enregistre le résultat et sa validation.
- Les résultats validés déclenchent des changements d'état et des calculs qui doivent rester cohérents en cas de répétition d'une requête.
- La politique globale du projet impose TypeORM pour l'ORM et `fetch` natif pour les appels HTTP.
- Décisions utilisateur du 2026-10-10 : PostgreSQL pour la base et Nuxt 4 intégré pour servir les deux espaces et l'API applicative.

## Architecture logique proposée

```text
Navigateur
├── Espace public (lecture seule)
└── Back-office (administrateur, authentifié)
          │ HTTP / JSON
          ▼
Application Nuxt 4 / serveur Nitro
├── Identité et invitations
├── Référentiel compétiteurs
├── Éditions et participations
├── Tirages
├── Matchs et validation des scores
└── Calculs et lectures publiques
          │
          ├── TypeORM ── PostgreSQL
          └── Port d'envoi ── Fournisseur email (à choisir)
```

Les frontières ci-dessus sont des modules applicatifs, pas des services déployés séparément. Le choix confirmé est une application Nuxt 4 intégrée, avec les routes serveur Nitro comme API applicative, et une base PostgreSQL. Le mode de déploiement reste à définir.

## Modules et responsabilités

| Module | Responsabilité |
|---|---|
| Identité | Connexion, session, rôles, invitation à usage unique et profil personnel. |
| Compétiteurs | Identité sportive pérenne, recherche/autocomplétion, fiche et statistiques individuelles. |
| Éditions | Cycle de vie d'une édition, participants inscrits, règles de transition et clôture. |
| Tirages | Enregistrement du résultat physique, attribution des poules ou affiches, validation et historique (auteur/horodatage). |
| Matchs | Génération des rencontres de poule, saisie distincte de validation, contrôle du score et alimentation du tour suivant. |
| Calculs | Barème, classements, départages, face-à-face et autres indicateurs explicitement retenus. Calculés à partir des données sportives. |
| Présentation publique | Lectures sans authentification ; ne retourne jamais email, téléphone ou autres données de contact. |
| Invitations | Envoi via un adaptateur fournisseur ; l'API ne dépend pas directement d'un SDK fournisseur. |

## Modèle de domaine initial

```text
Utilisateur 1──0..1 Compétiteur
Compétiteur 1──n Participation n──1 Édition
Édition 1──n Poule
Poule 1──n Participation
Édition 1──n Tour 1──n Match
Match ── deux côtés (Participation + score)
Match de départage ── départage deux participations à égalité pour une place qualificative
Édition 1──n Tirage
Tirage 1──n Affectation de tirage
```

Entités candidates, à détailler dans le modèle de données avant implémentation :

- `Utilisateur` pour l'accès au compte et `Competiteur` pour l'identité sportive. Cette séparation permet de représenter des personnes historiques sans compte.
- `Edition` avec identifiant propre, année et libellé ; année seule non unique.
- `Participation` comme association unique entre compétiteur et édition ; placement en poule et statut sportif rattachés à cette participation.
- `Tour`, `Poule`, `Match`, `Tirage` et `AffectationTirage` pour représenter les opérations et leur historique sans encoder le vainqueur dans l'ordre des adversaires.
- Un match de départage entre deux joueurs à égalité entre poules doit pouvoir être représenté et validé comme résultat sportif ; son score cible est 5 points, confirmé par l'utilisateur le 2026-10-10. Il sert uniquement à déterminer le qualifié et ne compte pas dans les statistiques générales, selon décision utilisateur du 2026-10-10.
- `Invitation` ou équivalent avec jeton stocké de façon sûre, date d'expiration et date de consommation ; durée à décider.

Les noms et cardinalités sont provisoires jusqu'à l'examen des règles complètes et de la source d'import. TypeORM sera utilisé pour les entités et migrations ; la stratégie de nommage DB sera `snake_case`, conformément à la politique globale.

## Invariants applicatifs à protéger

1. Un compétiteur ne peut apparaître qu'une fois dans une édition.
2. Une participation appartient à zéro ou une poule de son édition.
3. Un match a deux adversaires distincts de la même édition ; l'ordre des côtés ne désigne pas le gagnant.
4. Le score saisi et le score validé sont des états distincts.
5. La validation d'un score, son recalcul de classement et son effet sur la qualification forment une seule opération atomique.
6. Une validation répétée ne duplique ni points, ni qualification, ni match du tour suivant.
7. Un nouveau tour ne peut être tiré avant la fin et la validation du tour précédent.
8. Les champs de contact ne sont jamais inclus dans les réponses publiques.
9. La validation d'un tirage fige ses affectations selon la règle fonctionnelle, qui ne prévoit pas d'annulation.
10. L'administrateur peut corriger un score validé tant qu'aucun tour suivant n'est engagé ; les classements et qualifications sont recalculés. Une fois le tour suivant engagé, la correction est bloquée (décision utilisateur du 2026-10-10).

Les règles numériques (barème, scores cibles, départages, qualifications) doivent être transcrites depuis les règles RG de la spec fonctionnelle dans des fonctions de domaine testables. Aucun chiffre manquant ne doit être inventé.

## API et intégrité

- API JSON en français métier, dates ISO 8601, identifiants stables ; préfixe et version restent à décider.
- Les appels HTTP utilisent `fetch` natif. Si plusieurs appels doivent partager configuration, délai explicite et gestion des erreurs, les regrouper dans un wrapper existant ou commun au-dessus de `fetch` ; ne pas introduire Axios.
- Authentification requise pour le back-office et les actions participant autorisées ; routes publiques en lecture seule.
- Les opérations de validation sont des commandes avec identifiant d'idempotence ou détection de transition d'état. Le mécanisme exact est à concevoir avec le framework/API choisi.
- Les écritures multi-entités (validation de score, validation de tirage, ajout de compétiteur + invitation) doivent utiliser une transaction DB. L'envoi d'email doit être déclenché de manière fiable après validation de la transaction ; l'outbox est une option à examiner si nécessaire.
- Les erreurs de conflit d'état doivent être distinguées des erreurs de validation de données. Les codes proposés par la spec API restent à confirmer avec le contrat final.
- Les requêtes publiques exposent des DTO dédiés plutôt que les entités TypeORM directement.

## Données calculées et import

Les classements et statistiques sont des projections des matchs et participations, pas des données d'entrée indépendantes. La proposition est de les recalculer à la lecture ou depuis des services de calcul partagés ; leur matérialisation est à décider uniquement après mesure.

La reprise des archives a été faite une fois (B-04), puis figée (ARCH-5, ARCH-10, 2026-10-22). Les archives sont livrées dans un dump SQL versionné, `src/assets/seeds/archives.sql`, appliqué par `db:seed:archives` sur une base migrée et vide. Il contient les entités métier reprises (16 éditions, 146 compétiteurs, 729 matchs dont 554 avec score) et la source brute du classeur (`legacy_workbook_imports`, `legacy_workbook_rows`, 2 478 lignes), qui préserve l'original sans présenter les tableaux calculés comme des données métier. Le test `tests/db/archives-seed.test.ts` revérifie sur la base, après application du dump, que les classements recalculés égalent le classeur (0 écart bloquant, Nicolas Deseine 39/13). Le convertisseur XLSX, le snapshot JSON et les scripts de seed et de reprise ont été supprimés. Les scores manquants restent inconnus : ils ne sont pas reconstitués.

## Décisions en attente

| Sujet | État |
|---|---|
| Moteur relationnel | PostgreSQL, confirmé par l'utilisateur le 2026-10-10. |
| Framework serveur/API et front | Nuxt 4 intégré, confirmé par l'utilisateur le 2026-10-10 ; API applicative servie par Nitro. |
| Hébergement et mode de déploiement | Non spécifiés. |
| Fournisseur email et durée de vie des invitations | Non spécifiés. |
| Session cookie ou jeton | Non spécifié ; dépend du client et du déploiement. |
| Correction d'un score validé | Autorisée à l'administrateur tant qu'aucun tour suivant n'est engagé ; classements et qualifications recalculés. Bloquée ensuite, pour ne pas invalider des tirages ou matchs ultérieurs (décision utilisateur du 2026-10-10). |
| Annulation d'un tirage validé | Règle métier à décider avant de définir les transitions réversibles. |
| Fenêtre des têtes de série (RG9) | Cinq éditions les plus récentes, décision utilisateur du 2026-10-10. Cela aligne RG9 sur le classement décrit par RG4, y compris si plusieurs éditions ont lieu la même année. |
| Égalité entre deux joueurs pour une place de meilleur nème (RG20) | Un match de départage sera joué entre les deux joueurs, au format poule avec un score cible de 5. Il sert uniquement à déterminer le qualifié et n'entre pas dans les statistiques générales ; décisions utilisateur du 2026-10-10. |
| Inclusion des cotes, cuillère de bois, volume de bière et horaires | Questions ouvertes dans les specs. |
| Cotes (RG33–RG35) | Décider si elles sont incluses, à qui elles sont visibles et quelle source définit les 20 derniers matchs ; la spec fonctionnelle signale que cette série n'est pas définie par le document V3. |
| Source et procédure de reprise du classeur | Un export XLSX a été fourni ; son contenu est conservé en archive brute. La normalisation des lignes de compétiteurs et rencontres reste à concevoir. |

## Séquence de conception proposée

1. Confirmer les choix qui conditionnent l'ossature (base, serveur/API, front et hébergement).
2. Formaliser les transitions d'état et les règles RG dans un modèle de domaine vérifiable.
3. Décrire le schéma relationnel TypeORM et le contrat API correspondant.
4. Concevoir l'import historique avec rapprochement manuel des identités.
5. Maquettes retrouvées dans `CCC.zip` : 27 vues couvrant le site public, le back-office et les étapes de tirage. Les premières pages front suivent cette direction visuelle. Les parcours détaillés de tirage restent à intégrer.

Cette séquence ne constitue pas un engagement de livraison ; elle ordonne le travail restant à partir des informations présentes.

## Arborescence du code (T-ARCH-01)

Un dossier par nature sous `src/`, à plat ; `src/server/` ne garde que ce que Nitro impose et la base (`db/migrations`, `db/typeorm`, `db/typeorm/entities`). Les services d'un domaine réunissent la classe navigateur et les lectures serveur ; une garde de build interdit tout code serveur dans les chunks client. Détail : `CLAUDE.md` du dépôt et décisions ARCH-1 à ARCH-12 (`docs/design/ux/decisions.md`).

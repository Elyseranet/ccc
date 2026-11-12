# T-OPS-05 — L'image de production ne démarre plus (`h3` absent pour la CLI de migration)

- **Statut** : Ouvert (2026-11-12), **priorité 1**. Trouvé par backend-lead pendant la preuve Docker de T-SEC-06.
- **Constat** (image construite depuis develop `c30e3a8f`) : l'entrypoint lance `ccc-ops migrate`, qui échoue avec `ERR_MODULE_NOT_FOUND: Cannot find package 'h3' imported from /app/.typeorm-dist/src/utils/database-timeouts.util.js` ; le conteneur s'arrête (« ECHEC des migrations… le serveur n'est pas demarre »).
- **Cause** : régression de T-SEC-17 (mergé @ `b0a06f43`). `database-timeouts.util.ts` importe `createError` de `h3` pour `databaseTimeoutError`, et la DataSource de la CLI importe ce fichier ; l'étage runner de l'image n'installe que les paquets nécessaires aux migrations, pas `h3`.
- **Conséquence probable** (déduction, logs Coolify non consultés) : chaque déploiement de develop échoue depuis ce merge et Coolify garde l'ancien conteneur. Cohérent avec `GET /api/v1/health` sur la dev qui renvoie encore `{"status":"ok"}` alors que T-OPS-03 (version + migrations) est mergé.
- **Pourquoi aucune gate ne l'a vu** : aucune ne construit l'image ni ne charge la CLI compilée.
- **Correctif** (backend-lead) : déplacer `databaseTimeoutError` dans `src/utils/api-error.util.ts` (erreurs h3 déjà là) pour que la CLI ne charge plus `h3` ; garde de non-régression : la CLI compilée doit se charger sans les dépendances serveur.
- **Fermeture** : build réel de l'image + démarrage OK (migrations puis serveur), garde en place, puis sur la dev redéployée `GET /api/v1/health` renvoie `version` et `migrations` (débloque la vérification de T-OPS-03).

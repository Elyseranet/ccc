# T-OPS-02 — Constats LOW de la revue de sécurité de T-OPS-01

- **Statut** : À faire. Ouvert le 2026-10-21, à partir de la revue de sécurité de `develop..95823da` menée par dev-ops.
- **LOW-1** : pendant le `migration:run` de l'entrypoint, les journaux du conteneur contiennent les requêtes SQL (`query: CREATE TABLE …`). On y trouve du DDL, sans secret ni donnée personnelle (observé dans `docker logs`). L'option `logging` de la `DataSource` n'a pas été vérifiée dans le code. **Correctif** : réduire le niveau de journalisation des migrations en production.
- **LOW-2** : le middleware `page-delivery` répond 404 aux pages non livrées. Ce n'est **pas** un contrôle d'accès. **Action** : aucune, sinon ne jamais le présenter comme la protection d'une page admin livrée. L'autorisation reste portée par le middleware `admin` et par le serveur.
- **Fermeture** : LOW-1 est corrigé, et la sortie de `docker logs` d'un démarrage sans requêtes SQL en est la preuve.

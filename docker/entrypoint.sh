#!/bin/sh
# Applique les migrations TypeORM, puis lance la commande (le serveur Nitro par défaut).
# Jamais de `synchronize`. Si la base est injoignable ou si une migration échoue, le conteneur
# s'arrête en erreur (code non nul) : Coolify le redémarre et le déploiement reste visible en échec.
set -eu

echo "[entrypoint] application des migrations TypeORM"
if ! ccc-ops migrate; then
  echo "[entrypoint] ECHEC des migrations ou base injoignable : le serveur n'est pas demarre" >&2
  exit 1
fi

exec "$@"

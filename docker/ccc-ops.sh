#!/bin/sh
# Commandes d'exploitation, à lancer dans le conteneur :
#   docker exec -it <conteneur> ccc-ops <commande>
# (ou comme commande dans le terminal Coolify). Les variables NUXT_DATABASE_* du conteneur sont utilisées.
set -eu

# Pas la CLI TypeORM : elle force le journal des requêtes SQL, qui finirait dans `docker logs`.
MIGRATIONS_SCRIPT=.typeorm-dist/src/utils/run-migrations-cli.util.js

run_script() {
  script=$1
  shift
  if [ ! -f "$script" ]; then
    echo "ccc-ops: $script est absent de cette image (commande livree avec un ticket non encore integre)" >&2
    exit 1
  fi
  exec node "$script" "$@"
}

command=${1:-}
[ $# -gt 0 ] && shift

case "$command" in
  migrate)           run_script "$MIGRATIONS_SCRIPT" up ;;
  migrate:revert)    run_script "$MIGRATIONS_SCRIPT" revert ;;
  user:create-admin) run_script .typeorm-dist/src/utils/create-admin-cli.util.js "$@" ;;
  user:unlock)       run_script .typeorm-dist/src/utils/unlock-user-cli.util.js "$@" ;;
  db:seed:archives)  run_script .typeorm-dist/src/utils/seed-archives-cli.util.js "$@" ;;
  *)
    echo "Usage: ccc-ops {migrate|migrate:revert|user:create-admin|user:unlock|db:seed:archives}" >&2
    exit 2 ;;
esac

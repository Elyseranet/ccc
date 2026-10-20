#!/bin/sh
# Commandes d'exploitation, à lancer dans le conteneur :
#   docker exec -it <conteneur> ccc-ops <commande>
# (ou comme commande dans le terminal Coolify). Les variables NUXT_DATABASE_* du conteneur sont utilisées.
set -eu

DATA_SOURCE=.typeorm-dist/server/database/data-source.js

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
  migrate)           exec node node_modules/typeorm/cli.js migration:run -d "$DATA_SOURCE" ;;
  migrate:revert)    exec node node_modules/typeorm/cli.js migration:revert -d "$DATA_SOURCE" ;;
  user:create-admin) run_script .typeorm-dist/server/database/scripts/create-admin.js "$@" ;;
  user:unlock)       run_script .typeorm-dist/server/database/scripts/unlock-user.js "$@" ;;
  db:seed:legacy)    run_script .typeorm-dist/server/database/seeds/seed-legacy-workbook.js "$@" ;;
  db:import:legacy)  run_script .typeorm-dist/server/database/seeds/import-legacy-domain.js "$@" ;;
  *)
    echo "Usage: ccc-ops {migrate|migrate:revert|user:create-admin|user:unlock|db:seed:legacy|db:import:legacy}" >&2
    exit 2 ;;
esac

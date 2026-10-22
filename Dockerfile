# syntax=docker/dockerfile:1
# Image de production CCC (Nuxt 4 / Nitro, TypeORM, PostgreSQL), livrée sur Coolify.
# Image agnostique de l'environnement : toute la configuration passe par des variables
# NUXT_* injectées à l'exécution (voir README, « Déploiement Coolify »). Aucun .env dans l'image.

# ── Stage 1 : build ───────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
# `npm ci` suit package-lock.json (déterministe). Cache BuildKit persistant + retries +
# boucle de 3 essais : un timeout CDN ponctuel ne fait pas échouer tout le build.
# `--ignore-scripts` : le postinstall (`nuxt prepare`) tournerait sans nuxt.config.ts ni sources ;
# `nuxt build` régénère `.nuxt` avec la vraie configuration. `npm rebuild` rejoue les scripts
# d'installation des seules dépendances natives utiles au build.
RUN --mount=type=cache,target=/root/.npm \
    printf 'fetch-retries=5\nfetch-retry-mintimeout=20000\nfetch-retry-maxtimeout=120000\nfetch-timeout=600000\n' > /root/.npmrc && \
    ( npm ci --ignore-scripts \
      || (echo 'npm ci retry 1/3' && sleep 15 && npm ci --ignore-scripts) \
      || (echo 'npm ci retry 2/3' && sleep 30 && npm ci --ignore-scripts) ) && \
    npm rebuild esbuild

COPY . .

# T-REL-01 : un build de production échoue tant qu'un endpoint reste en fixture.
# Pas de contournement : retirer cette étape revient à livrer de fausses données.
RUN npm run test:release

RUN npm run build
# CLI TypeORM et scripts d'exploitation (migrations, user:*, db:seed:archives), compilés en JS.
RUN npm run db:typeorm:build

# ── Stage 2 : dépendances de production ───────────────────────────────────────
# Uniquement ce que les migrations et scripts d'exploitation chargent à l'exécution
# (typeorm, pg, reflect-metadata, dotenv) : le serveur Nitro est déjà bundlé dans .output.
FROM node:22-alpine AS prod-deps

WORKDIR /app

COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    printf 'fetch-retries=5\nfetch-retry-mintimeout=20000\nfetch-retry-maxtimeout=120000\nfetch-timeout=600000\n' > /root/.npmrc && \
    ( npm ci --omit=dev --ignore-scripts \
      || (echo 'npm ci retry 1/3' && sleep 15 && npm ci --omit=dev --ignore-scripts) \
      || (echo 'npm ci retry 2/3' && sleep 30 && npm ci --omit=dev --ignore-scripts) )

# ── Stage 3 : runner ──────────────────────────────────────────────────────────
FROM node:22-alpine AS runner

# curl : sonde de santé Coolify et HEALTHCHECK (busybox wget gère mal les options de Coolify).
RUN apk add --no-cache curl

WORKDIR /app

# `type: module` est lu depuis /app/package.json pour .typeorm-dist.
COPY --from=builder --chown=node:node /app/package.json ./package.json
COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/.output ./.output
COPY --from=builder --chown=node:node /app/.typeorm-dist ./.typeorm-dist
# Dump SQL figé des archives, lu par db:seed:archives (chemin relatif au répertoire courant, ARCH-5).
COPY --from=builder --chown=node:node /app/src/assets/seeds/archives.sql ./src/assets/seeds/archives.sql
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
COPY docker/ccc-ops.sh /usr/local/bin/ccc-ops
RUN chmod +x /usr/local/bin/entrypoint.sh /usr/local/bin/ccc-ops

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000

USER node

EXPOSE 3000

# Laisse ~40 s au démarrage (migrations comprises) avant la première sonde.
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD curl -fsS "http://127.0.0.1:${PORT}/api/v1/health" || exit 1

ENTRYPOINT ["entrypoint.sh"]
CMD ["node", ".output/server/index.mjs"]

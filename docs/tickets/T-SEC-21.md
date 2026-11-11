# T-SEC-21 — `npm audit` : 2 critical et 3 high dans l'arbre de dev, gate rouge sur develop

- **Statut** : **Fermé** (2026-11-11) par le chef de projet, mergé dans `develop` @ `3dd0ca0c` (fast-forward, avec T-QA-09 et F-12b) ; voir « Fermeture ».
- **Historique** : En cours. Ouvert le 2026-11-11 par `backend-lead`, sur décision de l'utilisateur relayée par le `project-manager` (option « ticket dédié, correction des dépendances sans `--force`, en premier »).
- **Origine** : gates de merge des branches back du 2026-11-11. La gate « `npm audit` : zéro high ou critical » échoue sur develop @ `226e94a4` lui-même, sans rapport avec les branches.
- **Worktree** : `.claude/worktrees/bl-sec21`, branche `feature/T-SEC-21`, depuis develop @ `226e94a4`, avec son propre `npm ci`.
- **Lien** : [T-SEC-18](T-SEC-18.md) (montée de nuxt), voir plus bas.

## Constat (develop @ `226e94a4`, `npm audit --json`)

- Arbre complet : 23 vulnérabilités (3 low, 15 moderate, **3 high, 2 critical**). `--omit=dev` : 3 moderate (glob, minimatch, typeorm : T-SEC-14).
- Les 5 high et critical sont transitives sous `nuxt@4.6.1`, déclaré en devDependency :
  - critical : `simple-git` 3.36.0 et `@simple-git/argv-parser`, via `@nuxt/devtools` 3.4.2 (exécution de commandes : GHSA-g4wm-2vf7-vfgr, GHSA-858h-whjf-mvg5, GHSA-x6jw-m9v5-85vh, GHSA-v5rq-49vh-5v5c) ;
  - high : `@nuxt/devtools` (via simple-git) ;
  - high : `node-forge` 1.4.0, via nitropack > listhen ;
  - high : `undici` 8.11.2, sous nuxt.

## Correction

Mise à jour ciblée, `nuxt` reste en 4.6.1 : `npm update @nuxt/devtools node-forge undici simple-git @simple-git/argv-parser`. Seul `package-lock.json` change ; `package.json` est intact.

| Paquet | Avant | Après |
|---|---|---|
| nuxt | 4.6.1 | 4.6.1 (inchangé) |
| @nuxt/devtools | 3.4.2 | 3.4.4 (ne tire plus `simple-git`) |
| node-forge | 1.4.0 | 1.4.3 |
| undici | 8.11.2 | 8.12.4 |
| simple-git, @simple-git/*, @kwsites/*, nypm | présents | retirés de l'arbre |

- `npm ls axios` : vide. Tous les `resolved` ajoutés pointent vers `registry.npmjs.org`. Les 65 binaires Linux optionnels du lockfile sont inchangés (image Docker).

### Pourquoi pas `npm audit fix`

Un premier essai (`npm audit fix` sans `--force`, commit `7397387a`, remplacé) montait `nuxt` en 4.6.4, ce que permet `^4.6.0`. Les high et critical disparaissaient, mais **`nuxt dev` ne démarrait plus** : `ERROR options.hostname.toLowerCase is not a function` (`@nuxt/cli` 4.0.1, `#syncAllowedHosts`). La cause, mesurée : dans `@nuxt/schema` 4.6.4, le resolver `devServer.host` renvoie `{}` quand `HOST`, `NUXT_HOST` et `NITRO_HOST` sont absents (`loadNuxtConfig` → `typeof devServer.host === 'object'`). La version 4.6.3 n'a pas ce resolver. Épingler `nuxt@4.6.3` ne suffisait pas : `@nuxt/cli` et `@nuxt/test-utils` tiraient encore `@nuxt/schema` 4.6.4, et l'erreur restait. Les e2e Playwright (`nuxt dev`) et `npm run dev` étaient donc cassés.

## Mesure après correction

- Arbre complet : 18 vulnérabilités (3 low, 15 moderate, **0 high, 0 critical**). `--omit=dev` : 3 moderate, inchangé (T-SEC-14).
- `nuxt dev` démarre (Nuxt 4.6.1, Nitro 2.13.4).

## Effet sur T-SEC-18

Aucun : `nuxt` reste en 4.6.1, et les trois avis moderate de T-SEC-18 sont toujours là. À la montée, T-SEC-18 devra vérifier que `nuxt dev` démarre : 4.6.4 casse le démarrage (voir plus haut), à revérifier sur la version visée.

## Critères d'acceptation

- [ ] `npm audit` : 0 high, 0 critical.
- [ ] typecheck, `test:run`, `test:db`, `test:api`, Playwright complet : verts, sans test exclu.
- [ ] gitleaks propre, `/security-review` sur le diff.

## Fermeture (2026-11-11, chef de projet)

- Mergé dans `develop` @ `3dd0ca0c` en fast-forward. La correction retenue est `5d833e49` ; `7397387a` (nuxt 4.6.4) est abandonné parce qu'il cassait `nuxt dev`.
- Mesures de `backend-lead` sur `5d833e49`, après `npm ci` : typecheck vert (0 erreur hors Origam) ; test:run 737 réussis, 1 ignoré, 0 échec ; test:db 120/120 ; test:api 314/314 ; gitleaks aucune fuite ; `npm audit` 18 alertes (3 low, 15 moderate, **0 high, 0 critical**) ; `--omit=dev` 3 moderate.
- Playwright : validé sur la tête combinée `3dd0ca0c` (T-QA-09) : 307 passés, 0 échec, writes compris, deux runs consécutifs (`frontend-lead`). Le diff `5d833e49..3dd0ca0c` ne touche pas `src/server`, donc les mesures db et api ci-dessus valent pour la tête.
- Revue de sécurité : le diff ne contient que le lockfile et la doc ; chaque `resolved` pointe vers registry.npmjs.org avec son integrity ; aucun `hasInstallScript` ajouté ; axios absent.
- Reste ailleurs : les 3 moderate de production → [T-SEC-14](T-SEC-14.md) ; la montée de nuxt → [T-SEC-18](T-SEC-18.md).

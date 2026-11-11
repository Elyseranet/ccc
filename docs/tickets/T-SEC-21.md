# T-SEC-21 — `npm audit` : 2 critical et 3 high dans l'arbre de dev, gate rouge sur develop

- **Statut** : En cours. Ouvert le 2026-11-11 par `backend-lead`, sur décision de l'utilisateur relayée par le `project-manager` (option « ticket dédié, `npm audit fix` sans `--force`, en premier »).
- **Origine** : gates de merge des branches back du 2026-11-11. La gate « `npm audit` : zéro high ou critical » échoue sur develop @ `226e94a4` lui-même, sans rapport avec les branches.
- **Worktree** : `.claude/worktrees/bl-sec21`, branche `feature/T-SEC-21`, depuis develop @ `226e94a4`, avec son propre `npm ci`.
- **Lien** : recouvre en partie [T-SEC-18](T-SEC-18.md) (voir plus bas).

## Constat (develop @ `226e94a4`, `npm audit --json`)

- Arbre complet : 23 vulnérabilités (3 low, 15 moderate, **3 high, 2 critical**). `--omit=dev` : 3 moderate (glob, minimatch, typeorm : T-SEC-14).
- Les 5 high et critical sont transitives sous `nuxt@4.6.1`, déclaré en devDependency :
  - critical : `simple-git` 3.36.0 et `@simple-git/argv-parser`, via `@nuxt/devtools` 3.4.2 (exécution de commandes : GHSA-g4wm-2vf7-vfgr, GHSA-858h-whjf-mvg5, GHSA-x6jw-m9v5-85vh, GHSA-v5rq-49vh-5v5c) ;
  - high : `@nuxt/devtools` (via simple-git) ;
  - high : `node-forge` 1.4.0, via nitropack > listhen ;
  - high : `undici` 8.11.2, sous nuxt.

## Correction

`npm audit fix`, sans `--force`. Seul `package-lock.json` change, `package.json` est intact (`nuxt` reste `^4.6.0`).

| Paquet | Avant | Après |
|---|---|---|
| nuxt | 4.6.1 | 4.6.4 |
| nitropack | 2.13.4 | 2.13.6 |
| @nuxt/devtools | 3.4.2 | 3.4.4 (ne tire plus `simple-git`) |
| node-forge | 1.4.0 | 1.4.3 |
| undici | 8.11.2 | 8.12.4 |
| simple-git | 3.36.0 | absent |

- `npm ls axios` : vide.
- Le lockfile perd l'entrée orpheline `@napi-rs/lzma-linux-x64-gnu` (aucun paquet ne la déclarait, aucune autre variante `lzma` dans l'arbre). Les 64 autres binaires Linux optionnels restent : l'image Docker (Linux) n'en perd aucun.

## Mesure après correction

- Arbre complet : 16 vulnérabilités (6 low, 10 moderate, **0 high, 0 critical**). `--omit=dev` : 3 moderate, inchangé (T-SEC-14).
- Les trois avis de T-SEC-18 (GHSA-9v7c-q64q-vv33, GHSA-vjh5-4x84-xrqp, GHSA-xfq5-w38q-pc2x) ont disparu du rapport : nuxt passe à 4.6.4, au-delà du 4.6.3 visé.

## Effet sur T-SEC-18

T-SEC-18 reste ouvert : la montée de nuxt est faite par ce ticket, mais il reste son épinglage exact, son test de régression GHSA-9v7c dans `tests/api/` et sa preuve Docker.

## Critères d'acceptation

- [ ] `npm audit` : 0 high, 0 critical.
- [ ] typecheck, `test:run`, `test:db`, `test:api`, Playwright complet : verts, sans test exclu.
- [ ] gitleaks propre, `/security-review` sur le diff.

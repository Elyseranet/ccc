# Audit accessibilité CCC — develop ff85c00 — RGAA 4.1 / WCAG 2.1 AA

Lecture seule. Rien n'a été modifié, commité ni poussé.

## Méthode et limites (à lire d'abord)

- Arbre de travail vérifié : `.git/HEAD` = `refs/heads/develop`, `refs/heads/develop` = `ff85c00810db3b7a7b42da136fd7f7c8c710bc2c`.
- Audit **statique** : lecture du code CCC et des sources Vue d'Origam 2.37.4 (`node_modules/origam/dist/src/components/*.vue`). Je n'ai **pas** pu lancer l'application, axe, un navigateur ni un lecteur d'écran (pas d'accès shell dans cette session). Aucune mesure navigateur n'existe donc dans ce rapport ; chaque point non tranché par le code est marqué « Je ne sais pas » avec le test qui le tranche.
- Les rapports de contraste sont **calculés à la main** (formule WCAG, luminance relative sRVB) à partir des hex de `src/themes/ccc.theme.ts`. Non mesurés au navigateur ; à confirmer avec axe ou un pipette.
- Numéros RGAA cités de mémoire du référentiel 4.1, à recouper sur le référentiel officiel avant publication. Je n'ai pas pu consulter la source en ligne.
- Dérogations déjà documentées (F-02-AXE, Origam #1318, F-09 #1331) : non reportées.
- Admin : seule la coque est livrée (`src/layouts/admin.vue`) ; `admin/matchs.vue:1-9` est un squelette (titre h1 seul), et par recherche `admin/index`, `participants`, `tirages` n'ont qu'un h1. `admin/plus.vue` est lu en entier. Les écrans admin à venir (F-08) ne sont pas auditables.
- Priorité : **MUST** = non-conformité à un critère de niveau A/AA WCAG 2.1 ou RGAA 4.1 ; **SHOULD** = bonne pratique, critère WCAG 2.2, ou non-conformité probable à confirmer.

## Ce que le code fait bien (vérifié)

- `lang="fr"` : `nuxt.config.ts:35`.
- Lien d'évitement premier focalisable, visible au focus, vers `main#contenu tabindex=-1` : `default.vue:3,69-73`, `admin.vue:3,86-90`, `SkipLink.vue:3-6`, `main.css:44-45`.
- Un `main` (Origam `OrigamMain.vue`, `tag` par défaut `main`), `header` (Origam Toolbar `tag="header"`), `footer`, deux `nav` nommés distinctement (`default.vue:25-28,83`). `PageHero` pose son `header` dans `main` (donc pas un second banner) : `PageHero.vue:2`.
- Annonceur de route : `app.vue:3`. Un h1 par page via `PageHero`/`OrigamTitle`.
- Mouvement réduit : règle globale `main.css:53-56`, canvas non démarré (`useBubbles.ts:23,73`) et masqué (`BubblesBackdrop.vue:49-53`), règles locales (`HomeHero.vue:228-232`, `HomePint.vue:245-251`, `PlayerJourney.vue:247-251`).
- Décor `aria-hidden` : `BubblesBackdrop.vue:4`, `HomePint.vue:4`, `BrandMark.vue:5`. Le graphique du parcours est masqué et son tableau équivalent est annoncé : `PlayerJourney.vue:25,40-51`.
- Tableaux : caption (`OrigamTable.vue` rend `<caption>`), `th scope="col"` (`OrigamDataTableColumnCell.vue:6`), `aria-sort` (`OrigamDataTableHeaderCell.vue:5`). Zones de défilement focalisables et nommées : `EditionBracket.vue:19-25`, `EditionGroups.vue:23-29`, `EditionMatches.vue:52-57`, `HeadToHeadHistory.vue:23-24`. Alternative en liste du tableau : `EditionBracket.vue:76-104`.
- Onglets : `role=tablist/tab/tabpanel`, `aria-selected`, `aria-controls`, clavier (`OrigamTabs.vue:6-10`, `OrigamTab.vue:7-14`).
- Messages dynamiques : compteur en `role=status` `index.vue:23-28` (joueurs), squelette `role=status aria-busy` + libellé (`OrigamSkeletonGroup.vue:6-8`), alerte `role=alert` pour une erreur (`OrigamAlert.vue:8-9`).
- Formulaire de recherche joueurs : libellé visible lié, placeholder = exemple : `PlayersSearch.vue:10-35`.
- Contrastes calculés conformes : texte tertiaire `#a99ad0` sur raised 6,74:1 et sur default 7,33:1 ; néon `#ff3d9a` / nuit `#160b2e` 5,70:1 ; focus cyan `#3ee8ff` très contrasté sur fond sombre.
- Focus Origam des boutons : `OrigamBtn.vue:571-573` (2 px, `border.focus`), et anneau des champs `ccc.theme.ts:161-163`.

## MUST

### M1. Bordure des champs sous 3:1 (WCAG 1.4.11, RGAA 3.3) — CCC (thème), pas Origam
- Preuve : `ccc.theme.ts:159-164` (bordure du champ = `border.default`, opacité 1) ; `ccc.theme.ts:235` (`border.default` = `rgba(201,184,232,.18)`, `strong` = `.38`).
- Calcul : bordure fondue sur `surface.sunken` (#0e0620) ≈ 1,39:1 ; sur `surface.default` ≈ 1,32:1. Le fond du champ (`sunken`) contre la page (`default`) fait ≈ 1,05:1. Même `border.strong` ne donne que ≈ 2,3-2,4:1. **Aucun jeton de bordure existant n'atteint 3:1.**
- Touche : champ recherche et sélecteur d'édition (`/joueurs`), les deux sélecteurs du face-à-face, sélecteur d'édition (`/editions/{code}`, admin).
- Correctif : nouveau jeton de bordure de contrôle, par exemple alpha ≈ 0,5 (calculé ≈ 3,2-3,4:1), appliqué via `--origam-field---border-color`. À mesurer après changement.

### M2. Tri des colonnes impossible au clavier (WCAG 2.1.1 / 4.1.2, RGAA 7.1, 7.3) — Origam `OrigamDataTableHeaderCell`
- Preuve : `OrigamDataTableHeaderCell.vue:16` (`@click` sur le `th`), `:115-119`, et aucun `tabindex`, `role=button` ni `keydown` dans le composant ni dans `composables/DataTable`. CCC déclare `sortable: true` : `PlayersDirectory.vue:115-124`.
- Touche : annuaire `/joueurs` (seul tableau triable livré ; les autres sont `sortable: false`).
- Je ne sais pas si un autre chemin de tri clavier existe. `tests/e2e/a11y/F-04.spec.ts:45,86,180` appuient sur Entrée mais je n'ai pas établi sur quel élément. Test qui tranche : Tab depuis l'en-tête du tableau, vérifier que les `th` reçoivent le focus et que Entrée change `aria-sort`.
- Correctif : ouvrir une issue Origam (bouton dans le `th`), et en attendant utiliser le slot `header.<clé>` pour rendre un `<button>` dans l'en-tête.

### M3. État des puces-filtres non exposé et porté par la couleur seule (WCAG 4.1.2, 1.4.1, RGAA 7.1, 3.1) — CCC + Origam
- Preuve : `EditionMatches.vue:19-50` ; l'icône de sélection est supprimée (`filter-icon=""` ligne 35, slot `#filter` vide ligne 40). `OrigamChip.vue:12` rend `tabindex=0` mais aucun `role`, `aria-pressed` ni `aria-checked` dans `components/Chip/` (recherche vide) ni dans `OrigamChipGroup`. L'état sélectionné ne passe que par `bgColor` et la classe `edition-matches__count--selected` (`:44-47`).
- Je ne sais pas si une couche de groupe ajoute l'état à l'exécution. Test : snapshot ARIA Playwright (`locator.ariaSnapshot()`) sur `edition-matches-filters`.
- Correctif : rétablir un indicateur non coloré (coche ou soulignement) et exposer `aria-pressed`/`role=radio` ; remonter à Origam.

### M4. Score lu « 52 » au lieu de « 5 à 2 » (WCAG 1.3.1) — CCC
- Preuve : `HomeCurrentEdition.vue:70-75` : `{{ winnerScore }}<span aria-hidden>…</span>{{ loserScore }}` ; le séparateur est masqué et les deux nombres sont des nœuds texte adjacents sans espace.
- Je ne sais pas la sortie exacte des lecteurs d'écran ; la concaténation est celle du nom accessible calculé. Test : NVDA/VoiceOver sur la tuile, ou `ariaSnapshot()`.
- Correctif : texte masqué visuellement « 5 à 2 » (`.sr-only`) et chiffres visibles en `aria-hidden`, comme `HomeBento.vue:118-126` le fait déjà pour la tuile des matchs.

### M5. Animations infinies sans commande de pause (WCAG 2.2.2, RGAA 13.8) — CCC
- Preuve : `HomePint.vue:151,161,178` (`infinite`, > 5 s, démarrent seules), canvas en `requestAnimationFrame` continu `useBubbles.ts:69-75`, aucun bouton pause dans `HomeHero.vue`. Le palmarès utilise aussi le canvas (`BubblesBackdrop.vue:18`).
- `prefers-reduced-motion` atténue mais n'est pas un mécanisme de pause pour un utilisateur qui n'a pas réglé son système. L'exception « vitrines » de `CLAUDE.md` autorise l'animation, pas l'absence de contrôle.
- Correctif : bouton « Mettre en pause les animations » (classe sur le conteneur qui fige CSS et arrête le canvas), ou animations finies ≤ 5 s.

### M6. Abréviations non expliquées (RGAA 9.4 ; WCAG 3.1.4 est AAA, hors 2.1 AA) — CCC
- Preuve : en-têtes « J », « V », « D », « Diff. » `EditionGroups.vue:98-104` ; pastille « Q » `EditionGroups.vue:92-93` ; « ACP » et « CCC » `fr.json:384-385,393` ; codes « RG19 », « RG18 » dans les textes visibles (`EditionGroups.vue:91`, `EditionBracket.vue:138`).
- Correctif : `<abbr title>` au premier emploi par page, ou slot d'en-tête `header.played` avec texte masqué complet.

## SHOULD

### S1. Pastille « Q » : `aria-label` sur un élément non interactif
- `EditionGroups.vue:46-51` passe `aria-label` à `OrigamChip` ; un `aria-label` sur un conteneur générique est ignoré par la plupart des lecteurs, donc « Q » seul. Je ne sais pas quel élément racine `OrigamChip` rend ici (`rootTag`, `OrigamChip.vue:3`). Correctif : texte `.sr-only` « Qualifié·e ».

### S2. Résultat du face-à-face non annoncé (WCAG 4.1.3 AA ; à confirmer)
- `face-a-face.vue:25-48` : seul le squelette `role=status` est annoncé ; le contenu résultat n'a pas de région live. Je ne sais pas ce que le lecteur annonce. Test : NVDA, choisir deux joueurs. Correctif : région `role=status` annonçant « Face-à-face : A 3 victoires, B 2 ».

### S3. Changement de contexte à la sélection d'une édition (WCAG 3.2.2 A, RGAA 7.4 ; à confirmer)
- `EditionSelector.vue:19,52-56` + `editions/[id].vue:154-156` : choisir une option navigue. Je ne sais pas si `update:modelValue` d'`OrigamSelect` part à l'activation seule ou aussi aux flèches. Test : ouvrir le menu, flèche bas, observer l'URL. Correctif : bouton « Afficher » ou avertissement visible. L'admin (`AdminEditionSelect.vue`) change le contexte global sans bouton ; même question, non vérifié.

### S4. Anneau de focus possiblement rogné (WCAG 2.4.7)
- `default.vue:239-244` (`overflow-x: auto` sur le `nav` de l'en-tête ; `overflow-y` passe à `auto` et rogne l'anneau de 2 px + décalage, `OrigamBtn.vue:571-573`) ; même motif sur les onglets `editions/[id].vue:222-230`. Je ne sais pas l'ampleur. Test : Tab sur « Éditions » et sur le premier onglet, capture d'écran. Correctif : padding vertical du conteneur ≥ anneau + décalage.

### S5. Reflow à 320 px (WCAG 1.4.10, RGAA 10.11)
- `default.vue:243-244` : barre de navigation défilante, barre masquée ; `main.css:6` `overflow-x: clip` masque sans barre tout débordement de page. À 320 px les 4 entrées dépassent probablement (calcul approximatif, non mesuré). Test : viewport 320×256, `nav.scrollWidth > nav.clientWidth` et `documentElement.scrollWidth`. Les onglets défilants (`editions/[id].vue:228`) et le bandeau des règles (`GoldenRules.vue:194-205`) sont dans le même cas.

### S6. Bandeau des règles d'or non défilable au clavier sur mobile
- `GoldenRules.vue:194-205` : `overflow-x: auto`, scrollbar masquée, aucun enfant focalisable. Chrome et Firefox rendent normalement ces zones focalisables ; je ne sais pas pour Safari. Test : Tab dans une fenêtre ≤ 760 px.

### S7. Zone de recherche sans nom (le face-à-face)
- `HeadToHeadPicker.vue:11-15` : `role="search"` sans `aria-label`, contrairement à `PlayersSearch.vue:14`. Aussi : ce n'est pas une recherche au sens landmark ; `role="group"` (le `fieldset` + `legend` le nomme déjà) suffirait.

### S8. Cartes avec `aria-labelledby` sur `div`
- `HeadToHeadSummary.vue:97-107` : `OrigamCard` rend `div` par défaut (`OrigamCard.vue:233`), le nom est ignoré. Correctif : `tag="article"` (comme `HomeCurrentEdition.vue:3`).

### S9. Fil d'Ariane : page courante sans `aria-current`
- `PageHero.vue:64-68` (`disabled`, sans lien) ; `OrigamBreadcrumbItem.vue:6` ne pose `aria-current` que si le lien est actif. Correctif : slot `item` avec `aria-current="page"`. Le fil de `joueurs/[id].vue:6-12` est dans le même cas (non lu en détail).

### S10. Liens joueurs peu identifiables
- `PlayerLink.vue:2-12` : variante `text`, `inline`, sans soulignement. Dans une ligne de tableau ou de classement, le lien n'est reconnaissable qu'au survol (RGAA 10.6). Je ne sais pas le rendu exact : aucun cliché de référence n'est versionné (`tests/e2e/visual/` sans PNG dans ce dépôt). Test : capture d'écran de `/joueurs`.

### S11. Barre sticky et focus masqué (WCAG 2.4.11, critère 2.2, hors 2.1 AA)
- `default.vue:211-216` (en-tête `sticky`, z-index 30), onglets sticky `editions/[id].vue:223-224`, pas de `scroll-padding-top` sur `html` (recherche `scroll-padding` dans `src/` : aucun résultat ; seul `RulesVariants.vue:102` a un `scroll-margin-top`). Mobile : l'en-tête passe sur deux lignes (`default.vue:317-343`) et prend une part importante d'un viewport 320×256 (zoom 400 %). Test : Maj+Tab vers le haut de page longue.

### S12. Espacement du texte (WCAG 1.4.12)
- `overflow: hidden` sur le hero `HomeHero.vue:139` et la tuile champion `HomeBento.vue:431` ; interlignes serrés (`line-height: 0.88` du h1, `1.08` des règles d'or `GoldenRules.vue:128`). Je ne sais pas si du texte est rogné. Test : injecter l'espacement de la spec (interligne 1,5, lettre 0,12 em, mot 0,16 em, paragraphe 2 em) et capturer.

### S13. Contraste du titre néon
- Crème `#fff4dc` sur l'extrusion rose `#ff3d9a` : 3,01:1 (`main.css:31-32`, `ccc.theme.ts:243`), sans marge ; acceptable seulement car texte de grande taille. Texte du hero sur le canvas animé (traits alpha ≤ 0,42, `useBubbles.ts:41`) : je ne sais pas l'effet. Test : capture à plusieurs instants.

### S14. Titres de page sans nom de site
- `index.vue:57`, `regles.vue:73`, `joueurs/index.vue:76`, `editions/index.vue:42`, etc. : titres descriptifs et uniques mais sans `titleTemplate` (`nuxt.config.ts:34-41`). RGAA 8.5 satisfait ; amélioration seulement.

### S15. État « fiche introuvable » ou en chargement sans h1
- `joueurs/[id].vue:13-20` : le h1 est dans `PlayerHeader.vue:25`, absent tant que `competitor` est nul. Je ne sais pas si le titre de `origam-empty-state` est un titre HTML. Test : `/joueurs/inconnu`.

### S16. Navigation : deux systèmes exigés (RGAA 12.1, numéro à vérifier)
- Le site n'a que le menu (`public-navigation.const.ts:5-16`, le pied de page répète des liens du menu), ni plan du site ni moteur de recherche global. Je ne sais pas si le site entre dans « hormis cas particuliers ».

### S17. Pied de page sans liens légaux ni mention d'accessibilité
- `default.vue:78-102`, `public-navigation.const.ts:12-16`. Voir la section déclaration ci-dessous.

### S18. Couverture de test axe
- `tests/e2e/a11y/F-01.spec.ts:5` : étiquettes `wcag2a/aa/21a/21aa/22aa` seulement ; **pas** de `best-practice`, donc `landmark-one-main`, `region`, `heading-order`, `page-has-heading-one` ne sont pas exécutés. `playwright.config.ts:15` force `reducedMotion: 'reduce'` pour tous les tests : l'état animé n'est jamais testé par axe. Aucun test clavier visible sur le tri (M2) ni sur le focus rogné (S4). Correctifs : ajouter `best-practice` (ou ces règles), un projet sans `reducedMotion`, des tests de tabulation.

## Hors périmètre signalé

- Polices Google chargées depuis des serveurs tiers : `nuxt.config.ts:5,35-39`. Ce n'est pas un critère RGAA, mais un sujet RGPD à traiter avec les mentions légales.

## Déclaration d'accessibilité (si publiée)

Contenu attendu par le modèle de la DINUM (accessibilite.numerique.gouv.fr) et le décret 2019-768, de mémoire, à recouper à la source avant publication :
- identité de l'entité et URL du site ;
- état de conformité (totalement / partiellement / non conforme), référentiel et version (RGAA 4.1), date de l'évaluation, auteur de l'évaluation (auto-évaluation ou prestataire) ;
- résultat chiffré (taux de critères respectés), échantillon de pages auditées, technologies utilisées, environnement de test (navigateurs, lecteurs d'écran) ;
- contenus non accessibles : non-conformités par critère, dérogations pour charge disproportionnée, contenus hors champ ;
- moyen de contact pour signaler un défaut, et voie de recours (Défenseur des droits) ;
- date d'établissement de la déclaration ;
- mention « Accessibilité : (non / partiellement / totalement) conforme » accessible depuis chaque page, avec lien vers la déclaration ; schéma pluriannuel et plan d'actions pour les entités soumises.

**Je ne sais pas** si l'entité qui édite CCC est juridiquement soumise à cette obligation (statut, chiffre d'affaires) ni si la directive européenne sur l'accessibilité (en vigueur pour les services privés concernés depuis juin 2025) s'applique ; à établir avec le porteur du projet. Publier une déclaration sincère reste utile, mais elle ne peut pas annoncer « totalement conforme » tant que M1 à M6 sont ouverts et qu'aucun audit manuel n'a eu lieu.

## Tests qui trancheraient les « Je ne sais pas »

1. Axe + règles best-practice sur `/`, `/editions/{code}`, `/joueurs`, `/joueurs/{id}`, `/joueurs/face-a-face`, `/regles`, `/admin/plus` : S15, S18.
2. Tab/Maj+Tab/Entrée sur `/joueurs` (M2), `/editions/{code}` onglet Matchs (M3, S3, S4).
3. `ariaSnapshot()` : M3, S1.
4. Viewport 320×256 : S5, S6, S11.
5. Injection d'espacement du texte : S12.
6. NVDA ou VoiceOver : M4, S2.
7. Captures d'écran : S4, S10, S13.

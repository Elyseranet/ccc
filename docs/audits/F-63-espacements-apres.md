# Audit des espacements (F-63)

Généré par `npm run audit:spacing` (`packages/web/tests/e2e/audit/spacing.audit.ts`) le 2026-11-17.
Seuil : écart vertical < 4 px entre deux blocs frères empilés, ou chevauchement (écart négatif). Largeurs : 1440, 390.

Pages et états visités : 102. Cas retenus : **0** ; exclus par règle : 405.

## Par cause

| cause | cas |
|---|---|

## Par composant Origam enveloppant

| composant | cas |
|---|---|

## Par page

| page | 1440 | 390 |
|---|---|---|

## Règles d'exclusion

- `tableau` : parent ou enfant de table (`table`, `tr`, `td`…, rôles row / cell / rowgroup).
- `liste` : deux items de liste (`li`, rôles option / listitem / menuitem / tab / treeitem, `.origam-list-item`).
- `bracket` : à l'intérieur d'un tableau à élimination (`.origam-bracket`).
- `interne-origam` : deux parties internes d'un composant Origam (classes `origam-x__y`) ou intérieur d'un contrôle (bouton, lien, label, champ, puce, avatar, squelette).
- `typo` : lignes d'un même élément de texte (parent `h1`..`h6`, `p`, `label`, `small`, `b`, `strong`).
- `coque` : deux repères de la coque hors `main` (`header`, `main`, `footer`, `nav`, `aside`), bandes accolées par design.
- `gap-explicite` : le parent déclare un `row-gap` (même 0 ou 2 px) : choix de design.
- `padding` : l'écart VISIBLE atteint le seuil : un bloc sans fond, bordure, ombre, texte propre ni élément remplacé ne se voit pas, son bord visible est celui de son premier (dernier) descendant visible ; un bouton ou lien sans fond n'est vu que par son libellé.
- `texte-interligne` : écart de boîtes de 0 à 3 px entre deux faces de texte en ligne (fin de A et début de B : du texte, sans fond de bloc ni contrôle de formulaire, une puce en ligne admise) : l'interligne fait l'espacement, écart identique aux maquettes (mesure dev-f63b, 2026-11-17). Jamais appliquée quand la cause est `card__content`, `form__content`, `dialog` ou `async-state`.

## Exclusions par règle

| règle | cas |
|---|---|
| interne-origam | 118 |
| tableau | 116 |
| padding | 86 |
| gap-explicite | 36 |
| coque | 30 |
| texte-interligne | 11 |
| bracket | 4 |
| typo | 2 |
| liste | 2 |

## États non atteints

- /admin/editions/2026 @1440 : dialog [data-cy="edition-delete-open"] (déclencheur absent ou désactivé)
- /admin/editions/2026 @390 : dialog [data-cy="edition-delete-open"] (déclencheur absent ou désactivé)

## Détail

| page | état | largeur | parent | enfant A | enfant B | écart boîtes (px) | écart visible (px) | Origam | cause | parent (display gap) | gap perdu (ancêtre) |
|---|---|---|---|---|---|---|---|---|---|---|---|

## Corrections F-63 et vérifications (annotation manuelle, perdue si le fichier est régénéré)

Avant (`F-63-espacements-avant.md`, même script et mêmes règles, sources d'`origin/develop`) : 18 cas, 9 paires × 2 largeurs. Après : 0 cas. Le premier passage du 2026-11-17, avec des règles moins fines, en comptait 36 ; l'écart vient des règles `padding` (libellé des boutons texte) et `texte-interligne`, sans aucun cas `card__content`, `form__content`, `dialog` ni `async-state` écarté.

| cause | cas avant | correction |
|---|---|---|
| `card__content` (12) | `edition-closed`, `identity-form`, `account-block` | thème : `'origam-card': { contentDisplay: 'contents' }` (props d'abord) ; le `gap` déjà posé par chaque composant sur sa carte atteint les blocs du slot |
| `form__content` (2) | formulaire d'identité du compétiteur | enveloppe locale `.identity-form__fields` (raccourci commenté, à retirer quand origam expose `contentDisplay` sur Form) |
| `dialog` (2) | boîte d'invitation (texte / champ) | enveloppe locale `.confirm-dialog__body`, gap 12 px (raccourci commenté, à retirer quand origam expose `--origam-card__content---gap`) |
| `async-state` (2) | note sous la table de /admin/editions | marge haute locale de 16 px, valeur `.ed-note` de la maquette |

**Pourquoi AsyncState n'est pas corrigé globalement.** `display: contents` sur `.async-state` a été essayé puis retiré : le relevé de mise en page avant / après montrait des écarts non voulus sur 4 écrans, parce que le `gap` du parent s'ajoutait aux marges existantes et que les marges ne fusionnaient plus dans la grille. Mesures : /admin/phase-finale et /qualification, sections +20 px et paramètres +36 px (maquette : 24 px de marge, sans gap) ; /admin/phase-finale/cloture +20 ; /admin/participants, pagination +16 ; onglets → contenu des pages publiques d'édition +24. La marge F-47 du tableau de bord est conservée.

**Dialogues.** La valeur `contents` du thème descend dans la carte d'`origam-dialog` (mesuré : `style="display: contents"` sur le contenu de la carte), ce qui annulait le padding du contenu de la saisie de score. `'origam-dialog': { contentDisplay: 'flex' }` rend le rendu d'origine : contenu en flex colonne, padding 20 / 24 / 24 conservé, et à 390 × 420 la boîte défile toujours (`overflow-y: auto` sur `.origam-overlay__content`, hauteur visible 372 px pour 480 px de contenu).

**Styles `:deep(.origam-card__content)` déplacés sur la racine de la carte** (ils étaient annulés par `display: contents`) : `DrawRandomBand`, `MatchQueue`, `RoundDrawEntry`, `QualificationTies`, `admin/phase-finale/tirage.vue` (barrage) ; `RulesVariants` (`height: 100%` devenu sans objet) retiré. Ceux des dialogues (`ScoreEntryDialog`, `ConfirmDialog` en mode maquette) restent : le contenu de carte d'un dialogue n'est pas aplati.

**Relevé de mise en page** (`SPACING_AUDIT_LAYOUT`, 102 états, 1440 et 390, hauteur et distance au `data-cy` précédent) : seuls changent les écrans corrigés ci-dessus (edition-closed +20 / +20, fiche compétiteur +16 à +20, note de /admin/editions +16, invitation texte → champ 12 px). Seule autre différence : /editions/2026, onglet Tirages à 390 : le relevé « avant » a été pris avant que le panneau ne bascule (contenu de l'onglet Participants), ce n'est pas un changement de code.

**`qualification-prerequisites`** (texte puis lien « Voir les matchs restants ») : non modifié. Écart de boîtes 0 px et écart jusqu'au libellé 14,1 px, à l'identique de `.q-pre` dans `admin-qualification.html` (mesuré par Playwright à 1440 et 390).

**Écrans non atteints par l'audit** (pas de données dans la base de test sans écriture) : tirages avec brouillon, saisie d'un tour de phase finale (`RoundDrawEntry`, barrage), égalités de qualification (`QualificationTies`), boîte de suppression d'édition. Les e2e lancés pour F-63 sont listés dans le ticket.

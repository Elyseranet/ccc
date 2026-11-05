# Audit de conformité CCC (France / UE) — 2026-11-04

Lecture seule. Aucun fichier du dépôt modifié. Ce n'est pas un avis juridique. « Je ne sais pas » = non vérifié.

## 0. Faits constatés (code et instance de dev)

Données traitées (entités `src/server/db/typeorm/entities`) :
- `users` : email (254), hash du mot de passe (scrypt), rôle, statut, compteurs d'échecs de connexion, `last_login_at`, `created_at`.
- `competitors` : `display_name`, `first_name`, `last_name`, `nickname`, `phone` (facultatif, jamais exposé publiquement : `IMe` seul le porte, pour son titulaire).
- `competitor_avatars` : photo en base (bytea), type, taille, empreinte.
- `sessions` (hash du jeton, expiration, `last_seen_at`), `login_devices` (nonce, compteurs), `invitations` (hash du jeton, expiration 7 jours, `consumed_at`).
- Publiquement visibles : nom affiché, prénom, nom, surnom, avatar, résultats (`ICompetitorPublic`). Email et téléphone jamais publics (invariant 8 dans le code).
- Archives 2012-2026 : `src/assets/seeds/archives.sql` contient 146 compétiteurs avec **le seul nom affiché** (prénom + nom, ex. « Prénom Nom »), sans email ni téléphone, et aucun compte (0 ligne `users`). Ce sont des personnes **identifiables qui n'ont peut-être jamais consenti** à la publication de leur nom et de leurs résultats.
- Journaux : JSON sur stdout (`logger.util.ts`). `request_completed` ne contient pas d'IP. L'IP n'apparaît que sur `rate_limit_exceeded`, tronquée (IPv4 en /24, IPv6 en /64 : `truncateIpForLog`). Le limiteur de débit garde l'IP en mémoire (LRU). Des identifiants (`userId`, `competitorId`) figurent dans les journaux d'actions. Durée de rétention des journaux : **Je ne sais pas** (dépend de Coolify, non documentée dans le dépôt).
- Courriel : envoi d'invitations via nodemailer ; Mailpit en dev, **fournisseur SMTP de production non encore choisi** (README) : ce sera un sous-traitant.
- Hébergement : Coolify auto-hébergé ; l'hôte physique (VPS, société) n'est pas documenté : **Je ne sais pas**.
- Pas de fonction de suppression de compte ou d'export en libre-service (`src/server/api/v1/moi*` : lecture, modification, avatar). Purge des sessions expirées : oui (délai de grâce 24 h, `SESSION_PURGE_GRACE_MS`). Purge des invitations expirées, appareils expirés, comptes inactifs : non trouvée.

Cookies et stockages réellement posés (code) :

| Nom | Posé par | Finalité | Durée | Attributs |
|---|---|---|---|---|
| `ccc_session` (prod : `__Host-ccc_session`) | login, acceptation d'invitation | session authentifiée | 12 h absolues, 2 h d'inactivité (`auth.const.ts`) | httpOnly, SameSite=Lax, Secure en prod |
| `ccc_device` (prod : `__Host-…`) | login réussi | appareil de confiance, anti-force brute (SEC-A4) | 90 jours (`DEVICE_COOKIE_TTL_SECONDS`) | httpOnly, signé, Lax |
| `ccc_admin_edition` | admin, `useCookie` | mémorise l'édition choisie dans l'admin | durée par défaut de `useCookie` : **Je ne sais pas** (non précisée dans `useAdminEditionStore.ts`) | SameSite=Lax, **lisible en JS** |

- `localStorage`, `sessionStorage` : aucun usage dans `src/` (grep).
- Aucun outil de mesure d'audience, aucune publicité, aucun réseau social, aucun iframe tiers trouvé dans le code.
- Instance de dev : `curl -D` sur `/`, `/connexion`, `/joueurs` : **aucun `Set-Cookie`** pour un visiteur anonyme. Seul tiers : `fonts.googleapis.com` et `fonts.gstatic.com` (préconnexion et feuille de style dans le HTML de `/`, `nuxt.config.ts` l. 5 et 36-42). Constat annexe : `GET /connexion` répond **404** sur l'instance de dev (avec `content-security-policy: script-src 'none'`), ce qui est hors de ma mission mais à signaler au chef de projet.

## 1. Mentions légales

**Obligatoire** (le site est un service de communication au public en ligne). Cadre : loi 2004-575 (LCEN), **article 1-1** (identification de l'éditeur) ; l'ancien article 6 III renvoyait à ce contenu, la numérotation a été déplacée (la page Légifrance de l'ancien art. 6 III que j'ai lue ne porte plus que sur les FAI). Sources :
- Fiche officielle « Mentions obligatoires sur le site internet d'une entreprise », vérifiée le 13 octobre 2026 : https://entreprendre.service-public.gouv.fr/vosdroits/F37351 (cite LCEN art. 1-1, 1-2, 6 et 19 ; amendes 375 000 € société, 75 000 € entreprise individuelle ; nom du directeur de la publication ; coordonnées de l'hébergeur).
- Cette fiche **ne traite pas** le cas du particulier ni l'anonymat. Le régime d'anonymat de l'éditeur non professionnel (identité communiquée à l'hébergeur, seul le nom de l'hébergeur publié) est attesté par des sources secondaires (cabinets d'avocats) qui le rattachent à l'art. 1-1, II depuis la loi SREN du 21 mai 2024. **Je ne sais pas** le vérifier sur le texte Légifrance (la page demandée a renvoyé 404). À faire vérifier par l'utilisateur ou un juriste avant de s'appuyer dessus.

**Site de particulier ou d'entreprise ?** CCC est un « tournoi entre amis » réalisé par Elysera ; le statut de l'éditeur n'est pas documenté dans le dépôt (**Je ne sais pas**). Tant que le site est non commercial, sans publicité ni vente, il relève plutôt du régime « non professionnel ». **Décision à poser à l'utilisateur** : qui édite (lui en personne, une association, Elysera) ?

Informations à demander (aucune n'est inventée) :
1. L'éditeur est-il une personne physique, une association ou une société ? Si personne physique non professionnelle : veut-il l'anonymat (publier uniquement l'hébergeur) ?
2. Éditeur : nom, prénom (ou dénomination, forme juridique, capital, siège, RCS/RNE si société ou association déclarée), adresse, email, téléphone.
3. Directeur de la publication (nom) et, le cas échéant, responsable de la rédaction.
4. Hébergeur : nom ou dénomination sociale, adresse, téléphone. À identifier : Coolify est un logiciel, l'hébergeur est la société qui fournit le serveur. Je ne sais pas laquelle.
5. Réalisation : Elysera, forme juridique et site (voir point 5) ; contact éventuel.
6. Contact RGPD : adresse email dédiée.

Page à créer : `/mentions-legales`, titre « Mentions légales ». Contenu minimal : Éditeur ; Directeur de la publication ; Hébergeur ; Contact ; Propriété intellectuelle ; Crédits (Elysera, Origam) ; lien vers confidentialité, CGU, accessibilité.

## 2. RGPD et politique de confidentialité

**Obligatoire.** Le RGPD s'applique : site public sur Internet, comptes, email, photo ; l'exception « activités personnelles ou domestiques » (art. 2.2.c) ne couvre pas la publication ouverte à tous (CJUE, Lindqvist C-101/01, 2003 : de mémoire, **non revérifié ici**, à confirmer sur EUR-Lex). Information des personnes : RGPD art. 13/14 (texte non rouvert ici ; connu, à confirmer sur https://eur-lex.europa.eu/eli/reg/2016/679/oj).

### Tableau finalités, base légale, durées

| Traitement | Données | Base légale (proposée) | Durée (à décider) |
|---|---|---|---|
| Gestion des comptes joueurs et admin | email, hash mdp, rôle, statut | exécution du service demandé (art. 6.1.b) | tant que le compte existe ; suppression à la demande ; politique d'inactivité : **décision** |
| Publication des résultats, classements, fiches joueurs | nom affiché, prénom, nom, surnom, résultats | intérêt légitime (6.1.f) pour les archives sans compte ; consentement ou contrat pour les inscrits | durée du tournoi et archives : **décision** |
| Photo (avatar) | image | consentement (facultatif, retirable) | jusqu'au retrait ou à la suppression du compte |
| Téléphone (facultatif) | numéro | consentement | jusqu'au retrait |
| Sécurité (sessions, appareils, limite de débit, journaux) | jeton haché, IP tronquée, identifiants | intérêt légitime (sécurité, 6.1.f) | sessions : 12 h + 24 h ; appareils : 90 j ; journaux : **Je ne sais pas** (à fixer, ex. 3 à 12 mois : proposition à valider, pas une règle) |
| Courriels d'invitation | email | exécution du service | jeton valide 7 jours ; purge des invitations à coder |

La CNIL cadre la conservation en trois phases (base active, archivage intermédiaire, suppression) : https://www.cnil.fr/limiter-la-conservation-des-donnees (page consultée via recherche ; tableaux de durées non lus).

### Droits et recours
Droits listés par la CNIL : information, opposition, accès, rectification, effacement, portabilité, limitation, décision automatisée : https://www.cnil.fr/fr/les-droits-pour-maitriser-vos-donnees-personnelles. Délai de réponse d'un mois : c'est l'art. 12.3 RGPD, **non vérifié dans cette session** (la page CNIL lue ne le mentionne pas). Réclamation possible auprès de la CNIL. Prévoir une adresse email de contact et une procédure manuelle (aucune route de suppression en libre-service n'existe ; c'est acceptable pour un site de cette taille tant qu'une demande est traitée).

### Points d'attention propres à CCC (décisions à poser)
1. **Archives 2012-2026** : 146 personnes affichées par leur nom sans compte. Base légale probable : intérêt légitime, mais cela impose d'informer les personnes (art. 14), d'honorer le droit d'opposition, et de prévoir un mécanisme de retrait/pseudonymisation. **Décision** : pseudonymiser par défaut, ou garder les noms et prévoir une procédure d'opposition ? Recommandation : garder et prévoir l'opposition (contact + procédure), car le jeu repose sur l'historique entre amis.
2. **Google Fonts (T-RGPD-01, T-SEC-16)** : l'IP du visiteur part chez Google à chaque page. Décision de justice allemande : LG München I, 3 O 17493/20, 20 janvier 2022 (100 € de dommages et intérêts, injonction), source secondaire : https://www.gesetze-bayern.de/Content/Document/Y-300-Z-GRURRS-B-2022-N-612?view=Print. Jurisprudence allemande, non contraignante en France. **Recommandation : auto-héberger les polices** (T-SEC-16) : supprime le tiers, la mention et le risque, sans bandeau. Vérifier la licence (le ticket le prévoit ; Bagel Fat One et Gabarito sont des polices Google Fonts sous licence OFL, **à confirmer** sur chaque fiche).
3. Sous-traitants à lister dans la politique : hébergeur, fournisseur SMTP (à choisir), Coolify n'est pas un sous-traitant (logiciel auto-hébergé). Transferts hors UE : **Je ne sais pas** (dépend de l'hébergeur et du fournisseur SMTP).
4. Photo en base (bytea) : pas de donnée sensible au sens de l'art. 9 par nature, mais une photo n'est pas de la biométrie sauf traitement dédié (non fait).
5. Minimisation : le prénom/nom en plus de `display_name` est facultatif, bien.
6. Mineurs : **Je ne sais pas** si des mineurs participent ; à demander (consentement des parents sous 15 ans en France pour les services de la société de l'information, art. 45 loi Informatique et Libertés, **non revérifié**).

### Registre des traitements
La CNIL : obligatoire pour tous les organismes quelle que soit la taille ; les moins de 250 salariés ne tiennent que les traitements **non occasionnels**, à risque, ou sensibles ; en cas de doute, l'intégrer : https://www.cnil.fr/fr/RGPD-le-registre-des-activites-de-traitement. La gestion des comptes est un traitement non occasionnel : **registre nécessaire (recommandé fortement)**, simple tableau (voir ci-dessus) à ne pas publier. Si l'éditeur est un particulier agissant à titre strictement privé, l'applicabilité est discutable : **Je ne sais pas** ; le tenir reste peu coûteux.

Page à créer : `/confidentialite`, « Politique de confidentialité ». Contenu : responsable de traitement et contact ; données traitées et origine (dont archives) ; finalités et bases légales ; durées ; destinataires et sous-traitants ; transferts hors UE ; droits et comment les exercer ; réclamation CNIL (https://www.cnil.fr/fr/plaintes) ; cookies (voir point 3) ; date de mise à jour.

## 3. Cookies

Règle : l'art. 82 de la loi Informatique et Libertés (transposition de l'art. 5.3 de la directive ePrivacy) exige information et consentement préalables pour déposer ou lire un traceur, **sauf** s'il est strictement nécessaire au service demandé ou a pour seule finalité la communication électronique. La CNIL liste parmi les exemptés : choix de l'utilisateur sur les traceurs, **authentification (y compris sécurité)**, panier, personnalisation de l'interface intrinsèque au service, équilibrage de charge, certaines mesures d'audience sous conditions. « Ces traceurs ne nécessitent pas de consentement des internautes » ; les traitements de données associés restent soumis au RGPD. Sources : https://www.cnil.fr/fr/cookies-comment-mettre-mon-site-web-en-conformite (1er octobre 2020) ; https://www.cnil.fr/fr/cookies-et-traceurs-que-dit-la-loi ; lignes directrices délibération 2020-091 et recommandation 2020-092 du 17 septembre 2020 (https://www.cnil.fr/fr/cookies-et-autres-traceurs/regles/cookies/lignes-directrices-modificatives-et-recommandation). Une FAQ CNIL du 29 avril 2026 existe sur les lignes modifiées : je ne l'ai **pas lue**.

Application à CCC :
- `ccc_session` : authentification, exempté.
- `ccc_device` : sécurité de l'authentification (anti-force brute), rattaché à l'authentification, exempté ; justification à documenter, la durée de 90 jours est longue mais l'objectif est sécuritaire. Analyse : mon avis, pas une position CNIL écrite.
- `ccc_admin_edition` : préférence d'interface réservée à l'admin connecté, exempté (personnalisation intrinsèque). À limiter à l'admin et à lui donner une durée explicite.
- Polices Google : ce n'est pas un cookie, mais un appel tiers qui transmet l'IP ; l'auto-hébergement règle le sujet.

**Conclusion : un bandeau de consentement n'est PAS obligatoire** pour l'état actuel. Ne pas en mettre (un bandeau inutile est contraire à la minimisation et dégrade l'expérience). **Obligatoire/recommandé** : une information (dans la politique de confidentialité, section « Cookies » avec le tableau ci-dessus). L'utilisateur a demandé « l'acceptation des cookies » : à lui expliquer qu'une acceptation n'a pas lieu d'être tant qu'aucun traceur soumis à consentement n'existe. **Déclencheur d'un futur bandeau** : ajout d'une mesure d'audience non exemptée, d'une vidéo ou carte tierce, d'un réseau social, ou de publicité. Un lien « Gérer les cookies » serait alors requis en pied de page (CNIL : refuser aussi simple qu'accepter).

Décision à poser : (a) pas de bandeau, section d'information (recommandé) ; (b) bandeau malgré tout (non recommandé).

## 4. CGU

**Non obligatoires** légalement pour ce site gratuit (pas de vente : pas de CGV). **Recommandées** car il y a des comptes, des contenus déposés (photo), des règles de conduite et une limitation de responsabilité. Les CGV (code de la consommation) ne s'appliquent pas sans vente : c'est mon analyse, non sourcée ici.

Page `/cgu` « Conditions d'utilisation », contenu minimal : objet et éditeur ; accès gratuit ; création de compte sur invitation, exactitude, confidentialité du mot de passe ; contenus déposés (photo) : droit de l'utilisateur sur l'image, interdiction des contenus illicites, droit de retrait ; règles de conduite ; propriété intellectuelle (marque, Origam, Elysera) ; exactitude des résultats et archives (pas de garantie) ; suspension/suppression de compte ; limitation de responsabilité ; données personnelles (renvoi à `/confidentialite`) ; droit applicable (droit français) et médiation : **mention du médiateur de la consommation requise seulement en B2C commercial**, **Je ne sais pas** si applicable ici ; modification des CGU. Point juridique à faire relire par un juriste.

## 5. Copyright et mention Elysera / Origam

- Le droit d'auteur n'exige **aucune mention** de « © » (protection automatique, code de la propriété intellectuelle art. L111-1, non rouvert ici) ; la mention est facultative mais usuelle. Forme : `© 2012-2026 Championnat de Caps` ou `© 2026 <titulaire>` ; le titulaire (éditeur ? Elysera ?) est **à demander**. Les résultats du jeu et les contenus des joueurs (photos) ne sont pas la propriété de l'éditeur : formuler « Tous droits réservés » avec prudence, ou « Contenus des joueurs reproduits avec leur accord ».
- Crédit : « Site réalisé par Elysera avec Origam » (ou « conçu par ») ; est-ce l'éditeur ou un tiers : le lier aux mentions légales. Auto-promotion de l'éditeur : légalement libre. **Aucune règle spécifique** trouvée à ce sujet.
- Lien : `<a href="…" rel="noopener">` pour un lien normal ; `rel="noreferrer"` est inutile pour de la sécurité (noopener est implicite avec `target=_blank`) mais couvre la vie privée. Le lien est **éditorial et gratuit** (c'est l'auteur du site, pas une contrepartie commerciale) : pas de `nofollow`/`sponsored` obligatoire ; `nofollow` n'est utile que si l'on veut ne transmettre aucune autorité SEO. Recommandation : lien simple vers Elysera, `rel="noopener"`, ouvert dans le même onglet, avec URL à fournir par l'utilisateur. Cohérence : sur `/invitation/**`, la politique `Referrer-Policy: no-referrer` reste respectée.

## 6. Accessibilité (obligations légales)

- **Loi du 11 février 2005, article 47** et RGAA (décret 2019-768, arrêté du 20 septembre 2019). Champ d'application (https://accessibilite.numerique.gouv.fr/obligations/champ-application/) : personnes morales de droit public ; personnes morales de droit privé délégataires d'une mission de service public ou créées pour des besoins d'intérêt général non industriels ni commerciaux, sous conditions de financement/contrôle public ; **entreprises à partir de 250 M€ de chiffre d'affaires** (moyenne France sur trois exercices). Les organismes privés à but non lucratif sans service essentiel au public sont exclus.
- **Conclusion RGAA : non applicable à CCC** (site d'un tournoi entre amis, ni public, ni délégataire, ni entreprise à 250 M€). Sauf si l'éditeur est une entité publique ou une entreprise à ce seuil : à confirmer avec la réponse du point 1.
- **European Accessibility Act (directive 2019/882)**, applicable depuis le 28 juin 2025 : concerne une liste fermée de produits et services (dont le commerce électronique, la banque de détail, les communications électroniques) avec dérogation des microentreprises de services. Un site gratuit de résultats sportifs ne figure pas dans cette liste d'après les synthèses lues (sources secondaires). **Je ne sais pas** le confirmer sur le texte EUR-Lex (page non récupérée) : https://eur-lex.europa.eu/eli/dir/2019/882/oj. Probable non applicable tant qu'il n'y a ni vente ni paiement.
- Conclusion : **déclaration d'accessibilité non obligatoire ; recommandée** (bonne pratique, et cohérente avec l'effort déjà fait : lien d'évitement, sémantique, e2e a11y). Si l'utilisateur la veut, contenu RGAA (https://accessibilite.numerique.gouv.fr/obligations/declaration-accessibilite/) : état de conformité (non/partiellement/totalement conforme ; partiel = au moins 50 % des critères), liste des contenus non accessibles et dérogations, moyen de contact accessible (email ou formulaire), mention du recours au Défenseur des droits, page directement accessible depuis toute page. Ne jamais affirmer « conforme RGAA » sans audit : l'état de conformité repose sur un audit (qui n'existe pas dans le dépôt). Formulation honnête proposée : « Nous visons l'accessibilité (WCAG 2.2 niveau AA / RGAA 4), aucun audit RGAA complet n'a été réalisé. » Page `/accessibilite`.

## 7. Récapitulatif des pages et du pied de page

Pages : `/mentions-legales`, `/confidentialite` (avec section cookies), `/cgu`, `/accessibilite` (recommandée). Pied de page : liens vers ces 4 pages ; ligne « © année titulaire » ; ligne « Site réalisé par Elysera avec Origam » (lien). Pas de bouton d'acceptation des cookies.

Vérifications annexes : exposer l'emplacement de `/mentions-legales` dans le fichier de traductions (clés i18n en `snake_case`), `data-cy` sur les liens, thèmes Origam.

## 8. Décisions à poser à l'utilisateur (via le chef de projet)

1. Qui est l'éditeur (personne physique, association, Elysera) et anonymat de l'éditeur ? (conditionne mentions légales, accessibilité, titulaire du ©)
2. Archives : garder les noms avec procédure d'opposition (recommandé), ou pseudonymiser ?
3. Polices : auto-héberger (T-SEC-16, recommandé) ou conserver Google Fonts et l'écrire dans la politique ?
4. Cookies : information seule, pas de bandeau (recommandé) ou bandeau malgré tout ?
5. Durées : conservation des comptes inactifs, des journaux, des invitations ; durée du cookie `ccc_admin_edition`.
6. Déclaration d'accessibilité : publier une page honnête, ou rien ?
7. Fournisseur SMTP de production (sous-traitant) et hébergeur : à nommer.
8. Mineurs parmi les joueurs ?

## 9. Non vérifié (« Je ne sais pas »)

Texte exact de l'art. 1-1 LCEN (Légifrance renvoie 404) ; régime d'anonymat sur source primaire ; EAA sur EUR-Lex ; délai d'un mois RGPD (art. 12.3) ; Lindqvist ; âge de 15 ans ; durées de rétention des journaux ; hébergeur réel ; FAQ CNIL du 29 avril 2026.

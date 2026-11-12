import { resolve } from 'node:path'
import { getSessionCookieName } from '../../../src/utils/session-token.util'

/** Jetons des sessions de test écrits par `prepare-database.ts` (dossier gitignoré). */
export const E2E_SESSIONS_FILE = resolve('test-results', 'e2e-sessions.json')

export const E2E_TEST_DATABASE_SUFFIX = '_test'

/**
 * Les e2e tournent sur `nuxt dev` en HTTP : `playwright.config.ts` démarre le serveur avec
 * `NUXT_AUTH_SECURE_COOKIE=${E2E_SECURE_COOKIE}` (L3, T-SEC-04 : sinon le défaut `true` donne `__Host-ccc_session`).
 * Le nom du cookie est dérivé de la même fonction que le serveur, pour la même valeur : il ne peut pas diverger.
 */
export const E2E_SECURE_COOKIE = false
export const E2E_SESSION_COOKIE = getSessionCookieName({ secureCookie: String(E2E_SECURE_COOKIE) })

export const E2E_BASE_URL = process.env.E2E_BASE_URL ?? `http://localhost:${process.env.E2E_PORT ?? 3100}`

/**
 * Marges de l'aplat de valeur dans la boîte du champ (F-14, M1), identiques côté maquette et côté application :
 * `left` = padding gauche 20 px + filet 1 px ; `right` = padding droit 40 px + filet 1 px (le chevron de la maquette
 * est à 22 px du bord droit, il reste donc visible) ; `vertical` = marge haute et basse, pour laisser filet et arcs.
 */
export const VALUE_MASK_INSETS = { left: 21, right: 41, vertical: 6 }

/*********************************************************
 * Édition en cours dans la base de test (QA-2, T-QA-03)
 *
 * @description
 * Le dump d'archives clôture les 16 éditions, 2026 comprise. La préparation de la base remet 2026 en phase de poules, une
 * seule fois et pour tous les tests. La règle : l'édition passe en `POOLS_PLAYING`, le tour de poules en `PLAYING`, les
 * autres tours en `PENDING` ; leurs matchs repassent à « programmé » sans score ; pour chaque poule, la fraction
 * `numérateur / dénominateur` de ses matchs (les derniers par numéro de séquence, arrondi à l'inférieur) repasse aussi à
 * « programmé » ; les participations perdent leur issue (étape finale, points, rang de poule). Aucune ligne n'est créée ni supprimée.
 * Avec les poules de 2026 (21, 15, 21 et 15 matchs) et un tiers, 24 matchs de poule sur 72 sont à jouer : 48 validés.
 ********************************************************/
export const E2E_IN_PROGRESS_EDITION_CODE = '2026'

export const E2E_POOL_REWIND_NUMERATOR = 1

export const E2E_POOL_REWIND_DENOMINATOR = 3

/**
 * État nominal du tableau de bord (QA-2 bis, F-07) : dans chaque poule, la fraction `numérateur / dénominateur` des matchs
 * de poule (arrondie à l'inférieur) qui suivent immédiatement ceux remis à « programmé » (par séquence décroissante) est
 * laissée à l'état « saisi » : `recorded_at` posé, ni score validé ni date de validation. Avec les poules de 2026 (21, 15, 21 et 15 matchs)
 * et un dixième : 2, 1, 2 et 1 matchs, soit 6 matchs saisis sur 72.
 */
export const E2E_POOL_RECORDED_NUMERATOR = 1

export const E2E_POOL_RECORDED_DENOMINATOR = 10

/**
 * Dates de saisie et de validation des matchs de poule de 2026 (le dump n'en porte aucune) : les matchs de poule non
 * programmés sont classés par séquence croissante puis par id ; le rang `r` (à partir de 1) donne `validated_at` =
 * `E2E_POOL_ACTIVITY_START` + `r` × `E2E_POOL_ACTIVITY_STEP_MINUTES` minutes, et `recorded_at` deux minutes plus tôt. Les matchs saisis, qui ont
 * les plus fortes séquences, sont donc les plus récents. Aucune insertion : ce sont des mises à jour de lignes existantes.
 */
export const E2E_POOL_ACTIVITY_START = '2026-06-01T10:00:00Z'

export const E2E_POOL_ACTIVITY_STEP_MINUTES = 5

export const E2E_POOL_RECORDED_LEAD_MINUTES = 2

/**
 * Comptes de test rattachés à des compétiteurs réels des archives (ARCH-9), retrouvés par leur nom d'affichage :
 * `member` (lecture : profil, captures), `edit` (écritures : téléphone, avatar, mot de passe), `login` (connexion réelle), `logout` et `logoutHeader` (déconnexion depuis le profil et depuis l'en-tête, qui révoquent leur session),
 * `invited*` (invitations valide, d'activation, expirée, consommée). Aucun de ces compétiteurs n'est dans la paire du face-à-face.
 */
export const E2E_ACCOUNT_COMPETITORS = {
  member: 'Alan Denoyelle',
  edit: 'Alan Gabriel',
  login: 'Alex Madec',
  logout: 'Antoine Savary',
  logoutHeader: 'Antoine Pagès',
  expired: 'Arthur Remion',
  invited: 'Alice Rosette',
  invitedFlow: 'Amandine Content',
  invitedExpired: 'Andréa Busetto',
  invitedConsumed: 'Antoine Gallais'
} as const

/** Téléphone posé sur les compétiteurs des comptes de test : donnée de test, jamais une donnée publique. */
export const E2E_PHONE = '+33 6 00 00 00 00'

/**
 * Identité posée sur le compétiteur du compte `member`, pour que le profil affiche un pseudo comme la maquette (les archives n'en
 * portent pas). Donnée de la base de test uniquement ; le nom d'affichage, lui, ne change pas.
 */
export const E2E_MEMBER_IDENTITY = { firstName: 'Alan', lastName: 'Denoyelle', nickname: 'Rebond' } as const

/** Budget par IP des routes à jeton d'invitation et d'envoi d'avatar pendant les e2e (une seule IP pour toute la suite). */
export const E2E_RATE_LIMIT_MAX_REQUESTS = 1000

/*********************************************************
 * Éditions créées par les tests d'écriture (QA-3)
 *
 * @description
 * Un test d'écriture crée sa propre édition par l'API réelle (`POST /editions`), sans toucher aux archives ni à 2026. Le
 * serveur génère le code (`2090`, `2090b`… jusqu'à `z`, CE-1) sous verrou : deux créations simultanées ne collisionnent
 * jamais. Reste à ne pas épuiser les 26 codes d'une année : l'année vient d'un hachage du libellé du test, dans
 * `E2E_WRITE_YEAR_FIRST` à `E2E_WRITE_YEAR_FIRST + E2E_WRITE_YEAR_SPAN - 1` (2050 à 2099, entre les bornes 2000 et
 * 2100 de l'API et au-delà des archives 2012 à 2026), soit 1 300 codes par exécution, la base étant remise à neuf à
 * chaque lancement. Une année épuisée (409 `EDITION_CODE_EXHAUSTED`) passe à la suivante.
 ********************************************************/
export const E2E_WRITE_YEAR_FIRST = 2050
export const E2E_WRITE_YEAR_SPAN = 50
export const E2E_WRITE_EMAIL_DOMAIN = 'ccc-e2e.example'

/** Cookie du sélecteur d'édition de l'admin (`ADMIN_EDITION_COOKIE`) : il désigne l'édition de travail des pages `/admin/**`. */
export const E2E_ADMIN_EDITION_COOKIE = 'ccc_admin_edition'

/** Courriels « envoyés » par le serveur de test : transport `capture` (une ligne JSON par message), remis à zéro à chaque lancement. */
export const E2E_MAIL_CAPTURE_FILE = resolve('test-results', 'e2e-mail.jsonl')

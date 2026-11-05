import { ADMIN_DASHBOARD_STATIC_SUBTITLES, ADMIN_DASHBOARD_STATUS_TEXTS, ADMIN_DASHBOARD_STEPS, ADMIN_DASHBOARD_STEP_COUNT } from '../consts/admin-dashboard.const.js'
import { ADMIN_MATCH_FILTER_QUERY_PARAM } from '../consts/admin-match-filters.const.js'
import { HTTP_STATUS_FORBIDDEN, HTTP_STATUS_NOT_FOUND, HTTP_STATUS_UNAUTHORIZED } from '../consts/http-status.const.js'
import { ROUND_LABELS } from '../consts/round-labels.const.js'
import { ROUTES } from '../consts/routes.const.js'
import { ADMIN_MATCH_FILTER } from '../enums/admin-match-filter.enum.js'
import { ADMIN_ACTIVITY_TARGET } from '../enums/admin-activity.enum.js'
import { ADMIN_DASHBOARD_ERROR, ADMIN_DASHBOARD_STEP, ADMIN_DASHBOARD_STEP_STATUS, ADMIN_DASHBOARD_TODO } from '../enums/admin-dashboard.enum.js'
import { API_ERROR_CODE } from '../enums/api-error-code.enum.js'
import { DRAW_KIND, DRAW_STATUS } from '../enums/draw.enum.js'
import { EDITION_STATUS } from '../enums/edition.enum.js'
import { MATCH_STATUS } from '../enums/match.enum.js'
import { ROUND_KIND, ROUND_STATUS } from '../enums/round.enum.js'
import type { IAdminActivityDrawTarget, IAdminActivityItem, IAdminActivityMatchTarget } from '../interfaces/admin-activity.interface.js'
import type { IAdminActivityRow, IAdminDashboardCounters, IAdminDashboardData, IAdminDashboardStepItem, IAdminDashboardTodoItem, IAdminDashboardView } from '../interfaces/admin-dashboard.interface.js'
import type { IApiError } from '../interfaces/error.interface.js'
import type { IRound } from '../interfaces/round.interface.js'
import type { TTranslate } from '../types/translate.type.js'

/*********************************************************
 * Étape active du centre de contrôle
 *
 * @description
 * Les neuf étapes de la Spec fonctionnelle se déduisent de `EDITION_STATUS` (« États et transitions »), table arrêtée par le lead front :
 * CREATED -> 2 (la création est faite), REGISTRATION -> 2, POOLS_DRAWN -> 4, POOLS_PLAYING -> 4 puis 5 quand tous les matchs de poule
 * sont validés, QUALIFIED -> 6, CLOSED -> aucune étape active (tout est fait).
 * L'enum ne porte qu'un état PLAYOFFS : le tour en cours se lit sur le premier tour non terminé
 * (PENDING -> 6, DRAWN ou PLAYING -> 7, finale DRAWN ou PLAYING -> 8) ; tous les tours terminés mais l'édition non clôturée -> 9.
 ********************************************************/
const isPoolRound = (round: IRound): boolean => round.kind === ROUND_KIND.POOLS

const arePoolsFullyValidated = (rounds: IRound[]): boolean => {
  const pools = rounds.find(isPoolRound)
  return pools !== undefined && pools.matchCount > 0 && pools.validatedMatchCount === pools.matchCount
}

const resolvePlayoffStep = (rounds: IRound[]): ADMIN_DASHBOARD_STEP => {
  const current = rounds
    .filter(round => !isPoolRound(round))
    .sort((a, b) => a.sequence - b.sequence)
    .find(round => round.status !== ROUND_STATUS.COMPLETED)
  if (!current) {
    return ADMIN_DASHBOARD_STEP.CLOSING
  }
  if (current.status === ROUND_STATUS.PENDING) {
    return ADMIN_DASHBOARD_STEP.BRACKET_DRAW
  }
  return current.kind === ROUND_KIND.FINAL ? ADMIN_DASHBOARD_STEP.FINAL : ADMIN_DASHBOARD_STEP.BRACKET_MATCHES
}

export const resolveActiveStep = (status: EDITION_STATUS, rounds: IRound[]): ADMIN_DASHBOARD_STEP | null => {
  switch (status) {
    case EDITION_STATUS.CREATED:
    case EDITION_STATUS.REGISTRATION:
      return ADMIN_DASHBOARD_STEP.PARTICIPANTS
    case EDITION_STATUS.POOLS_DRAWN:
      return ADMIN_DASHBOARD_STEP.POOL_MATCHES
    case EDITION_STATUS.POOLS_PLAYING:
      return arePoolsFullyValidated(rounds) ? ADMIN_DASHBOARD_STEP.QUALIFIED_VALIDATION : ADMIN_DASHBOARD_STEP.POOL_MATCHES
    case EDITION_STATUS.QUALIFIED:
      return ADMIN_DASHBOARD_STEP.BRACKET_DRAW
    case EDITION_STATUS.PLAYOFFS:
      return resolvePlayoffStep(rounds)
    case EDITION_STATUS.CLOSED:
    default:
      return null
  }
}

export const resolveStepStatus = (step: ADMIN_DASHBOARD_STEP, active: ADMIN_DASHBOARD_STEP | null): ADMIN_DASHBOARD_STEP_STATUS => {
  if (active === null || step < active) {
    return ADMIN_DASHBOARD_STEP_STATUS.DONE
  }
  return step === active ? ADMIN_DASHBOARD_STEP_STATUS.ACTIVE : ADMIN_DASHBOARD_STEP_STATUS.PENDING
}

/*********************************************************
 * Compteurs
 *
 * @description
 * Matchs de poule validés sur total : tours POOLS de `GET /editions/{id}`.
 * Saisis (RECORDED) et sans score (SCHEDULED, poules) : file admin, jamais la vue publique (qui publie RECORDED comme SCHEDULED).
 * Tirages en attente : brouillons (DRAFT) de `GET /admin/editions/{id}/tirages`.
 ********************************************************/
export const computeCounters = (data: IAdminDashboardData): IAdminDashboardCounters => {
  const pools = data.edition.rounds.find(isPoolRound)
  return {
    poolMatchCount: pools?.matchCount ?? 0,
    poolValidatedCount: pools?.validatedMatchCount ?? 0,
    recordedCount: data.adminMatches.filter(match => match.status === MATCH_STATUS.RECORDED).length,
    scheduledCount: data.adminMatches.filter(match => match.status === MATCH_STATUS.SCHEDULED && match.roundKind === ROUND_KIND.POOLS).length,
    pendingDrawCount: data.draws.filter(draw => draw.status === DRAW_STATUS.DRAFT).length
  }
}

/*********************************************************
 * Étapes
 *
 * @description
 * Titre, sous-titre et statut de chacune des neuf étapes, au format de `origam-stepper` (`items`).
 ********************************************************/
const poolDrawCount = (data: IAdminDashboardData): number => {
  const draw = data.draws.find(item => item.kind === DRAW_KIND.POOLS)
  return draw?.parameters.poolCount ?? data.edition.pools.length
}

const isPoolDrawValidated = (data: IAdminDashboardData): boolean =>
  ![EDITION_STATUS.CREATED, EDITION_STATUS.REGISTRATION].includes(data.edition.status)
  || data.draws.some(item => item.kind === DRAW_KIND.POOLS && item.status === DRAW_STATUS.VALIDATED)

const stepSubtitle = (step: ADMIN_DASHBOARD_STEP, data: IAdminDashboardData, counters: IAdminDashboardCounters, t: TTranslate): string => {
  const count = data.edition.participants.length
  switch (step) {
    case ADMIN_DASHBOARD_STEP.CREATION:
      return ''
    case ADMIN_DASHBOARD_STEP.PARTICIPANTS:
      return t('admin.dashboard.step_participants_subtitle', '{count} participants inscrits', { count })
    case ADMIN_DASHBOARD_STEP.POOL_DRAW: {
      if (isPoolDrawValidated(data)) {
        return t('admin.dashboard.step_pool_draw_subtitle_validated', '{count} poules, tirage validé et définitif', { count: poolDrawCount(data) })
      }
      return data.draws.some(item => item.kind === DRAW_KIND.POOLS)
        ? t('admin.dashboard.step_pool_draw_subtitle_draft', '{count} poules · brouillon', { count: poolDrawCount(data) })
        : t('admin.dashboard.step_pool_draw_subtitle_none', 'Poules à tirer')
    }
    case ADMIN_DASHBOARD_STEP.POOL_MATCHES:
      return t('admin.dashboard.step_pool_matches_subtitle', '{validated} / {total} validés · {recorded} saisis · {scheduled} sans score', {
        validated: counters.poolValidatedCount,
        total: counters.poolMatchCount,
        recorded: counters.recordedCount,
        scheduled: counters.scheduledCount
      })
    default: {
      const text = ADMIN_DASHBOARD_STATIC_SUBTITLES[step]
      return text ? t(text.key, text.fallback) : ''
    }
  }
}

/** Texte du statut d'une étape : il dit « Fait », « En cours » ou « À venir » en toutes lettres, la couleur n'est jamais seule. */
export const stepStatusText = (status: ADMIN_DASHBOARD_STEP_STATUS, t: TTranslate): string => {
  const text = ADMIN_DASHBOARD_STATUS_TEXTS[status]
  return t(text.key, text.fallback)
}

/**
 * Le sous-titre d'`origam-stepper-item` porte le statut en texte, suivi du détail de l'étape quand il existe
 * (« En cours · 68 / 105 validés… »). `origam-stepper-item` n'a ni slot ni pastille : le statut passe par le sous-titre.
 * Une pastille à droite de l'étape (maquette) reviendra avec le slot demandé dans Origam #1338.
 */
export const buildStepItems = (data: IAdminDashboardData, counters: IAdminDashboardCounters, active: ADMIN_DASHBOARD_STEP | null, t: TTranslate): IAdminDashboardStepItem[] =>
  ADMIN_DASHBOARD_STEPS.map((definition) => {
    const status = resolveStepStatus(definition.step, active)
    const label = stepStatusText(status, t)
    const detail = stepSubtitle(definition.step, data, counters, t)
    return {
      title: t(definition.title.key, definition.title.fallback),
      subtitle: detail ? t('admin.dashboard.step_subtitle', '{status} · {detail}', { status: label, detail }) : label,
      status
    }
  })

/*********************************************************
 * À traiter
 *
 * @description
 * Trois cartes : scores saisis à valider (RECORDED), matchs de poule sans score (SCHEDULED), tirage en attente (brouillon).
 * Les deux premières mènent à la file des matchs ; la carte « saisis » porte le filtre « Saisis » de F-08 (`recordedQueueLink`).
 * La carte du tirage ne devient un lien que s'il y a un brouillon à traiter.
 ********************************************************/
const drawsSubtitle = (status: EDITION_STATUS, t: TTranslate): string => {
  switch (status) {
    case EDITION_STATUS.CREATED:
    case EDITION_STATUS.REGISTRATION:
      return t('admin.dashboard.todo_draws_subtitle_before_pools', 'Tirage des poules : après l’inscription des participants')
    case EDITION_STATUS.POOLS_DRAWN:
    case EDITION_STATUS.POOLS_PLAYING:
      return t('admin.dashboard.todo_draws_subtitle_after_pools', 'Huitièmes : après la dernière validation de poule')
    case EDITION_STATUS.QUALIFIED:
    case EDITION_STATUS.PLAYOFFS:
      return t('admin.dashboard.todo_draws_subtitle_next_round', 'Tour suivant : après la dernière validation du tour en cours')
    default:
      return t('admin.dashboard.todo_draws_subtitle_closed', 'Édition clôturée : plus aucun tirage')
  }
}

/** Lien vers la file « Saisis » de F-08 : le nom du paramètre et la valeur viennent de F-08, jamais écrits ici. */
export const recordedQueueLink = (): string => `${ROUTES.ADMIN_MATCHES}?${ADMIN_MATCH_FILTER_QUERY_PARAM}=${ADMIN_MATCH_FILTER.RECORDED}`

export const buildTodoItems = (counters: IAdminDashboardCounters, status: EDITION_STATUS, t: TTranslate): IAdminDashboardTodoItem[] => [
  {
    id: ADMIN_DASHBOARD_TODO.RECORDED,
    count: counters.recordedCount,
    title: t('admin.dashboard.todo_recorded_title', 'scores saisis à valider'),
    subtitle: t('admin.dashboard.todo_recorded_subtitle', 'La validation met à jour le classement de poule'),
    to: recordedQueueLink(),
    hot: counters.recordedCount > 0
  },
  {
    id: ADMIN_DASHBOARD_TODO.SCHEDULED,
    count: counters.scheduledCount,
    title: t('admin.dashboard.todo_scheduled_title', 'matchs de poule sans score'),
    subtitle: t('admin.dashboard.todo_scheduled_subtitle', 'Saisie depuis le téléphone'),
    to: ROUTES.ADMIN_MATCHES,
    hot: false
  },
  {
    id: ADMIN_DASHBOARD_TODO.DRAWS,
    count: counters.pendingDrawCount,
    title: t('admin.dashboard.todo_draws_title', 'tirage en attente'),
    subtitle: drawsSubtitle(status, t),
    to: counters.pendingDrawCount > 0 ? ROUTES.ADMIN_DRAWS : null,
    hot: false
  }
]

/*********************************************************
 * Vue du tableau de bord
 *
 * @description
 * Assemble étape active, compteurs, étapes et cartes en une vue déjà traduite. Une édition clôturée est en lecture seule :
 * le bouton « Valider les scores saisis » n'est actif que s'il y a au moins un score saisi.
 ********************************************************/
export const buildDashboardView = (data: IAdminDashboardData, t: TTranslate): IAdminDashboardView => {
  const counters = computeCounters(data)
  const activeStep = resolveActiveStep(data.edition.status, data.edition.rounds)
  const readOnly = data.edition.status === EDITION_STATUS.CLOSED
  return {
    year: data.edition.year,
    readOnly,
    activeStep,
    recordedCount: counters.recordedCount,
    canValidate: !readOnly && counters.recordedCount > 0,
    steps: buildStepItems(data, counters, activeStep, t),
    todo: buildTodoItems(counters, data.edition.status, t),
    progress: activeStep === null
      ? t('admin.dashboard.progress_closed', 'Édition clôturée')
      : t('admin.dashboard.progress', 'Étape {step} sur {total}', { step: activeStep, total: ADMIN_DASHBOARD_STEP_COUNT })
  }
}

/*********************************************************
 * Activité récente (A17)
 *
 * @description
 * Chaque évènement du flux est composé avec `t()` : il n'y a pas de libellé serveur. Un match se lit « {a} {sa}–{sb} {b} » avec son
 * contexte (« Poule {n} », ou le tour hors poules) ; un tirage se lit « Tirage des poules · {pools} poules, {seeds} têtes de série »
 * avec son auteur. Le serveur trie déjà par date décroissante (contrat B-15) ; le tri est refait ici par prudence. Le vainqueur n'est
 * jamais déduit de l'ordre des joueurs.
 ********************************************************/
const matchRow = (item: IAdminActivityItem, target: IAdminActivityMatchTarget, t: TTranslate): IAdminActivityRow => {
  const [home, away] = target.sides
  const round = ROUND_LABELS[target.roundKind]
  return {
    id: `${item.kind}:${target.id}:${item.at}`,
    kind: item.kind,
    head: home.displayName,
    score: t('admin.dashboard.activity_score', '{home}–{away}', { home: home.score ?? 0, away: away.score ?? 0 }),
    tail: away.displayName,
    context: target.poolNumber !== null && target.roundKind === ROUND_KIND.POOLS
      ? t('admin.dashboard.activity_pool', 'Poule {number}', { number: target.poolNumber })
      : t(round.match.key, round.match.label)
  }
}

const drawRow = (item: IAdminActivityItem, target: IAdminActivityDrawTarget, t: TTranslate): IAdminActivityRow => {
  const round = target.roundKind ? ROUND_LABELS[target.roundKind] : null
  const isPoolDraw = target.drawKind === DRAW_KIND.POOLS || round === null
  return {
    id: `${item.kind}:${target.id}:${item.at}`,
    kind: item.kind,
    head: isPoolDraw
      ? t('admin.dashboard.activity_draw_pools', 'Tirage des poules · {pools} poules, {seeds} têtes de série', { pools: target.poolCount ?? 0, seeds: target.seedCount ?? 0 })
      : t('admin.dashboard.activity_draw_round', 'Tirage : {round}', { round: t(round.key, round.label) }),
    score: null,
    tail: null,
    context: item.actor?.displayName ?? null
  }
}

export const buildActivityRows = (items: IAdminActivityItem[], limit: number, t: TTranslate): IAdminActivityRow[] =>
  [...items]
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
    .slice(0, limit)
    .map(item => item.target.type === ADMIN_ACTIVITY_TARGET.MATCH ? matchRow(item, item.target, t) : drawRow(item, item.target, t))

/*********************************************************
 * Erreurs
 *
 * @description
 * 401 session expirée, 403 permission refusée, 404 édition inexistante ; le reste passe par `AsyncState`.
 ********************************************************/
export const classifyError = (error: IApiError | null): ADMIN_DASHBOARD_ERROR | null => {
  if (!error) {
    return null
  }
  if (error.statusCode === HTTP_STATUS_UNAUTHORIZED || error.code === API_ERROR_CODE.UNAUTHORIZED) {
    return ADMIN_DASHBOARD_ERROR.SESSION_EXPIRED
  }
  if (error.statusCode === HTTP_STATUS_FORBIDDEN || error.code === API_ERROR_CODE.FORBIDDEN) {
    return ADMIN_DASHBOARD_ERROR.FORBIDDEN
  }
  if (error.statusCode === HTTP_STATUS_NOT_FOUND || error.code === API_ERROR_CODE.NOT_FOUND) {
    return ADMIN_DASHBOARD_ERROR.NOT_FOUND
  }
  return ADMIN_DASHBOARD_ERROR.OTHER
}

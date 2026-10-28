import { DRAW_STATUS } from '../enums/draw.enum.js'
import { MATCH_STATUS } from '../enums/match.enum.js'
import { ROUND_KIND } from '../enums/round.enum.js'
import { EDITION_CHIP_FAMILY, EDITION_MATCH_FILTER, EDITION_STEP_STATE, EDITION_TAB } from '../enums/edition-tab.enum.js'
import { EDITION_STATUS } from '../enums/edition.enum.js'
import { FINAL_STAGE, PARTICIPATION_STATUS } from '../enums/participation.enum.js'
import type { ITranslatableText } from '../interfaces/common-components.interface.js'

export const EDITION_DEFAULT_TAB = EDITION_TAB.SUMMARY
export const EDITION_TAB_QUERY = 'onglet'
export const EDITION_TAB_VALUES: string[] = Object.values(EDITION_TAB)

export const EDITION_TABS: Array<{ value: EDITION_TAB, label: ITranslatableText, dataCy: string }> = [
  { value: EDITION_TAB.SUMMARY, label: { key: 'edition.tab_summary', fallback: 'Synthèse' }, dataCy: 'edition-tab-summary' },
  { value: EDITION_TAB.PARTICIPANTS, label: { key: 'edition.tab_participants', fallback: 'Participants' }, dataCy: 'edition-tab-participants' },
  { value: EDITION_TAB.DRAWS, label: { key: 'edition.tab_draws', fallback: 'Tirages' }, dataCy: 'edition-tab-draws' },
  { value: EDITION_TAB.POOLS, label: { key: 'edition.tab_pools', fallback: 'Poules' }, dataCy: 'edition-tab-pools' },
  { value: EDITION_TAB.BRACKET, label: { key: 'edition.tab_bracket', fallback: 'Bracket' }, dataCy: 'edition-tab-bracket' },
  { value: EDITION_TAB.MATCHES, label: { key: 'edition.tab_matches', fallback: 'Matchs' }, dataCy: 'edition-tab-matches' }
]

/** Sous cette largeur, les tableaux passent en lecture mobile sans perte d'information (même réglage que le face-à-face). */
export const EDITION_TABLE_BREAKPOINT = 1

/** Statut de l'édition dans l'en-tête : libellé court et famille de pastille (recette des chips, mapping.md F-13). */
export const EDITION_HERO_STATUS: Record<EDITION_STATUS, { label: ITranslatableText, family: EDITION_CHIP_FAMILY }> = {
  [EDITION_STATUS.CREATED]: { label: { key: 'edition.hero_status_created', fallback: 'Créée' }, family: EDITION_CHIP_FAMILY.NEUTRAL },
  [EDITION_STATUS.REGISTRATION]: { label: { key: 'edition.hero_status_registration', fallback: 'Inscriptions' }, family: EDITION_CHIP_FAMILY.TINTED_INFO },
  [EDITION_STATUS.POOLS_DRAWN]: { label: { key: 'edition.hero_status_pools_drawn', fallback: 'Poules tirées' }, family: EDITION_CHIP_FAMILY.TINTED_INFO },
  [EDITION_STATUS.POOLS_PLAYING]: { label: { key: 'edition.hero_status_pools_playing', fallback: 'Phase de poules' }, family: EDITION_CHIP_FAMILY.FULL_SECONDARY },
  [EDITION_STATUS.QUALIFIED]: { label: { key: 'edition.hero_status_qualified', fallback: 'Qualifiés validés' }, family: EDITION_CHIP_FAMILY.FULL_SECONDARY },
  [EDITION_STATUS.PLAYOFFS]: { label: { key: 'edition.hero_status_playoffs', fallback: 'Phase finale' }, family: EDITION_CHIP_FAMILY.FULL_SECONDARY },
  [EDITION_STATUS.CLOSED]: { label: { key: 'edition.hero_status_closed', fallback: 'Clôturée' }, family: EDITION_CHIP_FAMILY.TINTED_SUCCESS }
}

/** Le Déroulé : 9 étapes de la Spec fonctionnelle. `doneCount` étapes sont faites, la suivante est en cours. */
export const EDITION_STEPS: Array<{ id: string, label: ITranslatableText }> = [
  { id: 'creation', label: { key: 'edition.step_creation', fallback: 'Création' } },
  { id: 'participants', label: { key: 'edition.step_participants', fallback: 'Participants' } },
  { id: 'pools_draw', label: { key: 'edition.step_pools_draw', fallback: 'Tirage des poules' } },
  { id: 'pools_matches', label: { key: 'edition.step_pools_matches', fallback: 'Matchs de poules' } },
  { id: 'qualified', label: { key: 'edition.step_qualified', fallback: 'Validation des qualifiés' } },
  { id: 'bracket_draw', label: { key: 'edition.step_bracket_draw', fallback: 'Tirage du bracket' } },
  { id: 'bracket_matches', label: { key: 'edition.step_bracket_matches', fallback: 'Matchs du bracket' } },
  { id: 'final', label: { key: 'edition.step_final', fallback: 'Finale' } },
  { id: 'closing', label: { key: 'edition.step_closing', fallback: 'Clôture' } }
]

export const EDITION_STEPS_DONE: Record<EDITION_STATUS, number> = {
  [EDITION_STATUS.CREATED]: 1,
  [EDITION_STATUS.REGISTRATION]: 1,
  [EDITION_STATUS.POOLS_DRAWN]: 3,
  [EDITION_STATUS.POOLS_PLAYING]: 3,
  [EDITION_STATUS.QUALIFIED]: 5,
  [EDITION_STATUS.PLAYOFFS]: 6,
  [EDITION_STATUS.CLOSED]: EDITION_STEPS.length
}

export const EDITION_STEP_STATE_LABELS = {
  done: { key: 'edition.step_state_done', fallback: 'Fait' },
  active: { key: 'edition.step_state_active', fallback: 'En cours' },
  pending: { key: 'edition.step_state_pending', fallback: 'À venir' }
} as const

/** Résultat d'un participant : tour atteint (`finalStage`), sinon son statut tant que l'édition n'est pas close. */
export const EDITION_FINAL_STAGE_LABELS: Record<FINAL_STAGE, ITranslatableText> = {
  [FINAL_STAGE.POOL_ELIMINATED]: { key: 'edition.result_pool_eliminated', fallback: 'Éliminé·e en poule' },
  [FINAL_STAGE.PLAYOFF]: { key: 'edition.result_playoff', fallback: 'Barrage' },
  [FINAL_STAGE.ROUND_OF_16]: { key: 'edition.result_round_of_16', fallback: 'Huitième de finale' },
  [FINAL_STAGE.QUARTER]: { key: 'edition.result_quarter', fallback: 'Quart de finale' },
  [FINAL_STAGE.SEMI]: { key: 'edition.result_semi', fallback: 'Demi-finale' },
  [FINAL_STAGE.FINALIST]: { key: 'edition.result_finalist', fallback: 'Finaliste' },
  [FINAL_STAGE.CHAMPION]: { key: 'edition.result_champion', fallback: 'Champion·ne' }
}

export const EDITION_PARTICIPATION_STATUS_LABELS: Record<PARTICIPATION_STATUS, ITranslatableText> = {
  [PARTICIPATION_STATUS.REGISTERED]: { key: 'edition.status_registered', fallback: 'Inscrit·e' },
  [PARTICIPATION_STATUS.IN_POOL]: { key: 'edition.status_in_pool', fallback: 'En poule' },
  [PARTICIPATION_STATUS.QUALIFIED]: { key: 'edition.status_qualified', fallback: 'Qualifié·e' },
  [PARTICIPATION_STATUS.ELIMINATED]: { key: 'edition.status_eliminated', fallback: 'Éliminé·e' },
  [PARTICIPATION_STATUS.WINNER]: { key: 'edition.status_winner', fallback: 'Vainqueur' }
}

/** Suffixes d'ordre des éditions d'une même année (2012a, 2012b) dans le sélecteur. */
export const EDITION_SUFFIX_ORDINALS: Array<ITranslatableText> = [
  { key: 'edition.selector_ordinal_1', fallback: '1re' },
  { key: 'edition.selector_ordinal_2', fallback: '2e' }
]
export const EDITION_SUFFIX_ORDINAL_FALLBACK: ITranslatableText = { key: 'edition.selector_ordinal_n', fallback: '{n}e' }

/** Props `origam-chip` de chaque famille (recette des chips, mapping.md) : neutre = défaut du thème. */
export const EDITION_CHIP_PROPS: Record<EDITION_CHIP_FAMILY, { color?: string, bgColor?: string }> = {
  [EDITION_CHIP_FAMILY.NEUTRAL]: {},
  [EDITION_CHIP_FAMILY.TINTED_SUCCESS]: { color: 'success', bgColor: 'var(--origam-color__feedback--success---bgSubtle)' },
  [EDITION_CHIP_FAMILY.TINTED_INFO]: { color: 'info', bgColor: 'var(--origam-color__feedback--info---bgSubtle)' },
  [EDITION_CHIP_FAMILY.FULL_SECONDARY]: { color: 'secondary', bgColor: 'secondary' }
}

export const EDITION_STEP_FAMILIES: Record<EDITION_STEP_STATE, EDITION_CHIP_FAMILY> = {
  [EDITION_STEP_STATE.DONE]: EDITION_CHIP_FAMILY.TINTED_SUCCESS,
  [EDITION_STEP_STATE.ACTIVE]: EDITION_CHIP_FAMILY.FULL_SECONDARY,
  [EDITION_STEP_STATE.PENDING]: EDITION_CHIP_FAMILY.NEUTRAL
}

/** Statut d'un tirage : famille de pastille, libellé du tirage des poules (« définitif ») et d'un tirage de tour. */
export const EDITION_DRAW_STATUS_VIEW: Record<DRAW_STATUS, { family: EDITION_CHIP_FAMILY, pools: ITranslatableText, round: ITranslatableText }> = {
  [DRAW_STATUS.VALIDATED]: {
    family: EDITION_CHIP_FAMILY.TINTED_SUCCESS,
    pools: { key: 'edition.draws_status_pools_validated', fallback: 'Validé · définitif' },
    round: { key: 'edition.draws_status_validated', fallback: 'Validé' }
  },
  [DRAW_STATUS.DRAFT]: {
    family: EDITION_CHIP_FAMILY.NEUTRAL,
    pools: { key: 'edition.draws_status_draft', fallback: 'Brouillon' },
    round: { key: 'edition.draws_status_draft', fallback: 'Brouillon' }
  }
}

/** Tours du tableau, dans l'ordre de la phase finale. Le tour des poules n'en fait pas partie. */
export const EDITION_BRACKET_ROUND_ORDER: ROUND_KIND[] = [ROUND_KIND.PLAYOFF, ROUND_KIND.ROUND_OF_16, ROUND_KIND.QUARTER, ROUND_KIND.SEMI, ROUND_KIND.FINAL]

export const EDITION_MATCHES_PAGE_SIZE = 16
export const EDITION_MATCHES_PAGINATION_VISIBLE = 4

export const EDITION_MATCH_FILTERS: Array<{ value: EDITION_MATCH_FILTER, label: ITranslatableText, dataCy: string }> = [
  { value: EDITION_MATCH_FILTER.ALL, label: { key: 'edition.matches_filter_all', fallback: 'Tous' }, dataCy: 'edition-matches-filter-all' },
  { value: EDITION_MATCH_FILTER.POOLS, label: { key: 'edition.matches_filter_pools', fallback: 'Poules' }, dataCy: 'edition-matches-filter-pools' },
  { value: EDITION_MATCH_FILTER.KNOCKOUT, label: { key: 'edition.matches_filter_knockout', fallback: 'Phase finale' }, dataCy: 'edition-matches-filter-knockout' }
]

/** Statut d'un match public : pastille. Un score saisi mais non validé compte comme « à jouer » (jamais public). */
export const EDITION_MATCH_STATUS_VIEW: Record<MATCH_STATUS, { label: ITranslatableText, family: EDITION_CHIP_FAMILY }> = {
  [MATCH_STATUS.VALIDATED]: { label: { key: 'edition.match_status_validated', fallback: 'Validé' }, family: EDITION_CHIP_FAMILY.TINTED_SUCCESS },
  [MATCH_STATUS.RESULT_UNKNOWN]: { label: { key: 'edition.match_status_unknown', fallback: 'Résultat inconnu' }, family: EDITION_CHIP_FAMILY.TINTED_INFO },
  [MATCH_STATUS.SCHEDULED]: { label: { key: 'edition.match_status_scheduled', fallback: 'À jouer' }, family: EDITION_CHIP_FAMILY.NEUTRAL },
  [MATCH_STATUS.RECORDED]: { label: { key: 'edition.match_status_scheduled', fallback: 'À jouer' }, family: EDITION_CHIP_FAMILY.NEUTRAL }
}

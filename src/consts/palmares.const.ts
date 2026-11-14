import { RANKING_KIND } from '../enums/ranking-kind.enum.js'
import { PALMARES_COLUMN, PALMARES_TAB } from '../enums/palmares.enum.js'
import type { ITranslatableText } from '../interfaces/common-components.interface.js'

export const PALMARES_DEFAULT_TAB = PALMARES_TAB.ACP
export const PALMARES_TAB_QUERY = 'onglet'
export const PALMARES_TAB_VALUES: string[] = Object.values(PALMARES_TAB)

export const PALMARES_TABS: Array<{ value: PALMARES_TAB, label: ITranslatableText, dataCy: string }> = [
  { value: PALMARES_TAB.ACP, label: { key: 'palmares.tab_acp', fallback: 'ACP' }, dataCy: 'palmares-tab-acp' },
  { value: PALMARES_TAB.ALL_TIME, label: { key: 'palmares.tab_all_time', fallback: 'All Time' }, dataCy: 'palmares-tab-all-time' },
  { value: PALMARES_TAB.EVOLUTION, label: { key: 'palmares.tab_evolution', fallback: 'Évolution' }, dataCy: 'palmares-tab-evolution' }
]

/** Les quatre premiers du classement actuel sont tracés (maquette, RG8) ; les autres restent dans le classement. */
export const PALMARES_EVOLUTION_TOP = 4

/** Couleur de chaque courbe : tokens du thème (la couleur ne porte jamais seule l'information, la légende nomme chaque joueur). */
export const PALMARES_SERIES_COLORS: string[] = [
  'var(--origam-color__bar---amber)',
  'var(--origam-color__action--secondary---fgSubtle)',
  'var(--origam-color__bar---ice)',
  'var(--origam-color__bar---foam)'
]

/** Sous cette largeur, les tableaux passent en lecture mobile sans perte d'information (même réglage que le face-à-face). */
export const PALMARES_TABLE_BREAKPOINT = 1

export const PALMARES_POINTS_DIGITS = 2

const RANK_TITLE: ITranslatableText = { key: 'palmares.col_rank', fallback: 'Rang' }
const PLAYER_TITLE: ITranslatableText = { key: 'palmares.col_player', fallback: 'Joueur · titres' }
const PARTICIPATIONS_TITLE: ITranslatableText = { key: 'palmares.col_participations', fallback: 'Participations' }
const AVERAGE_TITLE: ITranslatableText = { key: 'palmares.col_average', fallback: 'Moyenne' }

/** Colonnes des deux classements : seules les deux colonnes de points changent de sens (le classement affiché, puis l'autre). */
export const PALMARES_COLUMNS: Array<{ key: PALMARES_COLUMN, align: 'start' | 'end', sortable: boolean, titles: Record<RANKING_KIND, ITranslatableText> }> = [
  { key: PALMARES_COLUMN.RANK, align: 'start', sortable: true, titles: { [RANKING_KIND.ACP]: RANK_TITLE, [RANKING_KIND.ALL_TIME]: RANK_TITLE } },
  { key: PALMARES_COLUMN.PLAYER, align: 'start', sortable: false, titles: { [RANKING_KIND.ACP]: PLAYER_TITLE, [RANKING_KIND.ALL_TIME]: PLAYER_TITLE } },
  { key: PALMARES_COLUMN.POINTS, align: 'end', sortable: true, titles: { [RANKING_KIND.ACP]: { key: 'palmares.col_points_acp', fallback: 'Points ACP' }, [RANKING_KIND.ALL_TIME]: { key: 'palmares.col_points_all_time', fallback: 'Points All Time' } } },
  { key: PALMARES_COLUMN.OTHER_POINTS, align: 'end', sortable: true, titles: { [RANKING_KIND.ACP]: { key: 'palmares.col_other_all_time', fallback: 'All Time' }, [RANKING_KIND.ALL_TIME]: { key: 'palmares.col_other_acp', fallback: 'ACP' } } },
  { key: PALMARES_COLUMN.PARTICIPATIONS, align: 'end', sortable: true, titles: { [RANKING_KIND.ACP]: PARTICIPATIONS_TITLE, [RANKING_KIND.ALL_TIME]: PARTICIPATIONS_TITLE } },
  { key: PALMARES_COLUMN.AVERAGE, align: 'end', sortable: true, titles: { [RANKING_KIND.ACP]: AVERAGE_TITLE, [RANKING_KIND.ALL_TIME]: AVERAGE_TITLE } }
]

/** Taille du nombre de titres dans la capsule du plus titré (unités du viewBox de la capsule). */
export const PALMARES_CAP_TEXT_SIZE = 34

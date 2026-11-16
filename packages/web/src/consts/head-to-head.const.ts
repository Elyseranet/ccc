import { HEAD_TO_HEAD_FIELD_ERROR } from '../enums/head-to-head.enum.js'

export const HEAD_TO_HEAD_QUERY_A = 'a'

export const HEAD_TO_HEAD_QUERY_B = 'b'

export const HEAD_TO_HEAD_SEARCH_MIN_LENGTH = 2

export const HEAD_TO_HEAD_SEARCH_PAGE_SIZE = 20

export const HEAD_TO_HEAD_SEARCH_DEBOUNCE_MS = 250

export const HEAD_TO_HEAD_SWAP_GLYPH = '⇄'

export const HEAD_TO_HEAD_SCORE_SEPARATOR = '–'

export const HEAD_TO_HEAD_TABLE_BREAKPOINT = 1

export const HEAD_TO_HEAD_BAR_THICKNESS = 12

export const HEAD_TO_HEAD_BAR_TRACK_COLOR = 'var(--origam-color__action--secondary---bg)'

export const HEAD_TO_HEAD_EMPTY_GLYPH = '—'

export const HEAD_TO_HEAD_PERCENT = 100

export const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const HEAD_TO_HEAD_FIELD_ERROR_TEXTS: Record<Exclude<HEAD_TO_HEAD_FIELD_ERROR, HEAD_TO_HEAD_FIELD_ERROR.NONE>, { key: string, label: string }> = {
  [HEAD_TO_HEAD_FIELD_ERROR.SAME_PLAYER]: { key: 'head_to_head.picker.error_same_player', label: 'Choisissez deux joueurs différents.' },
  [HEAD_TO_HEAD_FIELD_ERROR.INVALID_ID]: { key: 'head_to_head.picker.error_invalid_id', label: 'Cet identifiant de joueur n’est pas valide.' },
  [HEAD_TO_HEAD_FIELD_ERROR.UNKNOWN_PLAYER]: { key: 'head_to_head.picker.error_unknown_player', label: 'Aucun joueur ne correspond à cet identifiant.' }
}

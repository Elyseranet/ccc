import { EDITION_STATUS } from '../enums/edition.enum.js'

export const EDITION_STATUS_LABELS: Record<EDITION_STATUS, { key: string, label: string }> = {
  [EDITION_STATUS.CREATED]: { key: 'edition.status.created', label: 'création' },
  [EDITION_STATUS.REGISTRATION]: { key: 'edition.status.registration', label: 'inscriptions' },
  [EDITION_STATUS.POOLS_DRAWN]: { key: 'edition.status.pools_drawn', label: 'poules tirées' },
  [EDITION_STATUS.POOLS_PLAYING]: { key: 'edition.status.pools_playing', label: 'phase de poules' },
  [EDITION_STATUS.QUALIFIED]: { key: 'edition.status.qualified', label: 'qualifiés validés' },
  [EDITION_STATUS.PLAYOFFS]: { key: 'edition.status.playoffs', label: 'phase finale' },
  [EDITION_STATUS.CLOSED]: { key: 'edition.status.closed', label: 'archive (lecture seule)' }
}

export const ADMIN_EDITION_COOKIE = 'ccc_admin_edition'

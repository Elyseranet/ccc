import { ADMIN_DATE_LOCALE } from '../consts/admin-editions.const.js'
import { POINTS_BASE_SCALE } from '../consts/domain-rules.const.js'
import { CLOSING_STAGES_DESC } from '../consts/edition-closing-view.const.js'
import { CLOSING_STATE } from '../enums/edition-closing-view.enum.js'
import { EDITION_STATUS } from '../enums/edition.enum.js'
import { MATCH_PURPOSE, MATCH_STATUS } from '../enums/match.enum.js'
import { ROUND_KIND } from '../enums/round.enum.js'
import type { IClosingPerson, IClosingPrerequisite, IClosingPreviewRow, IEditionClosingView } from '../interfaces/edition-closing-view.interface.js'
import type { IClosingPreview } from '../interfaces/edition-closing.interface.js'
import type { IEditionDetail } from '../interfaces/edition.interface.js'
import type { IMatch } from '../interfaces/match.interface.js'

/** Le match de finale (le seul match régulier du tour `FINAL`) ; `null` tant qu'il n'est pas créé. */
const finalMatchOf = (matches: IMatch[]): IMatch | null =>
  matches.find(match => match.roundKind === ROUND_KIND.FINAL && match.purpose === MATCH_PURPOSE.REGULAR) ?? null

const personOf = (match: IMatch, winner: boolean): IClosingPerson | null => {
  const side = match.sides.find(entry => (entry.participationId === match.winnerParticipationId) === winner)
  return side ? { id: side.competitorId, displayName: side.displayName } : null
}

/** Champion·ne et finaliste, lus sur le match de finale validé (rien tant qu'il n'a pas de vainqueur). */
export const finalistsOf = (matches: IMatch[]): { champion: IClosingPerson | null, finalist: IClosingPerson | null } => {
  const final = finalMatchOf(matches)
  if (!final || final.winnerParticipationId === null) {
    return { champion: null, finalist: null }
  }
  return { champion: personOf(final, true), finalist: personOf(final, false) }
}

/** Les deux conditions de la maquette : la finale est validée (ce que le serveur exige), et tous les matchs publiés le sont. */
export const prerequisitesOf = (detail: Pick<IEditionDetail, 'matches'>, preview: IClosingPreview): IClosingPrerequisite[] => [
  { id: 'final', label: { key: 'admin.closing.prerequisite_final', fallback: 'Finale validée' }, met: preview.blockedBy === null },
  {
    id: 'matches',
    label: { key: 'admin.closing.prerequisite_matches', fallback: 'Tous les matchs de l’édition validés' },
    met: detail.matches.every(match => match.status === MATCH_STATUS.VALIDATED)
  }
]

/** Une ligne par résultat présent dans l'aperçu, du plus haut au plus bas ; les points sont ceux que la fonction de clôture donnera. */
export const previewRowsOf = (preview: IClosingPreview): IClosingPreviewRow[] =>
  CLOSING_STAGES_DESC.flatMap((stage) => {
    const result = preview.results.find(entry => entry.finalStage === stage)
    return result ? [{ stage, base: POINTS_BASE_SCALE[stage], points: result.points }] : []
  })

export const closingStateOf = (status: EDITION_STATUS, preview: IClosingPreview): CLOSING_STATE => {
  if (status === EDITION_STATUS.CLOSED) {
    return CLOSING_STATE.CLOSED
  }
  return preview.blockedBy === null ? CLOSING_STATE.READY : CLOSING_STATE.BLOCKED
}

export const buildClosingView = (detail: IEditionDetail, preview: IClosingPreview): IEditionClosingView => ({
  state: closingStateOf(detail.status, preview),
  participantCount: preview.participantCount,
  prerequisites: prerequisitesOf(detail, preview),
  ...finalistsOf(detail.matches),
  rows: previewRowsOf(preview)
})

/** La confirmation est valide quand le code saisi est celui de l'édition (espaces autour ignorés, casse respectée). */
export const isClosingCodeConfirmed = (typed: string, code: string): boolean => typed.trim() === code

/** « 16/06 » et « 00:20 » : le jour et l'heure de clôture, dans la langue de l'admin (maquette `admin-cloture`). */
export const formatClosingMoment = (iso: string): { date: string, time: string } => {
  const moment = new Date(iso)
  return {
    date: moment.toLocaleDateString(ADMIN_DATE_LOCALE, { day: '2-digit', month: '2-digit' }),
    time: moment.toLocaleTimeString(ADMIN_DATE_LOCALE, { hour: '2-digit', minute: '2-digit' })
  }
}

import type { ICompetitorPublic } from '../interfaces/competitor.interface.js'
import type { IHeadToHeadMatch } from '../interfaces/head-to-head.interface.js'
import { HEAD_TO_HEAD_PERCENT, UUID_PATTERN } from '../consts/head-to-head.const.js'
import type { IHeadToHeadLastMeeting, IHeadToHeadOption } from '../interfaces/head-to-head-page.interface.js'

/*********************************************************
 * Utilitaires du face-à-face
 *
 * @description
 * Fonctions pures : lecture de l'URL, validation d'un identifiant, options de sélection,
 * dernière rencontre, ratios et initiales. Aucune ne touche au réseau.
 ********************************************************/
export const readQueryId = (value: unknown): string | null => {
  const raw = Array.isArray(value) ? value[0] : value
  if (typeof raw !== 'string') {
    return null
  }
  const trimmed = raw.trim()
  return trimmed === '' ? null : trimmed
}

export const isUuid = (value: string | null): value is string => value !== null && UUID_PATTERN.test(value)

export const toOptions = (selected: Array<ICompetitorPublic | null | undefined>, listed: ICompetitorPublic[]): IHeadToHeadOption[] => {
  const seen = new Set<string>()
  const options: IHeadToHeadOption[] = []
  for (const competitor of [...selected, ...listed]) {
    if (competitor && !seen.has(competitor.id)) {
      seen.add(competitor.id)
      options.push({ title: competitor.displayName, value: competitor.id })
    }
  }
  return options
}

export const lastMeeting = (matches: IHeadToHeadMatch[]): IHeadToHeadLastMeeting | null => {
  const latest = matches.reduce<IHeadToHeadMatch | null>((best, match) => best === null || match.editionCode > best.editionCode ? match : best, null)
  return latest ? { editionCode: latest.editionCode, roundKind: latest.roundKind } : null
}

export const percentOf = (ratio: number): number => Math.round(ratio * HEAD_TO_HEAD_PERCENT)

export const careerRatio = (wins: number, played: number): number | null => played > 0 ? wins / played : null

export const firstNameOf = (competitor: ICompetitorPublic): string => competitor.firstName ?? competitor.displayName

export const initialsOf = (competitor: ICompetitorPublic): string => {
  const first = competitor.firstName?.[0]
  const last = competitor.lastName?.[0]
  const letters = first && last ? `${first}${last}` : competitor.displayName.slice(0, 2)
  return letters.toUpperCase()
}

export const signed = (value: number): string => value > 0 ? `+${value}` : String(value)

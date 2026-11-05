import { describe, expect, it } from 'vitest'
import { ADMIN_MATCH_DEFAULT_FILTER } from '../../src/consts/admin-match-filters.const'
import { ADMIN_MATCH_FILTER } from '../../src/enums/admin-match-filter.enum'
import { EDITION_CHIP_FAMILY } from '../../src/enums/edition-tab.enum'
import { MATCH_ACTION } from '../../src/enums/match-action.enum'
import { MATCH_STATUS } from '../../src/enums/match.enum'
import {
  countByFilter,
  initialScoreInputs,
  matchesFilter,
  parseAdminMatchFilter,
  parseAdminMatchPool,
  poolsOf,
  sortForQueue,
  toMatchCard
} from '../../src/utils/admin-match.util'
import { buildAdminMatch } from '../helpers/admin-match'

const queue = [
  buildAdminMatch({ id: 'a', sequence: 1, status: MATCH_STATUS.VALIDATED, poolRank: 1 }),
  buildAdminMatch({ id: 'b', sequence: 2, status: MATCH_STATUS.SCHEDULED, poolRank: 2 }),
  buildAdminMatch({ id: 'c', sequence: 3, status: MATCH_STATUS.RECORDED, poolRank: 2 }),
  buildAdminMatch({ id: 'd', sequence: 4, status: MATCH_STATUS.SCHEDULED, poolRank: 3 }),
  buildAdminMatch({ id: 'e', sequence: 5, status: MATCH_STATUS.RESULT_UNKNOWN, poolRank: 3 })
]

describe('file admin des matchs (F-08)', () => {
  it('le filtre « À traiter » est la somme de « Saisis » et « Sans score », « Validés » est à part', () => {
    const counts = countByFilter(queue)
    expect(counts[ADMIN_MATCH_FILTER.RECORDED]).toBe(1)
    expect(counts[ADMIN_MATCH_FILTER.UNSCORED]).toBe(2)
    expect(counts[ADMIN_MATCH_FILTER.TO_PROCESS]).toBe(counts[ADMIN_MATCH_FILTER.RECORDED] + counts[ADMIN_MATCH_FILTER.UNSCORED])
    expect(counts[ADMIN_MATCH_FILTER.VALIDATED]).toBe(1)
  })

  it('RESULT_UNKNOWN n’est dans aucun filtre', () => {
    const unknown = queue[4]!
    expect(Object.values(ADMIN_MATCH_FILTER).some(filter => matchesFilter(unknown, filter))).toBe(false)
  })

  it('le filtre de l’URL inconnu ou absent retombe sur « À traiter »', () => {
    expect(parseAdminMatchFilter('saisis')).toBe(ADMIN_MATCH_FILTER.RECORDED)
    expect(parseAdminMatchFilter(['valides', 'x'])).toBe(ADMIN_MATCH_FILTER.VALIDATED)
    expect(parseAdminMatchFilter('nimporte')).toBe(ADMIN_MATCH_DEFAULT_FILTER)
    expect(parseAdminMatchFilter(undefined)).toBe(ADMIN_MATCH_DEFAULT_FILTER)
  })

  it('la poule de l’URL est un entier positif, sinon toutes les poules', () => {
    expect(parseAdminMatchPool('3')).toBe(3)
    expect(parseAdminMatchPool('0')).toBeNull()
    expect(parseAdminMatchPool('-2')).toBeNull()
    expect(parseAdminMatchPool('2abc')).toBeNull()
    expect(parseAdminMatchPool(undefined)).toBeNull()
  })

  it('les poules sont dédoublonnées et croissantes', () => {
    expect(poolsOf(queue)).toEqual([1, 2, 3])
  })

  it('la file met les scores à valider d’abord, puis les matchs sans score, puis les validés', () => {
    expect(sortForQueue(queue).map(match => match.id)).toEqual(['c', 'b', 'd', 'a', 'e'])
  })

  it('une carte écrit le statut en toutes lettres et propose la bonne action', () => {
    const recorded = toMatchCard(queue[2]!, '2026', false)
    expect(recorded).toMatchObject({ number: '2026-3', action: MATCH_ACTION.VALIDATE, firstScore: 5, secondScore: 1, family: EDITION_CHIP_FAMILY.TINTED_WARNING })
    expect(recorded.statusLabel.fallback).toBe('Saisi · à valider')
    const scheduled = toMatchCard(queue[1]!, '2026', false)
    expect(scheduled).toMatchObject({ action: MATCH_ACTION.ENTER, firstScore: null, secondScore: null })
    expect(scheduled.statusLabel.fallback).toBe('Sans score')
  })

  it('un match validé n’a aucune action (lecture seule), et son score est le score validé', () => {
    const validated = toMatchCard(queue[0]!, '2026', false)
    expect(validated.action).toBeNull()
    expect(validated).toMatchObject({ firstScore: 5, secondScore: 1 })
  })

  it('une édition archivée n’offre aucune action', () => {
    expect(queue.map(match => toMatchCard(match, '2012', true).action)).toEqual([null, null, null, null, null])
  })

  it('le formulaire repart du score déjà saisi, vide sinon', () => {
    expect(initialScoreInputs(queue[2]!)).toEqual(['5', '1'])
    expect(initialScoreInputs(queue[1]!)).toEqual(['', ''])
  })
})

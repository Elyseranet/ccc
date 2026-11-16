import { describe, expect, it } from 'vitest'
import { API_ERROR_CODE } from '../../src/enums/api-error-code.enum'
import { EDITION_YEAR_ISSUE } from '../../src/enums/admin-editions.enum'
import { EDITION_ORIGIN, EDITION_STATUS } from '../../src/enums/edition.enum'
import type { IEditionSummary } from '../../src/interfaces/edition.interface'
import { ApiRequestError } from '../../src/utils/api-request-error.util'
import {
  buildAdminEditionLink,
  checkEditionYear,
  emptyEditionFormValues,
  filterEditions,
  formatEditionDate,
  isEditionClosed,
  toCreateEditionRequest,
  toEditionFailure,
  toEditionFormValues,
  toIsoDate,
  toUpdateEditionRequest
} from '../../src/utils/admin-editions.util'

const summary = (overrides: Partial<IEditionSummary>): IEditionSummary => ({
  id: 'id',
  code: '2026',
  year: 2026,
  name: null,
  heldOn: null,
  location: null,
  status: EDITION_STATUS.POOLS_PLAYING,
  origin: EDITION_ORIGIN.APP,
  participantCount: null,
  unidentifiedParticipantCount: null,
  matchCount: 0,
  scoredMatchCount: 0,
  unknownResultMatchCount: 0,
  champion: null,
  final: null,
  semiFinalists: [],
  ...overrides
})

describe('règle de l’année (décision 87eea8e : champ texte, 4 chiffres, 2000 à 2100)', () => {
  it('accepte les bornes 2000 et 2100 et une année courante', () => {
    expect(checkEditionYear('2000')).toBeNull()
    expect(checkEditionYear('2027')).toBeNull()
    expect(checkEditionYear('2100')).toBeNull()
  })

  it('refuse le vide, les années courtes (« 27 » ne devient jamais 2000), les signes et les lettres', () => {
    expect(checkEditionYear('')).toBe(EDITION_YEAR_ISSUE.REQUIRED)
    expect(checkEditionYear('   ')).toBe(EDITION_YEAR_ISSUE.REQUIRED)
    expect(checkEditionYear(null)).toBe(EDITION_YEAR_ISSUE.REQUIRED)
    expect(checkEditionYear('27')).toBe(EDITION_YEAR_ISSUE.FORMAT)
    expect(checkEditionYear('20277')).toBe(EDITION_YEAR_ISSUE.FORMAT)
    expect(checkEditionYear('20a7')).toBe(EDITION_YEAR_ISSUE.FORMAT)
    expect(checkEditionYear('-202')).toBe(EDITION_YEAR_ISSUE.FORMAT)
  })

  it('refuse un année à 4 chiffres hors bornes', () => {
    expect(checkEditionYear('1999')).toBe(EDITION_YEAR_ISSUE.RANGE)
    expect(checkEditionYear('2101')).toBe(EDITION_YEAR_ISSUE.RANGE)
  })
})

describe('corps des requêtes', () => {
  it('création : l’année part en nombre, le code n’est jamais envoyé, les champs vides sont omis', () => {
    const body = toCreateEditionRequest({ year: ' 2027 ', name: '  Championnat de Caps 2027 ', heldOn: null, location: '  ', description: '' })
    expect(body).toEqual({ year: 2027, name: 'Championnat de Caps 2027' })
    expect(Object.keys(body)).not.toContain('code')
  })

  it('création : date, lieu et description renseignés sont transmis rognés', () => {
    expect(toCreateEditionRequest({ year: '2027', name: 'N', heldOn: '2027-06-12', location: ' Lyon ', description: ' Bar ' }))
      .toEqual({ year: 2027, name: 'N', heldOn: '2027-06-12', location: 'Lyon', description: 'Bar' })
  })

  it('modification : ni code, ni année, ni statut (R-9) ; un champ vidé part en null', () => {
    const body = toUpdateEditionRequest({ year: '2026', name: ' Nouveau nom ', heldOn: null, location: '', description: ' ' })
    expect(body).toEqual({ name: 'Nouveau nom', heldOn: null, location: null, description: null })
    expect(Object.keys(body)).not.toEqual(expect.arrayContaining(['year']))
  })

  it('modification : un nom vide n’est pas envoyé (le serveur le refuserait en 400)', () => {
    expect(toUpdateEditionRequest({ year: '2026', name: '  ', heldOn: '2026-05-01', location: 'x', description: 'y' }))
      .toEqual({ heldOn: '2026-05-01', location: 'x', description: 'y' })
  })

  it('les valeurs du formulaire reprennent l’édition, null devient une chaîne vide', () => {
    expect(toEditionFormValues(summary({ year: 2025, name: null, heldOn: null, location: null })))
      .toEqual({ year: '2025', name: '', heldOn: null, location: '', description: '' })
    expect(emptyEditionFormValues()).toEqual({ year: '', name: '', heldOn: null, location: '', description: '' })
  })
})

describe('dates', () => {
  it('ramène le sélecteur de date (Date locale ou texte ISO) à YYYY-MM-DD', () => {
    expect(toIsoDate(new Date(2027, 5, 12))).toBe('2027-06-12')
    expect(toIsoDate('2027-06-12')).toBe('2027-06-12')
    expect(toIsoDate('2027-06-12T10:00:00.000Z')).toBe('2027-06-12')
    expect(toIsoDate(null)).toBeNull()
    expect(toIsoDate('')).toBeNull()
    expect(toIsoDate(new Date('x'))).toBeNull()
  })

  it('affiche une date en français, jamais décalée par le fuseau', () => {
    expect(formatEditionDate('2027-06-12')).toBe('12 juin 2027')
    expect(formatEditionDate('2027-01-01')).toBe('1 janvier 2027')
    expect(formatEditionDate(null)).toBeNull()
  })
})

describe('liste', () => {
  const editions = [summary({ code: '2026', year: 2026 }), summary({ code: '2025b', year: 2025 }), summary({ code: '2025', year: 2025 })]

  it('recherche par code ou par année', () => {
    expect(filterEditions(editions, '2025b').map(edition => edition.code)).toEqual(['2025b'])
    expect(filterEditions(editions, '2025').map(edition => edition.code)).toEqual(['2025b', '2025'])
    expect(filterEditions(editions, ' ')).toHaveLength(3)
    expect(filterEditions(editions, 'zzz')).toEqual([])
  })

  it('une édition clôturée est en lecture seule', () => {
    expect(isEditionClosed(summary({ status: EDITION_STATUS.CLOSED }))).toBe(true)
    expect(isEditionClosed(summary({ status: EDITION_STATUS.REGISTRATION }))).toBe(false)
  })

  it('l’adresse d’une fiche est /admin/editions/<code>', () => {
    expect(buildAdminEditionLink('2025b')).toBe('/admin/editions/2025b')
  })
})

describe('erreurs de l’API traduites', () => {
  const failure = (statusCode: number, code: API_ERROR_CODE, isOffline = false) =>
    new ApiRequestError({ statusCode, code, message: 'x' }, isOffline)

  it('EDITION_CLOSED nomme l’édition', () => {
    const result = toEditionFailure(failure(409, API_ERROR_CODE.EDITION_CLOSED), '2025')
    expect(result.title.key).toBe('admin.editions.error_closed_title')
    expect(result.text.params).toEqual({ code: '2025' })
    expect(result.statusCode).toBe(409)
  })

  it('EDITION_CODE_EXHAUSTED, EDITION_CONFLICT et la validation 400 ont leur message', () => {
    expect(toEditionFailure(failure(409, API_ERROR_CODE.EDITION_CODE_EXHAUSTED)).title.key).toBe('admin.editions.error_code_exhausted_title')
    expect(toEditionFailure(failure(409, API_ERROR_CODE.EDITION_CONFLICT)).title.key).toBe('admin.editions.error_conflict_title')
    expect(toEditionFailure(failure(400, API_ERROR_CODE.VALIDATION_FAILED)).title.key).toBe('admin.editions.error_validation_title')
  })

  it('hors ligne, code inconnu et erreur non typée ont un message distinct', () => {
    expect(toEditionFailure(failure(0, API_ERROR_CODE.INTERNAL_ERROR, true)).title.key).toBe('admin.editions.error_offline_title')
    expect(toEditionFailure(failure(500, API_ERROR_CODE.INTERNAL_ERROR)).title.key).toBe('admin.editions.error_unknown_title')
    expect(toEditionFailure(new Error('boom')).title.key).toBe('admin.editions.error_unknown_title')
  })
})

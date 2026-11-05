import { describe, expect, it } from 'vitest'
import { API_ERROR_CODE } from '../../src/enums/api-error-code.enum'
import { COMPETITOR_SORT } from '../../src/enums/competitor-sort.enum'
import { ApiRequestError } from '../../src/utils/api-request-error.util'
import { toIfMatchHeaders } from '../../src/utils/if-match-header.util'
import {
  buildAdminCompetitorLink,
  buildAdminCompetitorsLocationQuery,
  isVersionConflict,
  toAdminCompetitorsQuery,
  toAdminPage,
  toAdminSearch,
  toCompetitorFailure,
  toCompetitorFormValues,
  toUpdateCompetitorRequest
} from '../../src/utils/admin-competitors.util'

describe('identité d’un compétiteur (corps du PATCH)', () => {
  it('rogne les quatre champs, et un champ vidé part en null pour l’effacer', () => {
    expect(toUpdateCompetitorRequest({ displayName: '  Lou Bernard ', firstName: ' Lou ', lastName: '', nickname: '   ' }))
      .toEqual({ displayName: 'Lou Bernard', firstName: 'Lou', lastName: null, nickname: null })
  })

  it('le corps ne porte ni version, ni téléphone, ni photo (la version part en en-tête)', () => {
    const body = toUpdateCompetitorRequest({ displayName: 'A', firstName: '', lastName: '', nickname: '' })
    expect(Object.keys(body).sort()).toEqual(['displayName', 'firstName', 'lastName', 'nickname'])
  })

  it('les valeurs du formulaire reprennent la fiche, null devient une chaîne vide', () => {
    expect(toCompetitorFormValues({ displayName: 'Lou Bernard', firstName: 'Lou', lastName: null, nickname: null }))
      .toEqual({ displayName: 'Lou Bernard', firstName: 'Lou', lastName: '', nickname: '' })
  })
})

describe('If-Match (T-SEC-10)', () => {
  it('l’en-tête est la version entre guillemets, nom en minuscules', () => {
    expect(toIfMatchHeaders(3)).toEqual({ 'if-match': '"3"' })
    expect(toIfMatchHeaders(0)).toEqual({ 'if-match': '"0"' })
  })
})

describe('annuaire : recherche et page dans l’URL', () => {
  it('la recherche n’est envoyée qu’à partir de deux caractères (le serveur refuse moins en 400)', () => {
    expect(toAdminCompetitorsQuery('a', 1)).toEqual({ page: 1, pageSize: 10, sort: COMPETITOR_SORT.DISPLAY_NAME })
    expect(toAdminCompetitorsQuery(' ab ', 2)).toEqual({ q: 'ab', page: 2, pageSize: 10, sort: COMPETITOR_SORT.DISPLAY_NAME })
  })

  it('une recherche trop longue est tronquée à 50 caractères', () => {
    expect(toAdminCompetitorsQuery('x'.repeat(80), 1).q).toHaveLength(50)
  })

  it('page invalide ou absente = 1 ; recherche en tableau = première valeur', () => {
    expect(toAdminPage(undefined)).toBe(1)
    expect(toAdminPage('0')).toBe(1)
    expect(toAdminPage('-3')).toBe(1)
    expect(toAdminPage('x')).toBe(1)
    expect(toAdminPage('1.5')).toBe(1)
    expect(toAdminPage('4')).toBe(4)
    expect(toAdminSearch(['lou', 'x'])).toBe('lou')
    expect(toAdminSearch(null)).toBe('')
  })

  it('la query de l’URL ne porte que ce qui n’est pas par défaut, et une nouvelle recherche revient à la page 1', () => {
    expect(buildAdminCompetitorsLocationQuery({}, {})).toEqual({})
    expect(buildAdminCompetitorsLocationQuery({ q: 'lou', page: '3' }, { page: 4 })).toEqual({ q: 'lou', page: '4' })
    expect(buildAdminCompetitorsLocationQuery({ q: 'lou', page: '3' }, { q: 'ma', page: 1 })).toEqual({ q: 'ma' })
    expect(buildAdminCompetitorsLocationQuery({ q: 'lou', page: '3' }, { q: '', page: 1 })).toEqual({})
  })

  it('l’adresse de la fiche est /admin/competiteurs/<id>', () => {
    expect(buildAdminCompetitorLink('abc')).toBe('/admin/competiteurs/abc')
  })
})

describe('erreurs de l’API traduites', () => {
  const failure = (statusCode: number, code: API_ERROR_CODE, isOffline = false) =>
    new ApiRequestError({ statusCode, code, message: 'x' }, isOffline)

  it('412 VERSION_CONFLICT : message « modifié, rechargez » et conflit reconnu', () => {
    const result = toCompetitorFailure(failure(412, API_ERROR_CODE.VERSION_CONFLICT))
    expect(result.title.key).toBe('admin.competitors.error_version_title')
    expect(result.statusCode).toBe(412)
    expect(isVersionConflict(result)).toBe(true)
  })

  it('428 PRECONDITION_REQUIRED (défaut du front) a son message et n’est pas un conflit', () => {
    const result = toCompetitorFailure(failure(428, API_ERROR_CODE.PRECONDITION_REQUIRED))
    expect(result.title.key).toBe('admin.competitors.error_precondition_title')
    expect(isVersionConflict(result)).toBe(false)
  })

  it('400, 404, hors ligne, inconnu', () => {
    expect(toCompetitorFailure(failure(400, API_ERROR_CODE.VALIDATION_FAILED)).title.key).toBe('admin.competitors.error_validation_title')
    expect(toCompetitorFailure(failure(404, API_ERROR_CODE.COMPETITOR_NOT_FOUND)).title.key).toBe('admin.competitors.error_not_found_title')
    expect(toCompetitorFailure(failure(0, API_ERROR_CODE.INTERNAL_ERROR, true)).title.key).toBe('admin.competitors.error_offline_title')
    expect(toCompetitorFailure(failure(500, API_ERROR_CODE.INTERNAL_ERROR)).title.key).toBe('admin.competitors.error_unknown_title')
    expect(toCompetitorFailure(new Error('x')).title.key).toBe('admin.competitors.error_unknown_title')
    expect(isVersionConflict(null)).toBe(false)
  })
})

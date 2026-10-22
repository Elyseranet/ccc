import { describe, expect, it } from 'vitest'
import { API_ERROR_CODE } from '~~/src/enums/api-error-code.enum'
import { USER_ROLE } from '~~/src/enums/user.enum'
import { MATCH_STATUS } from '~~/src/enums/match.enum'
import { editionId } from '~/fixtures/edition-id.fixture'
import { FIXTURE_VARIANT } from '~/enums/fixture-variant.enum'
import { RANKING_KIND } from '~/enums/ranking-kind.enum'
import { CompetitorService } from '~/services/competitor.service'
import { EditionService } from '~/services/edition.service'
import { MatchService } from '~/services/match.service'
import { MeService } from '~/services/me.service'
import { RankingService } from '~/services/ranking.service'
import { ApiRequestError } from '~/utils/api-request-error.util'
import { parseFixtureRole, parseFixtureVariant } from '~/utils/fixture.util'

describe('sélection des variantes et de la session de fixture', () => {
  it('ignore la sélection hors dev et test', () => {
    expect(parseFixtureVariant('error', false)).toBe(FIXTURE_VARIANT.DEFAULT)
    expect(parseFixtureRole('admin', false)).toBeNull()
  })

  it('accepte empty, error et default, et retombe sur default pour une valeur inconnue', () => {
    expect(parseFixtureVariant('empty', true)).toBe(FIXTURE_VARIANT.EMPTY)
    expect(parseFixtureVariant(['error'], true)).toBe(FIXTURE_VARIANT.ERROR)
    expect(parseFixtureVariant('n-importe-quoi', true)).toBe(FIXTURE_VARIANT.DEFAULT)
  })

  it('traduit le cookie de session de fixture en rôle', () => {
    expect(parseFixtureRole('admin', true)).toBe(USER_ROLE.ADMIN)
    expect(parseFixtureRole('participant', true)).toBe(USER_ROLE.PARTICIPANT)
    expect(parseFixtureRole('autre', true)).toBeNull()
    expect(parseFixtureRole(undefined, true)).toBeNull()
  })
})

describe('variante rate_limited', () => {
  it('n’est sélectionnable qu’en dev et en test, et rejette en 429 RATE_LIMITED', async () => {
    expect(parseFixtureVariant('rate_limited', true)).toBe(FIXTURE_VARIANT.RATE_LIMITED)
    expect(parseFixtureVariant('rate_limited', false)).toBe(FIXTURE_VARIANT.DEFAULT)
    const failure = await new EditionService({ variant: FIXTURE_VARIANT.RATE_LIMITED }).list().catch((error: unknown) => error)
    expect(failure).toBeInstanceOf(ApiRequestError)
    expect((failure as ApiRequestError).error.statusCode).toBe(429)
    expect((failure as ApiRequestError).error.code).toBe(API_ERROR_CODE.RATE_LIMITED)
  })
})

describe('session', () => {
  it('renvoie le rôle de la fixture, ou aucun rôle en variante empty', async () => {
    expect(await new MeService({ fixtureRole: USER_ROLE.ADMIN }).me()).toEqual({ role: USER_ROLE.ADMIN, initials: 'AD' })
    expect(await new MeService({ fixtureRole: USER_ROLE.ADMIN, variant: FIXTURE_VARIANT.EMPTY }).me()).toEqual({ role: null, initials: null })
  })
})

describe('fixtures issues des maquettes', () => {
  it('16 éditions, dont 2012a et 2012b, 2026 en cours et un champion pour chaque édition close', async () => {
    const editions = await new EditionService().list()
    expect(editions).toHaveLength(16)
    expect(editions.map(edition => edition.code)).toEqual(expect.arrayContaining(['2026', '2025', '2012a', '2012b']))
    expect(editions.filter(edition => edition.champion === null).map(edition => edition.code)).toEqual(['2026'])
    expect(new Set(editions.map(edition => edition.id)).size).toBe(16)
  })

  it('les statistiques d’archive reprennent A16 : 729 matchs dont 554 avec score', async () => {
    const stats = await new EditionService().stats()
    expect(stats).toMatchObject({ editions: 16, competitors: 145, matches: 729, scoredMatches: 554 })
  })

  it('l’édition 2025 a 45 participants, 8 poules, et un bracket de 8, 4, 2 et 1 matchs', async () => {
    const [edition2025] = (await new EditionService().list()).filter(edition => edition.code === '2025')
    const detail = await new EditionService().detail(edition2025!.id)
    expect(detail.participants).toHaveLength(45)
    expect(detail.pools).toHaveLength(8)
    expect(detail.bracket.map(round => round.matches.length)).toEqual([8, 4, 2, 1])
    expect(detail.champion?.competitor.displayName).toBe('Lou Bernard')
  })

  it('une fixture publique n’expose ni email ni téléphone', async () => {
    const competitors = await new CompetitorService().list()
    expect(JSON.stringify(competitors)).not.toMatch(/email|phone/i)
    expect(competitors.total).toBe(145)
    expect(competitors.items).toHaveLength(20)
    expect(competitors.items.every(item => item.matchesPlayed === item.wins + item.losses && item.unknownResults === 0)).toBe(true)
  })

  it('la recherche filtre sans tenir compte de la casse ni des accents', async () => {
    const found = await new CompetitorService().list({ q: 'ANDRE' })
    expect(found.items.length).toBeGreaterThan(0)
    expect(found.items.every(item => item.displayName.normalize('NFD').toLowerCase().includes('andre'))).toBe(true)
  })

  it('une paire sans match avec score a un ratio null, jamais 0 %', async () => {
    const { COMPETITORS_FIXTURE } = await import('~/fixtures/competitor.fixture')
    const sam = COMPETITORS_FIXTURE.find(item => item.displayName === 'Sam Dupont')!
    const opponent = COMPETITORS_FIXTURE.find(item => item.displayName === 'Côme Garnier')!
    const summary = await new CompetitorService().headToHead(sam.id, opponent.id)
    expect(summary.played).toBe(0)
    expect(summary.winRatio).toBeNull()
  })

  it('un identifiant inconnu rejette en 404', async () => {
    const failure = await new CompetitorService().detail('inconnu').catch((error: unknown) => error)
    expect(failure).toBeInstanceOf(ApiRequestError)
    expect((failure as ApiRequestError).error.statusCode).toBe(404)
  })

  it('les classements ACP et All Time ont 20 lignes ordonnées, et l’évolution suit 4 joueurs sur 10 éditions', async () => {
    const service = new RankingService()
    const acp = await service.ranking(RANKING_KIND.ACP)
    const allTime = await service.ranking(RANKING_KIND.ALL_TIME)
    expect(acp.map(row => row.rank)).toEqual(Array.from({ length: 20 }, (_, index) => index + 1))
    expect(allTime).toHaveLength(20)
    expect(acp[0]!.points).toBeGreaterThanOrEqual(acp[1]!.points)
    const evolution = await service.evolution(RANKING_KIND.ACP)
    expect(evolution).toHaveLength(4)
    expect(evolution.every(series => series.points.length === 10)).toBe(true)
  })

  it('la file admin 2026 porte les 105 matchs de la maquette : 7 saisis, 30 sans score, 68 validés', async () => {
    const matches = await new MatchService().adminList(editionId('2026'))
    const count = (status: MATCH_STATUS) => matches.filter(match => match.status === status).length
    expect(matches).toHaveLength(105)
    expect(count(MATCH_STATUS.RECORDED)).toBe(7)
    expect(count(MATCH_STATUS.SCHEDULED)).toBe(30)
    expect(count(MATCH_STATUS.VALIDATED)).toBe(68)
  })

  it('la file admin ne montre jamais un score non validé comme public', async () => {
    const matches = await new MatchService().adminList(editionId('2026'))
    for (const match of matches) {
      const validated = match.status === MATCH_STATUS.VALIDATED
      expect(match.sides.every(side => validated ? side.score === side.recordedScore : side.score === null)).toBe(true)
    }
  })

  it('une édition d’archive ne contient que des matchs validés', async () => {
    const matches = await new MatchService().adminList(editionId('2025'))
    expect(matches.length).toBeGreaterThan(0)
    expect(matches.every(match => match.status === MATCH_STATUS.VALIDATED)).toBe(true)
  })
})

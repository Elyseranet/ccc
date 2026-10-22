import { describe, expect, it } from 'vitest'
import { EDITION_STATUS } from '../../../src/enums/edition.enum'
import { MATCH_STATUS } from '../../../src/enums/match.enum'
import { PARTICIPATION_STATUS } from '../../../src/enums/participation.enum'
import { ROUND_KIND } from '../../../src/enums/round.enum'
import { FIXTURE_VARIANT } from '../../../src/enums/fixture-variant.enum'
import { editionId } from '../../../src/assets/fixtures/edition-id.fixture'
import { EditionService } from '../../../src/services/edition.service'
import { RankingService } from '../../../src/services/ranking.service'
import { RANKING_KIND } from '../../../src/enums/ranking-kind.enum'
import { parseFixtureVariant } from '../../../src/utils/fixture.util'

const ID_2026 = editionId('2026')
const ID_2025 = editionId('2025')

describe('édition 2026 : poules en cours (défaut)', () => {
  it('45 participants, 8 poules, 8 têtes de série, tour de poules à 68 sur 105', async () => {
    const detail = await new EditionService().detail(ID_2026)
    expect(detail.status).toBe(EDITION_STATUS.POOLS_PLAYING)
    expect(detail.participants).toHaveLength(45)
    expect(detail.participants.every(participant => participant.status === PARTICIPATION_STATUS.IN_POOL && participant.poolId !== null)).toBe(true)
    expect(detail.participants.filter(participant => participant.isSeed)).toHaveLength(8)
    expect(detail.pools).toHaveLength(8)
    const pools = detail.rounds.find(round => round.kind === ROUND_KIND.POOLS)
    expect(pools?.matchCount).toBe(105)
    expect(pools?.validatedMatchCount).toBe(68)
    expect(detail.unknownResultMatchCount).toBe(0)
  })

  it('porte les 4 derniers scores validés de la maquette, du plus récent au plus ancien, sur le détail et sur la liste des matchs', async () => {
    const service = new EditionService()
    const detail = await service.detail(ID_2026)
    const page = await service.matches(ID_2026)
    for (const matches of [detail.matches, page.items]) {
      expect(matches).toHaveLength(4)
      expect(matches.every(match => match.status === MATCH_STATUS.VALIDATED && match.sides.every(side => side.score !== null))).toBe(true)
      expect(matches.map(match => match.sides.map(side => side.displayName)[0])).toEqual(['Manon Faure', 'Côme Michel', 'Maya Bonnet', 'Anna Chevalier'])
    }
  })

  it('ne change rien aux autres éditions', async () => {
    const detail = await new EditionService().detail(ID_2025)
    expect(detail.participants).toHaveLength(45)
    expect(detail.status).toBe(EDITION_STATUS.CLOSED)
  })
})

describe('scénario ?fixture=registration', () => {
  it('n’est sélectionnable qu’en dev et en test', () => {
    expect(parseFixtureVariant('registration', true)).toBe(FIXTURE_VARIANT.REGISTRATION)
    expect(parseFixtureVariant('registration', false)).toBe(FIXTURE_VARIANT.DEFAULT)
  })

  it('EDITIONS renvoie 2026 en REGISTRATION, les 15 autres éditions sont inchangées', async () => {
    const standard = await new EditionService().list()
    const registration = await new EditionService({ variant: FIXTURE_VARIANT.REGISTRATION }).list()
    expect(registration).toHaveLength(16)
    expect(registration.find(edition => edition.id === ID_2026)?.status).toBe(EDITION_STATUS.REGISTRATION)
    expect(registration.find(edition => edition.id === ID_2026)?.participantCount).toBe(44)
    expect(registration.filter(edition => edition.id !== ID_2026)).toEqual(standard.filter(edition => edition.id !== ID_2026))
  })

  it('EDITION renvoie 2026 en REGISTRATION avec 44 inscrits, sans poule, sans tour ni match', async () => {
    const detail = await new EditionService({ variant: FIXTURE_VARIANT.REGISTRATION }).detail(ID_2026)
    expect(detail.status).toBe(EDITION_STATUS.REGISTRATION)
    expect(detail.participants).toHaveLength(44)
    expect(detail.participants.every(participant => participant.status === PARTICIPATION_STATUS.REGISTERED && participant.poolId === null && !participant.isSeed)).toBe(true)
    expect(detail.pools).toEqual([])
    expect(detail.rounds).toEqual([])
    expect(detail.matches).toEqual([])
    expect(detail.unknownResultMatchCount).toBe(0)
  })

  it('EDITION d’une autre édition reste identique au défaut', async () => {
    const standard = await new EditionService().detail(ID_2025)
    const registration = await new EditionService({ variant: FIXTURE_VARIANT.REGISTRATION }).detail(ID_2025)
    expect(registration).toEqual(standard)
  })

  it('les autres endpoints gardent leur jeu par défaut', async () => {
    const standard = new EditionService()
    const scenario = new EditionService({ variant: FIXTURE_VARIANT.REGISTRATION })
    expect(await scenario.stats()).toEqual(await standard.stats())
    expect(await new RankingService({ variant: FIXTURE_VARIANT.REGISTRATION }).ranking(RANKING_KIND.ACP)).toEqual(await new RankingService().ranking(RANKING_KIND.ACP))
  })

  it('les variantes empty et error restent inchangées', async () => {
    expect(await new EditionService({ variant: FIXTURE_VARIANT.EMPTY }).list()).toEqual([])
    await expect(new EditionService({ variant: FIXTURE_VARIANT.ERROR }).list()).rejects.toThrow()
  })
})

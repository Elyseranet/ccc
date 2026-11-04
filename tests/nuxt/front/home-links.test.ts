import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import { RouterLink } from 'vue-router'
import HomeBento from '../../../src/components/home/HomeBento.vue'
import HomeHero from '../../../src/components/home/HomeHero.vue'
import { useHomeLinks } from '../../../src/composables/useHomeLinks'
import { ROUTES } from '../../../src/consts/routes.const'
import { EDITION_ORIGIN, EDITION_STATUS } from '../../../src/enums/edition.enum'
import type { IEditionSummary } from '../../../src/interfaces/edition.interface'
import { buildHomeOverview } from '../../../src/utils/home.util'

/*********************************************************
 * Liens de l'accueil vers une page non livrée (T-REL-02, decisions.md ab1a6b4)
 *
 * @description
 * Les trois liens vers le palmarès (CTA du hero, tuile du champion, « voir le classement ») sont masqués tant que la page n'est pas
 * livrée, par la règle de la navigation (`isPageAccessible`), et reviennent à la livraison. En dev et en test tout est accessible :
 * les e2e visuels voient les liens.
 ********************************************************/
const withRouterLink = { global: { components: { RouterLink } } }
const person = (id: string, name: string) => ({ id, displayName: name, firstName: null, lastName: null, nickname: null, avatarUrl: null })
const closed = { id: 'id-2025', code: '2025', year: 2025, name: null, heldOn: null, location: null, status: EDITION_STATUS.CLOSED, origin: EDITION_ORIGIN.LEGACY_IMPORT, participantCount: 45, unidentifiedParticipantCount: 0, matchCount: 10, scoredMatchCount: 10, unknownResultMatchCount: 0, champion: { competitor: person('c1', 'Lou Bernard'), titlesToDate: 4 }, final: null, semiFinalists: [] } as IEditionSummary
const ranking = [1, 2].map(rank => ({ rank, competitor: person(`r${rank}`, `Joueur ${rank}`), points: 50 - rank, participations: 5, average: 10, titles: rank }))
const overview = buildHomeOverview({ editions: [closed], stats: { editions: 1, competitors: 10, matches: 10, scoredMatches: 10, unknownResultMatches: 0 }, detail: null, matches: [], ranking })

describe('useHomeLinks', () => {
  it('palmarès non livré en production : aucun lien', () => {
    const { hallOfFameLinked, hallOfFameTo } = useHomeLinks(false)
    expect(hallOfFameLinked.value).toBe(false)
    expect(hallOfFameTo.value).toBeUndefined()
  })

  it('dev et test : tout est accessible, le lien est présent', () => {
    const { hallOfFameLinked, hallOfFameTo } = useHomeLinks(true)
    expect(hallOfFameLinked.value).toBe(true)
    expect(hallOfFameTo.value).toBe(ROUTES.HALL_OF_FAME)
  })
})

describe('liens vers le palmarès de l’accueil', () => {
  it('hero : le bouton secondaire est absent sans cible, présent avec', async () => {
    const without = await mountSuspended(HomeHero, { ...withRouterLink, props: { archive: overview.archive, target: null } })
    expect(without.find('[data-cy="home-cta-secondary"]').exists()).toBe(false)
    expect(without.find('[data-cy="home-cta-primary"]').exists()).toBe(true)
    const withLink = await mountSuspended(HomeHero, { ...withRouterLink, props: { archive: overview.archive, target: null, hallOfFameTo: ROUTES.HALL_OF_FAME } })
    expect(withLink.get('[data-cy="home-cta-secondary"]').attributes('href')).toBe(ROUTES.HALL_OF_FAME)
  })

  it('bento : la tuile du champion n’est pas un lien et « voir le classement » est absent sans cible', async () => {
    const without = await mountSuspended(HomeBento, { ...withRouterLink, props: { overview } })
    expect(without.find('[data-cy="home-tile-champion"]').attributes('href')).toBeUndefined()
    expect(without.find('[data-cy="home-rank-more"]').exists()).toBe(false)
    expect(without.find('a[href="/palmares"]').exists()).toBe(false)
  })

  it('bento : les deux liens reviennent avec la cible', async () => {
    const wrapper = await mountSuspended(HomeBento, { ...withRouterLink, props: { overview, hallOfFameTo: ROUTES.HALL_OF_FAME } })
    expect(wrapper.get('[data-cy="home-tile-champion"]').attributes('href')).toBe(ROUTES.HALL_OF_FAME)
    expect(wrapper.get('[data-cy="home-rank-more"]').attributes('href')).toBe(ROUTES.HALL_OF_FAME)
  })
})

import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import { RouterLink } from 'vue-router'
import EditionBracket from '~/components/edition/EditionBracket.vue'
import { ROUND_KIND } from '../../../../src/enums/round.enum'
import type { IEditionBracketRound } from '../../../../src/interfaces/edition-view.interface'

/*********************************************************
 * F-03-BRK : tableau des phases finales sur `origam-bracket`
 *
 * @description
 * Les exigences de la décision F-03-BRK bis : aucun trait de liaison (RG13, FA-11), lien joueur et score dans le slot `competitor`,
 * vainqueur annoncé en texte, région focalisable et nommée, alternative en liste.
 ********************************************************/
const withRouterLink = { global: { components: { RouterLink } } }
const person = (id: string, displayName: string) => ({ id, displayName })
const rounds: IEditionBracketRound[] = [
  {
    kind: ROUND_KIND.SEMI,
    matches: [{
      id: 'm1',
      winnerWithoutScore: false,
      sides: [
        { participationId: 'p1', competitor: person('c1', 'Maya Legrand'), score: 10, isWinner: true },
        { participationId: 'p2', competitor: person('c2', 'Clara Lambert'), score: 4, isWinner: false }
      ]
    }]
  },
  {
    kind: ROUND_KIND.FINAL,
    matches: [{
      id: 'm2',
      winnerWithoutScore: false,
      sides: [
        { participationId: 'p1', competitor: person('c1', 'Maya Legrand'), score: null, isWinner: false },
        { participationId: 'p3', competitor: person('c3', 'Sam Dupont'), score: null, isWinner: false }
      ]
    }]
  }
]

describe('EditionBracket (F-03-BRK)', () => {
  it('aucun connecteur : le slot connector est rempli, pas de path', async () => {
    const wrapper = await mountSuspended(EditionBracket, { ...withRouterLink, props: { rounds } })
    expect(wrapper.find('svg.origam-bracket__connectors').exists()).toBe(true)
    expect(wrapper.findAll('svg.origam-bracket__connectors path')).toHaveLength(0)
  })

  it('un lien joueur et le score dans chaque ligne, le vainqueur annoncé en texte', async () => {
    const wrapper = await mountSuspended(EditionBracket, { ...withRouterLink, props: { rounds } })
    const region = wrapper.get('[data-cy="edition-bracket-region"]')
    expect(region.findAll('[data-cy="player-link"]')).toHaveLength(4)
    const sides = region.findAll('.edition-bracket__side')
    expect(sides).toHaveLength(4)
    expect(sides[0]!.find('.edition-bracket__score').text()).toBe('10')
    expect(sides[0]!.find('.sr-only').exists()).toBe(true)
    expect(sides[1]!.find('.sr-only').exists()).toBe(false)
    expect(sides[2]!.find('.edition-bracket__score').text()).toBe('')
  })

  it('région focalisable et nommée, un titre par tour, liste alternative présente', async () => {
    const wrapper = await mountSuspended(EditionBracket, { ...withRouterLink, props: { rounds } })
    const region = wrapper.get('[data-cy="edition-bracket-region"]')
    expect(region.attributes('role')).toBe('region')
    expect(region.attributes('tabindex')).toBe('0')
    expect(region.attributes('aria-label')).toBeTruthy()
    expect(region.findAll('h3')).toHaveLength(2)
    expect(wrapper.find('[data-cy="edition-bracket-list"]').exists()).toBe(true)
  })

  it('F-34 : un match d’archive sans score montre le vainqueur et « score non archivé », jamais un score', async () => {
    const archived: IEditionBracketRound[] = [{
      kind: ROUND_KIND.QUARTER,
      matches: [{
        id: 'm9',
        winnerWithoutScore: true,
        sides: [
          { participationId: 'p1', competitor: person('c1', 'Simon Vaur'), score: null, isWinner: true },
          { participationId: 'p2', competitor: person('c2', 'Kevin Mercurio'), score: null, isWinner: false }
        ]
      }]
    }]
    const wrapper = await mountSuspended(EditionBracket, { ...withRouterLink, props: { rounds: archived } })
    const sides = wrapper.get('[data-cy="edition-bracket-region"]').findAll('.edition-bracket__side')
    expect(sides[0]!.classes()).toContain('edition-bracket__side--win')
    expect(sides[0]!.text()).toContain('score non archivé')
    expect(sides[1]!.text()).toContain('score non archivé')
    expect(wrapper.get('[data-cy="edition-bracket-list"]').text()).toContain('Simon Vaur contre Kevin Mercurio (score non archivé)')
  })

  it('F-34 : un match sans vainqueur ni score garde l’affichage d’avant (aucune mention)', async () => {
    const wrapper = await mountSuspended(EditionBracket, { ...withRouterLink, props: { rounds } })
    expect(wrapper.text()).not.toContain('score non archivé')
  })
})

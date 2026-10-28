import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import { RouterLink } from 'vue-router'
import HeadToHeadHistory from '../../../src/components/head-to-head/HeadToHeadHistory.vue'
import HeadToHeadPicker from '../../../src/components/head-to-head/HeadToHeadPicker.vue'
import HeadToHeadSummary from '../../../src/components/head-to-head/HeadToHeadSummary.vue'
import { HEAD_TO_HEAD_FIELD_ERROR } from '../../../src/enums/head-to-head.enum'
import { ROUND_KIND } from '../../../src/enums/round.enum'
import type { ICompetitorDetail, ICompetitorPublic } from '../../../src/interfaces/competitor.interface'
import type { IHeadToHead } from '../../../src/interfaces/head-to-head.interface'
import { careerRatio, initialsOf, isUuid, lastMeeting, readQueryId, toOptions } from '../../../src/utils/head-to-head.util'

const SAM = '00000000-0000-4000-0001-000000000009'
const MAYA = '00000000-0000-4000-0001-000000000005'
const COME = '00000000-0000-4000-0001-000000000016'

const withRouterLink = { global: { components: { RouterLink } } }

const person = (id: string, firstName: string, lastName: string): ICompetitorPublic => ({ id, displayName: `${firstName} ${lastName}`, firstName, lastName, nickname: null, avatarUrl: null })
const sam = person(SAM, 'Sam', 'Dupont')
const maya = person(MAYA, 'Maya', 'Legrand')
const come = person(COME, 'Côme', 'Garnier')

const detail = (competitor: ICompetitorPublic, stats: Partial<ICompetitorDetail['stats']>): ICompetitorDetail => ({
  ...competitor,
  participations: [],
  stats: { played: 0, wins: 0, losses: 0, unknownResults: 0, pointsFor: 0, pointsAgainst: 0, titles: 0, ...stats }
})
const samDetail = detail(sam, { played: 79, wins: 56, losses: 23, pointsFor: 415, pointsAgainst: 309, titles: 1 })
const mayaDetail = detail(maya, { played: 70, wins: 50, losses: 20, pointsFor: 354, pointsAgainst: 270, titles: 1 })
const comeDetail = detail(come, {})

const match = (matchId: string, editionCode: string, roundKind: ROUND_KIND, competitorScore: number, opponentScore: number, winner: string) => ({
  matchId, editionId: `edition-${editionCode}`, editionCode, roundKind, competitorScore, opponentScore, winnerCompetitorId: winner,
  poolNumber: roundKind === ROUND_KIND.POOLS ? 1 : null
})
const samVsMaya: IHeadToHead = {
  competitor: sam,
  opponent: { ...maya, titles: 1 },
  played: 4,
  wins: 2,
  losses: 2,
  unknownResults: 0,
  winRatio: 0.5,
  pointsFor: 28,
  pointsAgainst: 31,
  differential: -3,
  matches: [
    match('m1', '2023', ROUND_KIND.QUARTER, 5, 10, MAYA),
    match('m2', '2020', ROUND_KIND.ROUND_OF_16, 10, 8, SAM),
    match('m3', '2017', ROUND_KIND.ROUND_OF_16, 8, 10, MAYA),
    match('m4', '2014', ROUND_KIND.POOLS, 5, 3, SAM)
  ]
}
const samVsCome: IHeadToHead = { competitor: sam, opponent: { ...come, titles: 0 }, played: 0, wins: 0, losses: 0, unknownResults: 0, winRatio: null, pointsFor: 0, pointsAgainst: 0, differential: 0, matches: [] }

describe('utilitaires du face-à-face', () => {
  it('lit un identifiant de l’URL : première valeur, vide ignoré', () => {
    expect(readQueryId(SAM)).toBe(SAM)
    expect(readQueryId([SAM, MAYA])).toBe(SAM)
    expect(readQueryId('  ')).toBeNull()
    expect(readQueryId(undefined)).toBeNull()
  })

  it('reconnaît un UUID et refuse le reste', () => {
    expect(isUuid(SAM)).toBe(true)
    expect(isUuid('pas-un-uuid')).toBe(false)
    expect(isUuid(null)).toBe(false)
  })

  it('garde le joueur choisi en tête des options, sans doublon', () => {
    const options = toOptions([samDetail], [samDetail, maya])
    expect(options.map(option => option.value)).toEqual([SAM, MAYA])
  })

  it('retient la dernière rencontre par code d’édition', () => {
    expect(lastMeeting(samVsMaya.matches)).toEqual({ editionCode: '2023', roundKind: ROUND_KIND.QUARTER })
    expect(lastMeeting([])).toBeNull()
  })

  it('calcule le ratio de carrière, et rien sans match avec score', () => {
    expect(careerRatio(56, 79)).toBeCloseTo(0.709, 3)
    expect(careerRatio(0, 0)).toBeNull()
  })

  it('compose des initiales', () => {
    expect(initialsOf(sam)).toBe('SD')
  })
})

describe('HeadToHeadSummary', () => {
  it('affiche le score en texte ET en barre, et le ratio de carrière de chaque joueur', async () => {
    const wrapper = await mountSuspended(HeadToHeadSummary, { ...withRouterLink, props: { comparison: samVsMaya, detailA: samDetail, detailB: mayaDetail } })
    expect(wrapper.get('[data-cy="head-to-head-score"]').text().replace(/\s+/g, '')).toBe('2–2')
    expect(wrapper.get('[data-cy="head-to-head-bar"]').attributes('role')).toBe('progressbar')
    expect(wrapper.get('[data-cy="head-to-head-bar"]').attributes('aria-valuenow')).toBe('50')
    expect(wrapper.get('[data-cy="head-to-head-meetings"]').text()).toBe('4 rencontres · dernière : 2023, quart de finale')
    expect(wrapper.get('[data-cy="head-to-head-stats-a"]').text()).toContain('71 %')
    expect(wrapper.get('[data-cy="head-to-head-stats-a"]').text()).toContain('+106')
  })

  it('winRatio null (jamais affrontés, ou aucun score) : état vide, jamais « 0 % »', async () => {
    const wrapper = await mountSuspended(HeadToHeadSummary, { ...withRouterLink, props: { comparison: samVsCome, detailA: samDetail, detailB: comeDetail } })
    expect(wrapper.find('[data-cy="head-to-head-bar"]').exists()).toBe(false)
    expect(wrapper.find('[data-cy="head-to-head-score"]').exists()).toBe(false)
    expect(wrapper.get('[data-cy="head-to-head-never-met"]').text()).toContain('jamais affrontés')
    expect(wrapper.text()).not.toMatch(/(^|\s)0 %/)
  })

  it('un joueur sans match avec score affiche « Indisponible » plutôt que « 0 % »', async () => {
    const wrapper = await mountSuspended(HeadToHeadSummary, { ...withRouterLink, props: { comparison: samVsCome, detailA: samDetail, detailB: comeDetail } })
    expect(wrapper.get('[data-cy="head-to-head-stats-b"]').text()).toContain('Indisponible')
    expect(wrapper.get('[data-cy="head-to-head-stats-b"]').text()).not.toContain('0 %')
  })
})

describe('HeadToHeadHistory', () => {
  it('liste les rencontres du vainqueur au perdant, sans compteur de résultats inconnus par joueur', async () => {
    const wrapper = await mountSuspended(HeadToHeadHistory, { ...withRouterLink, props: { comparison: samVsMaya, detailA: { ...samDetail, stats: { ...samDetail.stats, unknownResults: 3 } }, detailB: mayaDetail } })
    const rows = wrapper.findAll('tbody tr')
    expect(rows).toHaveLength(4)
    expect(rows[0]!.text()).toContain('2023')
    expect(rows[0]!.text()).toContain('10 – 5')
    expect(rows[0]!.text()).toContain('Maya Legrand')
    expect(wrapper.find('[data-cy="head-to-head-unknown-results"]').exists()).toBe(false)
    expect(wrapper.get('[data-cy="head-to-head-note"]').text()).toContain('jamais comme des nuls')
  })

  it('G10 : un match de poule affiche « Poule n » dans la colonne Tour, les autres le libellé du tour', async () => {
    const wrapper = await mountSuspended(HeadToHeadHistory, { ...withRouterLink, props: { comparison: samVsMaya, detailA: samDetail, detailB: mayaDetail } })
    const rounds = wrapper.findAll('tbody tr').map(row => row.findAll('td')[1]!.text())
    expect(rounds).toContain('Poule 1')
    expect(rounds.filter(round => round === 'Poule 1')).toHaveLength(samVsMaya.matches.filter(item => item.roundKind === ROUND_KIND.POOLS).length)
    expect(rounds).toContain('Quart de finale')
  })

  it('G9 : les résultats inconnus de la paire sont annoncés à part, seulement s’il y en a', async () => {
    const none = await mountSuspended(HeadToHeadHistory, { ...withRouterLink, props: { comparison: samVsMaya, detailA: samDetail, detailB: mayaDetail } })
    expect(none.find('[data-cy="head-to-head-unknown-results"]').exists()).toBe(false)
    expect(none.get('[data-cy="head-to-head-note"]').text()).toBe('Les rencontres sans score connu sont comptées à part, jamais comme des nuls.')
    const one = await mountSuspended(HeadToHeadHistory, { ...withRouterLink, props: { comparison: { ...samVsMaya, unknownResults: 1 }, detailA: samDetail, detailB: mayaDetail } })
    expect(one.get('[data-cy="head-to-head-note"]').text()).toBe('1 rencontre au résultat inconnu. Les rencontres sans score connu sont comptées à part, jamais comme des nuls.')
    const three = await mountSuspended(HeadToHeadHistory, { ...withRouterLink, props: { comparison: { ...samVsMaya, unknownResults: 3 }, detailA: samDetail, detailB: mayaDetail } })
    expect(three.get('[data-cy="head-to-head-note"]').text()).toBe('3 rencontres au résultat inconnu. Les rencontres sans score connu sont comptées à part, jamais comme des nuls.')
    expect(three.findAll('tbody tr')).toHaveLength(samVsMaya.matches.length)
  })

  it('sans rencontre avec score : message vide, aucun tableau', async () => {
    const wrapper = await mountSuspended(HeadToHeadHistory, { ...withRouterLink, props: { comparison: samVsCome, detailA: null, detailB: null } })
    expect(wrapper.find('table').exists()).toBe(false)
    expect(wrapper.find('[data-cy="head-to-head-history-empty"]').exists()).toBe(true)
  })
})

describe('HeadToHeadPicker', () => {
  const props = {
    playerA: SAM,
    playerB: SAM,
    searchA: '',
    searchB: '',
    optionsA: [{ title: 'Sam Dupont', value: SAM }],
    optionsB: [{ title: 'Sam Dupont', value: SAM }],
    errorA: HEAD_TO_HEAD_FIELD_ERROR.SAME_PLAYER,
    errorB: HEAD_TO_HEAD_FIELD_ERROR.SAME_PLAYER
  }

  it('relie l’erreur « même joueur » à chaque champ par aria-describedby', async () => {
    const wrapper = await mountSuspended(HeadToHeadPicker, { ...withRouterLink, props })
    expect(wrapper.find('fieldset legend').exists()).toBe(true)
    for (const side of ['a', 'b']) {
      const input = wrapper.get(`[data-cy="head-to-head-player-${side}"] input`)
      const describedBy = input.attributes('aria-describedby')
      expect(describedBy).toBeTruthy()
      expect(wrapper.find(`#${describedBy}`).text()).toContain('Choisissez deux joueurs différents.')
    }
  })

  it('émet swap depuis le bouton Inverser, nommé pour les lecteurs d’écran', async () => {
    const wrapper = await mountSuspended(HeadToHeadPicker, { ...withRouterLink, props: { ...props, errorA: HEAD_TO_HEAD_FIELD_ERROR.NONE, errorB: HEAD_TO_HEAD_FIELD_ERROR.NONE } })
    const button = wrapper.get('[data-cy="head-to-head-swap"]')
    expect(button.attributes('aria-label')).toBe('Inverser les deux joueurs')
    await button.trigger('click')
    expect(wrapper.emitted('swap')).toHaveLength(1)
  })
})

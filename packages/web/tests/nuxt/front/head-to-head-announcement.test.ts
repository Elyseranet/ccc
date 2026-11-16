import { ref } from 'vue'
import { describe, expect, it } from 'vitest'
import { useHeadToHeadAnnouncement } from '../../../src/composables/useHeadToHeadAnnouncement'
import type { IHeadToHead } from '../../../src/interfaces/head-to-head.interface'
import { winsTextOf } from '../../../src/utils/head-to-head.util'

const comparison = (wins: number, losses: number, winRatio: number | null): IHeadToHead => ({
  competitor: { id: 'a', displayName: 'Clément Fossati', firstName: 'Clément' },
  opponent: { id: 'b', displayName: 'Nicolas Deseine', firstName: 'Nicolas' },
  wins,
  losses,
  played: wins + losses,
  winRatio,
  matches: []
}) as unknown as IHeadToHead

describe('annonce du résultat du face-à-face (S2)', () => {
  it('vide tant qu’il n’y a pas de résultat', () => {
    expect(useHeadToHeadAnnouncement(ref(null)).announcement.value).toBe('')
  })

  it('dit les victoires de chacun, au pluriel ou au singulier', () => {
    expect(useHeadToHeadAnnouncement(ref(comparison(3, 2, 0.6))).announcement.value).toBe('Face-à-face : 3 victoires de Clément Fossati, 2 victoires de Nicolas Deseine.')
    expect(useHeadToHeadAnnouncement(ref(comparison(1, 0, 1))).announcement.value).toBe('Face-à-face : 1 victoire de Clément Fossati, 0 victoires de Nicolas Deseine.')
  })

  it('jamais affrontés avec un score connu : la phrase dédiée', () => {
    expect(useHeadToHeadAnnouncement(ref(comparison(0, 0, null))).announcement.value).toContain('jamais affrontés')
  })

  it('winsTextOf : la clé du singulier pour 1, du pluriel sinon', () => {
    expect(winsTextOf(1, 'Lou').key).toBe('head_to_head.duel.wins_one')
    expect(winsTextOf(0, 'Lou').key).toBe('head_to_head.duel.wins_other')
  })
})

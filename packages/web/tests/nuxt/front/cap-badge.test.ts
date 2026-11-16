import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import CapBadge from '~/components/common/CapBadge.vue'
import { BRAND_CAP_POINTS } from '~/consts/brand.const'
import { CAP_BADGE_DEFAULT_TEXT_SIZE, CAP_BADGE_DEFAULT_TEXT_Y, CAP_TONE_FILL } from '~/consts/cap-badge.const'
import { CAP_TONE } from '~/enums/cap-tone.enum'

describe('CapBadge (F-23)', () => {
  it('décorative : aria-hidden, non focalisable, polygone de la marque et rond intérieur', async () => {
    const wrapper = await mountSuspended(CapBadge)
    const svg = wrapper.get('svg')
    expect(svg.attributes('aria-hidden')).toBe('true')
    expect(svg.attributes('focusable')).toBe('false')
    expect(wrapper.get('polygon').attributes('points')).toBe(BRAND_CAP_POINTS)
    expect(wrapper.get('circle').attributes('r')).toBe('31')
  })

  it('sans texte : pas d’élément texte', async () => {
    const wrapper = await mountSuspended(CapBadge)
    expect(wrapper.find('text').exists()).toBe(false)
  })

  it('avec texte : position et taille par défaut des capsules à chiffre, ou celles des props', async () => {
    const byDefault = await mountSuspended(CapBadge, { props: { text: '1' } })
    expect(byDefault.get('text').text()).toBe('1')
    expect(byDefault.get('text').attributes('y')).toBe(String(CAP_BADGE_DEFAULT_TEXT_Y))
    expect(byDefault.get('text').attributes('font-size')).toBe(String(CAP_BADGE_DEFAULT_TEXT_SIZE))
    const custom = await mountSuspended(CapBadge, { props: { text: '404', textY: 59, textSize: 36 } })
    expect(custom.get('text').attributes('y')).toBe('59')
    expect(custom.get('text').attributes('font-size')).toBe('36')
  })

  it('teinte : l’ambre par défaut, le néon et la glace par jeton', async () => {
    expect((await mountSuspended(CapBadge)).get('svg').attributes('style')).toContain(CAP_TONE_FILL[CAP_TONE.AMBER])
    expect((await mountSuspended(CapBadge, { props: { tone: CAP_TONE.NEON } })).get('svg').attributes('style')).toContain(CAP_TONE_FILL[CAP_TONE.NEON])
    expect((await mountSuspended(CapBadge, { props: { tone: CAP_TONE.ICE } })).get('svg').attributes('style')).toContain(CAP_TONE_FILL[CAP_TONE.ICE])
  })

  it('la classe du parent retombe sur le svg (taille, rotation, animation restent au parent)', async () => {
    const wrapper = await mountSuspended(CapBadge, { attrs: { class: 'home-pint__cap' } })
    expect(wrapper.get('svg').classes()).toContain('home-pint__cap')
  })
})

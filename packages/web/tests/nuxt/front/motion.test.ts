import { mountSuspended } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it } from 'vitest'
import MotionToggle from '~/components/common/MotionToggle.vue'
import { MOTION_COOKIE, MOTION_COOKIE_MAX_AGE_SECONDS, MOTION_PAUSED_VALUE, MOTION_STATE_KEY } from '~/consts/motion.const'

describe('MotionToggle : pause des animations (T-A11Y-01, M5)', () => {
  beforeEach(() => {
    useState<boolean>(MOTION_STATE_KEY).value = false
    useCookie(MOTION_COOKIE).value = null
  })

  it('un bouton à bascule : libellé fixe, aria-pressed suit l’état, cookie « paused » posé puis retiré', async () => {
    const wrapper = await mountSuspended(MotionToggle)
    const button = wrapper.get('[data-cy="motion-toggle"]')
    expect(button.element.tagName).toBe('BUTTON')
    expect(button.text()).toBe('Mettre en pause les animations')
    expect(button.attributes('aria-pressed')).toBe('false')
    await button.trigger('click')
    expect(button.attributes('aria-pressed')).toBe('true')
    expect(useCookie(MOTION_COOKIE).value).toBe(MOTION_PAUSED_VALUE)
    expect(button.text()).toBe('Mettre en pause les animations')
    await button.trigger('click')
    expect(button.attributes('aria-pressed')).toBe('false')
    expect(useCookie(MOTION_COOKIE).value).toBeFalsy()
  })

  it('la durée du cookie est de 12 mois', () => {
    expect(MOTION_COOKIE_MAX_AGE_SECONDS).toBe(365 * 24 * 60 * 60)
  })
})

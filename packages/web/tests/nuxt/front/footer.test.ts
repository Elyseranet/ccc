import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import { h } from 'vue'
import { OrigamApp } from 'origam/components'
import { RouterLink } from 'vue-router'
import DefaultLayout from '~/layouts/default.vue'
import { LEGAL_SITE_CREDIT_NAME, LEGAL_SITE_CREDIT_URL } from '../../../src/consts/legal.const'

/*********************************************************
 * Pied de page : © Cotentin Caps Cup, crédit Elysera (COPYRIGHT-1)
 *
 * @description
 * Le © porte le nom du site, l'année est celle du jour ; Elysera n'apparaît que dans le crédit « Site réalisé par … ».
 ********************************************************/
const mountApp = () => mountSuspended({ render: () => h(OrigamApp, null, { default: () => h(DefaultLayout) }) }, { global: { components: { RouterLink } } })

describe('pied de page (COPYRIGHT-1)', () => {
  it('le © dit « Cotentin Caps Cup » avec l’année courante, sans Elysera', async () => {
    const wrapper = await mountApp()
    const copyright = wrapper.get('[data-cy="footer-copyright"]').text()
    expect(copyright).toBe(`© ${new Date().getFullYear()} Cotentin Caps Cup`)
    expect(copyright).not.toContain(LEGAL_SITE_CREDIT_NAME)
  })

  it('le crédit garde Elysera et son lien', async () => {
    const wrapper = await mountApp()
    const credit = wrapper.get('[data-cy="footer-credit-publisher"]')
    expect(credit.text()).toBe(LEGAL_SITE_CREDIT_NAME)
    expect(credit.attributes('href')).toBe(LEGAL_SITE_CREDIT_URL)
  })
})

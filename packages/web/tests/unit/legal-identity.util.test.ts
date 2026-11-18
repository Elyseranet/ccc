import { describe, expect, it } from 'vitest'
import { legalParams, legalValue } from '../../src/utils/legal-identity.util'

const TO_COMPLETE = '[À COMPLÉTER]'

describe('legalParams (F-70)', () => {
  it('fills a required variable, and shows « à compléter » when empty, absent or A_COMPLETER (repeated or not)', () => {
    const legal = { name: 'Asso', address: '', hostName: 'A_COMPLETER', hostAddress: 'A_COMPLETERA_COMPLETER', privacy: { contactEmail: 'rgpd@example.org' } }
    const params = legalParams(legal, TO_COMPLETE)
    expect(params).toMatchObject({ name: 'Asso', address: TO_COMPLETE, hostName: TO_COMPLETE, hostAddress: TO_COMPLETE, phone: TO_COMPLETE, privacyContactEmail: 'rgpd@example.org' })
  })

  it('leaves an optional variable empty, so its row is hidden', () => {
    expect(legalParams({ form: 'A_COMPLETER', capital: '' }, TO_COMPLETE)).toMatchObject({ form: '', capital: '', siren: '', rcs: '', vat: '' })
  })

  it('keeps a numeric value: Nuxt converts NUXT_PUBLIC_LEGAL_CAPITAL=1000 and PRIVACY_FORM_RETENTION_DAYS=365 to numbers', () => {
    expect(legalParams({ capital: 1000, siren: 123456789, privacy: { formRetentionDays: 365 } }, TO_COMPLETE)).toMatchObject({ capital: '1000', siren: '123456789', privacyFormRetentionDays: '365' })
  })

  it('legalValue reads by parameter, placeholder as empty', () => {
    expect(legalValue({ email: ' a@b.fr ' }, 'email')).toBe('a@b.fr')
    expect(legalValue({ email: 'A_COMPLETER' }, 'email')).toBe('')
    expect(legalValue(undefined, 'email')).toBe('')
    expect(legalValue({}, 'unknown')).toBe('')
  })
})

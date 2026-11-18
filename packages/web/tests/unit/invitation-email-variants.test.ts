import { describe, expect, it } from 'vitest'
import { INVITATION_EMAIL_KIND } from '../../src/enums/invitation-email.enum'
import { buildInvitationEmail } from '../../src/utils/invitation-email.util'

const SITE = 'https://ccc.example.org'
const LINK = `${SITE}/invitation/${'A'.repeat(43)}`
const PARTICIPANT_SENTENCE = 'vous a inscrit comme participant'

describe('buildInvitationEmail, variantes (B-31)', () => {
  it('participant variant is unchanged (default kind)', () => {
    const email = buildInvitationEmail({ firstName: 'Jeanne', link: LINK, siteUrl: SITE })
    expect(email.subject).toBe('Votre invitation au CCC')
    expect(email.text).toContain("L'organisateur de la Cotentin Caps Cup vous a inscrit comme participant : un compte vient de vous être créé sur le site du CCC.")
    expect(email.text).toContain(`statistiques :\n\n${LINK}\n\nCe lien est valable 7 jours et ne peut servir qu'une fois.\n\nSi vous n'attendiez pas ce message, ignorez-le.`)
    expect(email.html).toContain(PARTICIPANT_SENTENCE)
    expect(email.html).toContain('Activer mon compte')
    expect(email.html).not.toMatch(/\{\{\w+\}\}/)
    expect(email).toEqual(buildInvitationEmail({ firstName: 'Jeanne', link: LINK, kind: INVITATION_EMAIL_KIND.PARTICIPANT, siteUrl: SITE }))
  })

  it('admin variant carries the validated Q10 subject and sentence, never "participant", and keeps the rest of the template', () => {
    const email = buildInvitationEmail({ firstName: '', link: LINK, kind: INVITATION_EMAIL_KIND.ADMIN, siteUrl: SITE })
    expect(email.subject).toBe('Votre accès administrateur à la Cotentin Caps Cup')
    expect(email.text).toContain("L'organisateur de la Cotentin Caps Cup vous a donné un accès administrateur : un compte vient de vous être créé sur le site du CCC.")
    expect(email.html).toContain('vous a donné un accès administrateur&nbsp;: un compte vient de vous être créé sur le site du CCC.')
    expect(`${email.subject}${email.text}${email.html}`.toLowerCase()).not.toContain('participant')
    expect(email.text).toContain(`statistiques :\n\n${LINK}\n\nCe lien est valable 7 jours`)
    expect(email.html).toContain(`<a class="cta" href="${LINK}"`)
    expect(email.html).toContain('7&nbsp;jours')
    expect(email.html).not.toMatch(/\{\{\w+\}\}/)
    expect(email.text).not.toMatch(/\{\{\w+\}\}/)
  })

  it('promotion mail is information only: no link, no button, no validity, no site link in the body', () => {
    const email = buildInvitationEmail({ firstName: 'Jeanne', kind: INVITATION_EMAIL_KIND.ADMIN_PROMOTED, siteUrl: SITE })
    expect(email.subject).toBe('Vous êtes maintenant administrateur de la Cotentin Caps Cup')
    expect(email.text.startsWith('Bonjour Jeanne,')).toBe(true)
    expect(email.text).not.toContain('/invitation/')
    expect(email.text).not.toContain('Ce lien')
    expect(email.html).not.toContain('/invitation/')
    expect(email.html).not.toContain('class="cta"')
    expect(email.html).not.toContain('Activer mon compte')
    expect(email.html).not.toContain('jours')
    expect(email.html).not.toMatch(/\{\{\w+\}\}/)
    expect(email.text).not.toMatch(/\{\{\w+\}\}/)
  })

  it('refuses to build a link variant without a link', () => {
    expect(() => buildInvitationEmail({ firstName: 'Jeanne', kind: INVITATION_EMAIL_KIND.ADMIN, siteUrl: SITE })).toThrow(/needs a link/)
  })
})

import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createTransport } from 'nodemailer'
import { describe, expect, it } from 'vitest'
import { createCaptureMailAdapter, createMailPort, createSmtpMailAdapter } from '../../src/services/mail.service'
import type { IMailConfig } from '../../src/interfaces/mail.interface'
import { buildInvitationLink, resolveSiteOrigin } from '../../src/utils/invitation-link.util'
import { buildInvitationEmail, escapeHtml } from '../../src/utils/invitation-email.util'

const CONFIG: IMailConfig = { transport: 'smtp', host: 'smtp.example.test', port: 1025, secure: false, user: '', password: '', from: 'CCC <no-reply@example.test>', captureFile: '' }
const TOKEN = 'A'.repeat(43)

describe('buildInvitationLink', () => {
  it('builds <origin>/invitation/<token> from the configured site URL', () => {
    expect(buildInvitationLink('https://ccc.example.org', TOKEN)).toBe(`https://ccc.example.org/invitation/${TOKEN}`)
    expect(buildInvitationLink('https://ccc.example.org/ignored/path?x=1', TOKEN)).toBe(`https://ccc.example.org/invitation/${TOKEN}`)
  })

  it.each(['', 'not a url', 'javascript:alert(1)', 'ftp://example.org'])('rejects %j as a site URL', (siteUrl) => {
    expect(() => resolveSiteOrigin(siteUrl)).toThrow(/siteUrl/)
  })
})

describe('buildInvitationEmail', () => {
  it('carries the link and the 7-day validity in text and html', () => {
    const email = buildInvitationEmail({ firstName: 'Jeanne', link: `https://ccc.example.org/invitation/${TOKEN}` })
    expect(email.text).toContain(`https://ccc.example.org/invitation/${TOKEN}`)
    expect(email.text).toContain('7 jours')
    expect(email.html).toContain(`href="https://ccc.example.org/invitation/${TOKEN}"`)
    expect(email.text.startsWith('Bonjour Jeanne,')).toBe(true)
  })

  it('escapes the first name in the html body', () => {
    const email = buildInvitationEmail({ firstName: '<script>alert(1)</script>', link: 'https://ccc.example.org/invitation/x' })
    expect(email.html).not.toContain('<script>')
    expect(escapeHtml('a&b"c')).toBe('a&amp;b&quot;c')
  })
})

describe('mail adapters', () => {
  it('smtp adapter hands the message to nodemailer with the configured sender', async () => {
    const transporter = createTransport({ jsonTransport: true })
    const sent: Array<Record<string, unknown>> = []
    const send = transporter.sendMail.bind(transporter)
    transporter.sendMail = (async (options: Parameters<typeof send>[0]) => {
      sent.push(options as Record<string, unknown>)
      return send(options)
    }) as typeof transporter.sendMail
    await createSmtpMailAdapter(CONFIG, transporter).send({ to: 'a@ccc.test', subject: 'S', text: 'T', html: '<p>T</p>' })
    expect(sent).toEqual([{ from: CONFIG.from, to: 'a@ccc.test', subject: 'S', text: 'T', html: '<p>T</p>' }])
  })

  it('smtp adapter rejects when the server is unreachable', async () => {
    await expect(
      createSmtpMailAdapter({ ...CONFIG, host: '127.0.0.1', port: 1 }).send({ to: 'a@ccc.test', subject: 'S', text: 'T', html: 'T' })
    ).rejects.toThrow()
  })

  it('capture adapter appends one JSON line per message', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'ccc-mail-'))
    try {
      const file = join(directory, 'mails.jsonl')
      const adapter = createCaptureMailAdapter(file)
      await adapter.send({ to: 'a@ccc.test', subject: 'S1', text: 'T', html: 'T' })
      await adapter.send({ to: 'b@ccc.test', subject: 'S2', text: 'T', html: 'T' })
      const lines = (await readFile(file, 'utf8')).trim().split('\n').map((line) => JSON.parse(line) as { to: string })
      expect(lines.map((line) => line.to)).toEqual(['a@ccc.test', 'b@ccc.test'])
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  })
})

describe('createMailPort', () => {
  it('refuses an incoherent configuration', () => {
    expect(() => createMailPort({ ...CONFIG, transport: 'capture' })).toThrow(/captureFile/)
    expect(() => createMailPort({ ...CONFIG, transport: 'pigeon' })).toThrow(/Unknown mail.transport/)
    expect(() => createMailPort({ ...CONFIG, host: '' })).toThrow(/mail.host/)
  })

  it('builds the smtp and capture adapters', () => {
    expect(createMailPort(CONFIG).send).toBeTypeOf('function')
    expect(createMailPort({ ...CONFIG, transport: 'capture', captureFile: '/tmp/x' }).send).toBeTypeOf('function')
  })
})

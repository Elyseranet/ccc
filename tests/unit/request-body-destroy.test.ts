import { createServer } from 'node:http'
import type { IncomingMessage, Server } from 'node:http'
import { connect } from 'node:net'
import type { AddressInfo } from 'node:net'
import { once } from 'node:events'
import { createApp, defineEventHandler, toNodeListener } from 'h3'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { REQUEST_BODY_DRAIN_GRACE_MS } from '../../src/consts/request.const'
import { readRequestBody } from '../../src/utils/request-body.util'

/*********************************************************
 * T-SEC-09 (L6) et T-SEC-15 : après le délai N3
 *
 * @description
 * Un vrai serveur h3 en local. Le client continue d'écrire bien après le délai, sans jamais finir le corps. Garanties :
 * 1. le client reçoit le 408 COMPLET, avant toute erreur de socket (T-SEC-15 : fermer une socket qui a des octets non lus
 *    envoie un RST qui pouvait faire perdre le 408) ;
 * 2. une erreur de socket APRÈS la réponse (RST à l'écriture sur une connexion fermée) n'est pas un échec : le client a sa réponse ;
 * 3. la lecture après le délai est bornée : au plus `maxBytes` octets sont lus et jetés, puis la requête est détruite.
 * Marges larges (délais de 300 à 400 ms) : aucune assertion ne dépend d'un chronométrage serré.
 ********************************************************/
const DEADLINE_MS = 400
const BOUND_DEADLINE_MS = 300
const BOUND_MAX_BYTES = 16 * 1024

let server: Server
let port: number
const captured: Record<string, IncomingMessage | undefined> = {}
let holdStartedAt = 0

beforeAll(async () => {
  const app = createApp()
  app.use('/raw', defineEventHandler(async (event) => {
    captured.raw = event.node.req
    const body = await readRequestBody(event, { maxBytes: 10 * 1024 * 1024, timeoutMs: DEADLINE_MS })
    return { length: body.length }
  }))
  app.use('/bound', defineEventHandler(async (event) => {
    captured.bound = event.node.req
    const body = await readRequestBody(event, { maxBytes: BOUND_MAX_BYTES, timeoutMs: BOUND_DEADLINE_MS })
    return { length: body.length }
  }))
  // La réponse n'est jamais écrite : seule la borne de durée de vidange peut détruire la requête.
  app.use('/hold', defineEventHandler(async (event) => {
    captured.hold = event.node.req
    holdStartedAt = Date.now()
    try {
      await readRequestBody(event, { maxBytes: 10 * 1024 * 1024, timeoutMs: BOUND_DEADLINE_MS })
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 10_000))
    }
    return null
  }))
  server = createServer(toNodeListener(app))
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  port = (server.address() as AddressInfo).port
})

afterAll(async () => {
  server.closeAllConnections()
  await new Promise((resolve) => server.close(resolve))
})

interface IClientResult { raw: string, errorBeforeResponse: boolean, errorAfterResponse: boolean }

/** Statut et complétude d'une réponse HTTP brute (en-têtes reçus et `Content-Length` octets de corps reçus). */
const parseResponse = (raw: string): { status: number, complete: boolean } => {
  const separator = raw.indexOf('\r\n\r\n')
  if (separator === -1) {
    return { status: Number.NaN, complete: false }
  }
  const length = Number(/content-length: (\d+)/i.exec(raw.slice(0, separator))?.[1])
  return { status: Number(/^HTTP\/1\.1 (\d{3})/.exec(raw)?.[1]), complete: Number.isFinite(length) && raw.length - separator - 4 >= length }
}

/** Écrit sans fin (`piece` toutes les `gapMs`, plus `burstAfterMs` : un gros envoi tardif) et lit la réponse brute jusqu'à la fermeture. */
const slowClient = (path: string, piece: string, gapMs: number, burst?: { afterMs: number, bytes: number }): Promise<IClientResult> =>
  new Promise((resolve) => {
    const socket = connect(port, '127.0.0.1')
    const state: IClientResult = { raw: '', errorBeforeResponse: false, errorAfterResponse: false }
    socket.setEncoding('utf8')
    socket.on('data', (data: string) => { state.raw += data })
    // Une erreur de socket n'est pas un échec en soi : ce qui compte est de savoir si la réponse était déjà complète.
    socket.on('error', () => {
      if (parseResponse(state.raw).complete) {
        state.errorAfterResponse = true
      } else {
        state.errorBeforeResponse = true
      }
    })
    socket.on('close', () => {
      clearInterval(sender)
      clearTimeout(burstTimer)
      resolve(state)
    })
    socket.write(`POST ${path} HTTP/1.1\r\nHost: x\r\nConnection: close\r\nContent-Type: application/json\r\nContent-Length: 50000000\r\n\r\n`)
    const sender = setInterval(() => { if (!socket.destroyed) { socket.write(piece) } }, gapMs)
    const burstTimer = setTimeout(() => { if (burst && !socket.destroyed) { socket.write('y'.repeat(burst.bytes)) } }, burst?.afterMs ?? 0)
  })

describe('readRequestBody after the deadline (L6, T-SEC-15)', () => {
  it('the client receives the complete 408 before any socket error, and the request ends up destroyed', async () => {
    const result = await slowClient('/raw', 'x'.repeat(1024), 50)

    expect(parseResponse(result.raw)).toEqual({ status: 408, complete: true })
    expect(result.raw.toLowerCase()).toContain('connection: close')
    expect(result.errorBeforeResponse).toBe(false)

    const request = captured.raw!
    if (!request.destroyed) {
      await once(request, 'close')
    }
    expect(request.destroyed).toBe(true)
    // Plus aucun octet n'est consommé une fois le flux détruit.
    const bytesRead = request.socket.bytesRead
    await new Promise((resolve) => setTimeout(resolve, 300))
    expect(request.socket.bytesRead).toBe(bytesRead)
  })

  it('reads and discards at most maxBytes after the deadline, then destroys the request', async () => {
    // Un petit envoi avant le délai (pas de 413), puis un gros envoi (1 Mio) bien après.
    const result = await slowClient('/bound', 'x'.repeat(256), 100, { afterMs: BOUND_DEADLINE_MS + 200, bytes: 1024 * 1024 })

    expect(parseResponse(result.raw)).toEqual({ status: 408, complete: true })
    expect(result.errorBeforeResponse).toBe(false)
    const request = captured.bound!
    if (!request.destroyed) {
      await once(request, 'close')
    }
    expect(request.destroyed).toBe(true)
    // Le plafond de 16 Kio, plus un morceau de lecture de Node (64 Kio) et ce qui précède le délai : très en deçà de 1 Mio.
    expect(request.socket.bytesRead).toBeLessThan(256 * 1024)
  })

  it('destroys the request within the drain grace even when the client keeps sending slowly and the response is not written', async () => {
    const socket = connect(port, '127.0.0.1')
    socket.on('error', () => undefined)
    socket.write('POST /hold HTTP/1.1\r\nHost: x\r\nContent-Type: application/json\r\nContent-Length: 50000000\r\n\r\n')
    const sender = setInterval(() => { if (!socket.destroyed) { socket.write('x') } }, 100)
    try {
      await new Promise((resolve) => setTimeout(resolve, 100))
      const request = captured.hold!
      if (!request.destroyed) {
        await once(request, 'close')
      }
      const elapsed = Date.now() - holdStartedAt
      expect(request.destroyed).toBe(true)
      // Délai de lecture + délai de grâce, plus une large marge ; très en deçà des 10 s de la réponse retenue.
      expect(elapsed).toBeGreaterThanOrEqual(BOUND_DEADLINE_MS + REQUEST_BODY_DRAIN_GRACE_MS - 200)
      expect(elapsed).toBeLessThan(BOUND_DEADLINE_MS + REQUEST_BODY_DRAIN_GRACE_MS + 4000)
    } finally {
      clearInterval(sender)
      socket.destroy()
    }
  }, 15000)
})

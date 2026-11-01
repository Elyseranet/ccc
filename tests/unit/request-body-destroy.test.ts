import { createServer } from 'node:http'
import type { IncomingMessage, Server } from 'node:http'
import { connect } from 'node:net'
import type { AddressInfo } from 'node:net'
import { once } from 'node:events'
import { createApp, defineEventHandler, toNodeListener } from 'h3'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { readRequestBody } from '../../src/utils/request-body.util'

/*********************************************************
 * T-SEC-09 (L6) : après le délai N3, le flux de la requête est détruit
 *
 * @description
 * Un vrai serveur h3 en local. Le client envoie des octets en continu bien au-delà du délai, sans finir le corps.
 * Marges larges (délai de 400 ms, écoute de 300 ms) : aucune assertion ne dépend d'un chronométrage serré.
 ********************************************************/
const DEADLINE_MS = 400

let server: Server
let port: number
let captured: IncomingMessage | undefined

beforeAll(async () => {
  const app = createApp()
  app.use('/raw', defineEventHandler(async (event) => {
    captured = event.node.req
    const body = await readRequestBody(event, { maxBytes: 10 * 1024 * 1024, timeoutMs: DEADLINE_MS })
    return { length: body.length }
  }))
  server = createServer(toNodeListener(app))
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  port = (server.address() as AddressInfo).port
})

afterAll(async () => {
  server.closeAllConnections()
  await new Promise((resolve) => server.close(resolve))
})

describe('readRequestBody after the deadline (L6)', () => {
  it('answers 408 first, then destroys the request stream and stops reading the body', async () => {
    const socket = connect(port, '127.0.0.1')
    let raw = ''
    socket.setEncoding('utf8')
    socket.on('data', (data: string) => { raw += data })
    socket.on('error', () => undefined)
    const closed = once(socket, 'close')
    socket.write(`POST /raw HTTP/1.1\r\nHost: x\r\nConnection: close\r\nContent-Type: application/json\r\nContent-Length: 5000000\r\n\r\n`)
    // Le client continue d'envoyer du contenu bien après le délai, sans jamais finir le corps.
    const sender = setInterval(() => { if (!socket.destroyed) { socket.write('x'.repeat(1024)) } }, 50)

    try {
      await closed
    } finally {
      clearInterval(sender)
    }

    expect(Number(/^HTTP\/1\.1 (\d{3})/.exec(raw)?.[1])).toBe(408)
    expect(captured).toBeDefined()
    const request = captured!
    if (!request.destroyed) {
      await once(request, 'close')
    }
    expect(request.destroyed).toBe(true)
    // Plus aucun octet n'est consommé une fois le flux détruit.
    const bytesRead = request.socket.bytesRead
    await new Promise((resolve) => setTimeout(resolve, 300))
    expect(request.socket.bytesRead).toBe(bytesRead)
  })
})

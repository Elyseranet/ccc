import { createServer } from 'node:http'
import type { Server } from 'node:http'
import { connect } from 'node:net'
import type { AddressInfo } from 'node:net'
import { createApp, defineEventHandler, toNodeListener } from 'h3'
import { z } from 'zod'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

/*********************************************************
 * Marges (T-QA-05)
 *
 * Le test envoie de vrais octets sur une vraie socket, avec de vrais délais : un ordonnancement retardé de quelques
 * centaines de millisecondes (machine chargée) ne doit pas faire basculer un résultat. Chaque cas garde donc un écart d'au moins
 * un ordre de grandeur entre le délai de lecture (`*_DEADLINE_MS`) et ce qui doit le dépasser ou rester en dessous :
 * - « corps à temps » : livré en ~20 ms pour un délai de 1,5 s, il faudrait un blocage de la boucle de plus de 1,4 s pour le couper ;
 * - « trop lent » et « délai total » : le corps complet demanderait 4 à 8 s, soit plus de 4 fois le délai ;
 * - chaque écart entre morceaux reste inférieur au délai (un délai d'inactivité ne se déclencherait jamais).
 ********************************************************/
const TEST_TIMEOUT_MS = 1500
const RAW_DEADLINE_MS = 1000

vi.mock('../../src/consts/request.const', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../src/consts/request.const')>()),
  API_BODY_READ_TIMEOUT_MS: TEST_TIMEOUT_MS
}))

const { readBodyWithSchema } = await import('../../src/utils/validation.util')
const { readRequestBody } = await import('../../src/utils/request-body.util')

const schema = z.object({ name: z.string() })

let server: Server
let port: number

beforeAll(async () => {
  const app = createApp()
  app.use('/json', defineEventHandler(async (event) => readBodyWithSchema(event, schema)))
  app.use('/raw', defineEventHandler(async (event) => {
    const body = await readRequestBody(event, { maxBytes: 64, timeoutMs: RAW_DEADLINE_MS })
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

interface IRawResult { status: number, headers: string, body: string, closedByServer: boolean, elapsedMs: number }

/** Envoie une requête HTTP morceau par morceau (délai entre morceaux) et lit la réponse brute. */
const sendSlowly = (path: string, declaredLength: number, pieces: string[], gapMs: number, clientClose = true): Promise<IRawResult> =>
  new Promise((resolve, reject) => {
    const startedAt = Date.now()
    const socket = connect(port, '127.0.0.1')
    let raw = ''
    let writing = true
    socket.setEncoding('utf8')
    socket.on('data', (data: string) => { raw += data })
    // Le serveur ferme la socket après sa réponse (408/413) alors que le client écrit encore : le système peut alors renvoyer un
    // ECONNRESET. Si la réponse est déjà arrivée, ce n'est pas un échec du test, et 'close' résout juste après.
    socket.on('error', (error) => {
      if (raw === '') {
        reject(error)
      }
    })
    socket.on('close', () => {
      writing = false
      const [headers = '', ...rest] = raw.split('\r\n\r\n')
      resolve({
        status: Number(/^HTTP\/1\.1 (\d{3})/.exec(headers)?.[1]),
        headers,
        body: rest.join('\r\n\r\n'),
        closedByServer: true,
        elapsedMs: Date.now() - startedAt
      })
    })
    socket.write(`POST ${path} HTTP/1.1\r\nHost: x\r\n${clientClose ? 'Connection: close\r\n' : ''}Content-Type: application/json\r\nContent-Length: ${declaredLength}\r\n\r\n`)
    let index = 0
    const next = () => {
      if (!writing || index >= pieces.length) {
        return
      }
      socket.write(pieces[index]!)
      index += 1
      setTimeout(next, gapMs)
    }
    next()
  })

describe('N3: request body read deadline', () => {
  it('a body sent slower than the deadline is cut with 408 REQUEST_TIMEOUT and the connection is closed', async () => {
    const json = '{"name":"slowloris"}'
    // 1 octet toutes les 400 ms : le corps complet demanderait ~8 s, plus de 5 fois le délai de 1,5 s.
    const result = await sendSlowly('/json', json.length, json.split(''), 400, false)
    expect(result.status).toBe(408)
    expect(JSON.parse(result.body)).toMatchObject({ statusCode: 408 })
    expect(result.headers.toLowerCase()).toContain('connection: close')
    expect(result.closedByServer).toBe(true)
    expect(result.elapsedMs).toBeGreaterThanOrEqual(TEST_TIMEOUT_MS - 100)
    expect(result.elapsedMs).toBeLessThan(6000)
  })

  it('the deadline is total, not idle: a steady trickle does not extend it', async () => {
    // 1 octet toutes les 100 ms (chaque écart ≪ délai de 1 s, donc jamais « inactif ») : 40 octets prendraient 4 s.
    const result = await sendSlowly('/raw', 40, 'x'.repeat(40).split(''), 100)
    expect(result.status).toBe(408)
    expect(result.elapsedMs).toBeGreaterThanOrEqual(RAW_DEADLINE_MS - 100)
    expect(result.elapsedMs).toBeLessThan(3500)
  })

  it('a body delivered in time is accepted', async () => {
    const json = '{"name":"fast"}'
    const result = await sendSlowly('/json', json.length, [json.slice(0, 5), json.slice(5)], 20)
    expect(result.status).toBe(200)
    expect(JSON.parse(result.body)).toEqual({ name: 'fast' })
  })

  it('still answers 413 when the size cap is exceeded before the deadline', async () => {
    const result = await sendSlowly('/raw', 100, ['y'.repeat(100)], 10)
    expect(result.status).toBe(413)
  })
})

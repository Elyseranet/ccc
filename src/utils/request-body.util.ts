import { setResponseHeader } from 'h3'
import type { H3Event } from 'h3'
import { REQUEST_BODY_DRAIN_GRACE_MS } from '../consts/request.const.js'
import type { IReadRequestBodyOptions } from '../interfaces/request-body.interface.js'
import { payloadTooLarge, requestTimeout } from './api-error.util.js'

/**
 * Lit le corps brut en flux avec un plafond de taille (413) ET un délai total (408, N3).
 * Point d'entrée unique pour les corps JSON (`readBoundedJsonBody`) et le multipart (B-16).
 *
 * Après le délai (T-SEC-09 L6, corrigé par T-SEC-15) : la réponse 408 porte `Connection: close`, et la lecture CONTINUE,
 * mais les octets sont jetés sans être conservés ni traités, au plus `maxBytes` octets et au plus `REQUEST_BODY_DRAIN_GRACE_MS`
 * millisecondes ; au premier des deux seuils, la requête est détruite. Pourquoi :
 * Node ferme la socket dès que la réponse est écrite, et fermer une socket qui a encore des octets non lus dans son tampon
 * de réception envoie un RST au lieu d'un FIN, ce qui peut faire perdre au client le 408 encore en transit. En vidant le
 * tampon pendant que la réponse part, la fermeture est ordinaire. Un client qui continue d'écrire après la fermeture
 * reçoit un RST, mais après avoir reçu le 408. L'écart avec L6 (« plus aucun octet lu ») est donc borné : au plus `maxBytes`
 * octets lus puis jetés, pendant au plus `REQUEST_BODY_DRAIN_GRACE_MS`, sans aucun traitement.
 */
export const readRequestBody = async (event: H3Event, { maxBytes, timeoutMs }: IReadRequestBodyOptions): Promise<Buffer> => {
  const { req, res } = event.node
  const chunks: Buffer[] = []
  let received = 0
  let discarded = 0
  let timedOut = false
  let timer: NodeJS.Timeout | undefined

  const read = (async () => {
    for await (const chunk of req) {
      const buffer = Buffer.from(chunk as Uint8Array)
      if (timedOut) {
        discarded += buffer.length
        if (discarded > maxBytes) {
          req.destroy()
          return
        }
        continue
      }
      received += buffer.length
      if (received > maxBytes) {
        throw payloadTooLarge()
      }
      chunks.push(buffer)
    }
  })()
  // Si le délai gagne la course, la lecture continue (octets jetés) et peut échouer plus tard (socket fermée) : sans effet.
  read.catch(() => undefined)

  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      timedOut = true
      setResponseHeader(event, 'Connection', 'close')
      // Borne de durée : un client lent ne tient pas la connexion en continuant d'écrire après le 408.
      const grace = setTimeout(() => req.destroy(), REQUEST_BODY_DRAIN_GRACE_MS)
      res.once('close', () => {
        clearTimeout(grace)
        req.destroy()
      })
      reject(requestTimeout())
    }, timeoutMs)
  })

  try {
    await Promise.race([read, deadline])
  } finally {
    clearTimeout(timer)
  }
  return Buffer.concat(chunks)
}

import { setResponseHeader } from 'h3'
import type { H3Event } from 'h3'
import type { IReadRequestBodyOptions } from '../interfaces/request-body.interface.js'
import { payloadTooLarge, requestTimeout } from './api-error.util.js'

/**
 * T-SEC-09 (L6) : après le délai, plus aucun octet n'est lu. Le flux est mis en pause tout de suite (plus de lecture,
 * la contre-pression retient le client), puis détruit dès que la réponse 408 est écrite : détruire la requête
 * ferme la socket, et le faire avant l'écriture ferait perdre le 408.
 */
const stopReading = (event: H3Event): void => {
  const { req, res } = event.node
  req.pause()
  if (res.writableFinished) {
    req.destroy()
  } else {
    res.once('finish', () => req.destroy())
    res.once('close', () => req.destroy())
  }
}

/**
 * Lit le corps brut en flux avec un plafond de taille (413) ET un délai total (408, N3).
 * Point d'entrée unique pour les corps JSON (`readBoundedJsonBody`) et le multipart (B-16).
 * Sur délai, la réponse porte `Connection: close` : Node ferme la socket une fois la réponse écrite,
 * ce qui coupe le client lent sans détruire la socket avant le 408.
 */
export const readRequestBody = async (event: H3Event, { maxBytes, timeoutMs }: IReadRequestBodyOptions): Promise<Buffer> => {
  const chunks: Buffer[] = []
  let received = 0
  let timer: NodeJS.Timeout | undefined

  const read = (async () => {
    for await (const chunk of event.node.req) {
      const buffer = Buffer.from(chunk as Uint8Array)
      received += buffer.length
      if (received > maxBytes) {
        throw payloadTooLarge()
      }
      chunks.push(buffer)
    }
  })()
  // Si le délai gagne la course, la lecture abandonnée peut échouer plus tard (socket fermée) : sans effet.
  read.catch(() => undefined)

  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      setResponseHeader(event, 'Connection', 'close')
      stopReading(event)
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

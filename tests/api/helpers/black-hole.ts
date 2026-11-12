import { createServer } from 'node:net'
import type { Socket } from 'node:net'

/**
 * Serveur TCP qui accepte la connexion et ne répond jamais : une base « lente » (T-SEC-17).
 * `close` détruit d'abord les connexions ouvertes : `server.close()` les attendrait, et le serveur Nuxt de test garde la sienne
 * tant qu'il tourne (l'afterAll du test passe avant l'arrêt du serveur).
 */
export const startBlackHole = async (): Promise<{ port: number, close: () => Promise<void> }> => {
  const sockets = new Set<Socket>()
  const server = createServer((socket) => { sockets.add(socket) })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  return {
    port: (server.address() as { port: number }).port,
    close: async () => {
      sockets.forEach((socket) => socket.destroy())
      await new Promise<void>((resolve) => server.close(() => resolve()))
    }
  }
}

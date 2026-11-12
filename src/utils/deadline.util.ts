/** Délai global dépassé. Aucun détail : le message ne sort jamais dans une réponse. */
export class DeadlineExceededError extends Error {
  constructor () {
    super('Deadline exceeded')
    this.name = 'DeadlineExceededError'
  }
}

/**
 * Borne une promesse par un délai global. Si le délai gagne, la promesse perdante continue en arrière-plan : son rejet
 * éventuel est absorbé ici, pour ne jamais devenir un `unhandledRejection`. Le minuteur est toujours libéré.
 */
export const withDeadline = <T>(promise: Promise<T>, milliseconds: number): Promise<T> => {
  let timer: ReturnType<typeof setTimeout> | undefined
  const deadline = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => reject(new DeadlineExceededError()), milliseconds)
  })
  // Le rejet de la perdante (si elle perd) est gardé ici ; la gagnante rend sa valeur ou son erreur à l'appelant.
  promise.catch(() => undefined)
  return Promise.race([promise, deadline]).finally(() => clearTimeout(timer))
}

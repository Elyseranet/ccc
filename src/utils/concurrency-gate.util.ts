/**
 * Sémaphore sans file d'attente : au plus `limit` tâches en cours, les suivantes sont refusées tout de suite
 * (l'appelant répond 503) au lieu de s'empiler et de garder des requêtes ouvertes.
 */
export class ConcurrencyGate {
  private active = 0

  constructor(private limit: number) {
    ConcurrencyGate.assertLimit(limit)
  }

  private static assertLimit(limit: number): void {
    if (!Number.isInteger(limit) || limit < 1) {
      throw new RangeError('ConcurrencyGate limit must be a positive integer')
    }
  }

  get activeCount(): number {
    return this.active
  }

  hasCapacity(): boolean {
    return this.active < this.limit
  }

  setLimit(limit: number): void {
    ConcurrencyGate.assertLimit(limit)
    this.limit = limit
  }

  /** Renvoie `{ ran: false }` si le sémaphore est plein ; sinon le résultat de `task`. La place est libérée dans tous les cas. */
  async tryRun<T>(task: () => Promise<T>): Promise<{ ran: true, value: T } | { ran: false }> {
    if (!this.hasCapacity()) {
      return { ran: false }
    }
    this.active += 1
    try {
      return { ran: true, value: await task() }
    } finally {
      this.active -= 1
    }
  }
}

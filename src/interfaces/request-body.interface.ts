export interface IReadRequestBodyOptions {
  /** Plafond en octets : 413 dès qu'il est dépassé. */
  maxBytes: number
  /** Durée totale de lecture en millisecondes : 408 au-delà. */
  timeoutMs: number
}

export interface IRateLimitOptions {
  windowMs: number
  maxRequests: number
}

export interface IRateLimitResult {
  allowed: boolean
  remaining: number
  retryAfterMs: number
}

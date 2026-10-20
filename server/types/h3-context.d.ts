import type { IAuthUser } from '../interfaces/auth.interface'

declare module 'h3' {
  interface H3EventContext {
    requestId?: string
    requestStartedAt?: number
    user?: IAuthUser
  }
}

export {}

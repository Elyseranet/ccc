import type { LOG_LEVEL } from '../enums/log-level.enum.js'

export interface ILogFields {
  requestId?: string
  route?: string
  durationMs?: number
  [key: string]: unknown
}

export interface ILogEntry extends ILogFields {
  event: string
  level: LOG_LEVEL
  timestamp: string
}

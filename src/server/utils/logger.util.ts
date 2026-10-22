import { LOG_LEVEL } from '../../enums/log-level.enum'
import type { TLogSink } from '../../types/log-sink.type'
import type { ILogEntry, ILogFields } from '../../interfaces/log-entry.interface'

const stdoutSink: TLogSink = (line) => {
  process.stdout.write(`${line}\n`)
}

export const createLogger = (sink: TLogSink = stdoutSink, now: () => Date = () => new Date()) => {
  const write = (level: LOG_LEVEL, event: string, fields: ILogFields = {}): void => {
    const entry: ILogEntry = { ...fields, event, level, timestamp: now().toISOString() }
    sink(JSON.stringify(entry))
  }

  return {
    debug: (event: string, fields?: ILogFields) => write(LOG_LEVEL.DEBUG, event, fields),
    info: (event: string, fields?: ILogFields) => write(LOG_LEVEL.INFO, event, fields),
    warn: (event: string, fields?: ILogFields) => write(LOG_LEVEL.WARN, event, fields),
    error: (event: string, fields?: ILogFields) => write(LOG_LEVEL.ERROR, event, fields)
  }
}

export const logger = createLogger()

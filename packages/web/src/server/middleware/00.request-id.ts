import { randomUUID } from 'node:crypto'
import { REQUEST_ID_HEADER, REQUEST_ID_PATTERN } from '../../consts/request.const'

export default defineEventHandler((event) => {
  const incoming = getRequestHeader(event, REQUEST_ID_HEADER)
  const requestId = incoming && REQUEST_ID_PATTERN.test(incoming) ? incoming : randomUUID()

  event.context.requestId = requestId
  event.context.requestStartedAt = Date.now()
  setResponseHeader(event, REQUEST_ID_HEADER, requestId)
})

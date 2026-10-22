import type { H3Event } from 'h3'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AVATAR_UPLOAD_TIMEOUT_MS } from '../../src/consts/avatar.const'
import { readAvatarUpload } from '../../src/utils/avatar-upload.util'
import { API_ERROR_CODE } from '../../src/enums/api-error-code.enum'
import { fileUpload, makePng } from '../helpers/avatar-fixtures'

const eventWith = (headers: Record<string, string>, body: AsyncIterable<Uint8Array>): H3Event =>
  ({
    node: {
      req: Object.assign({ headers }, { [Symbol.asyncIterator]: () => body[Symbol.asyncIterator]() }),
      res: { setHeader: () => undefined }
    }
  }) as unknown as H3Event

async function* once(buffer: Buffer): AsyncGenerator<Uint8Array> {
  yield buffer
}

afterEach(() => {
  vi.useRealTimers()
})

describe('readAvatarUpload', () => {
  it('returns the bytes of the single file part', async () => {
    const png = await makePng()
    const { body, contentType } = fileUpload(png, 'a.png', 'image/png')
    const bytes = await readAvatarUpload(eventWith({ 'content-type': contentType }, once(body)))
    expect(bytes.equals(png)).toBe(true)
  })

  it('answers 408 REQUEST_TIMEOUT when the body is not complete within the read deadline (slow client)', async () => {
    vi.useFakeTimers()
    const stalled: AsyncIterable<Uint8Array> = { [Symbol.asyncIterator]: () => ({ next: () => new Promise<never>(() => undefined) }) }
    const pending = readAvatarUpload(eventWith({ 'content-type': 'multipart/form-data; boundary=x' }, stalled))
    const assertion = expect(pending).rejects.toMatchObject({ statusCode: 408, data: { code: API_ERROR_CODE.REQUEST_TIMEOUT } })
    await vi.advanceTimersByTimeAsync(AVATAR_UPLOAD_TIMEOUT_MS + 1)
    await assertion
  })

  it('stops pulling the stream once the cap is crossed', async () => {
    let pulled = 0
    async function* endless(): AsyncGenerator<Uint8Array> {
      for (;;) {
        pulled += 1
        yield Buffer.alloc(64 * 1024)
      }
    }
    await expect(readAvatarUpload(eventWith({ 'content-type': 'multipart/form-data; boundary=x' }, endless())))
      .rejects.toMatchObject({ statusCode: 413, data: { code: API_ERROR_CODE.AVATAR_TOO_LARGE } })
    expect(pulled).toBeLessThanOrEqual(34) // 2 MiB + 16 KiB, par morceaux de 64 KiB
  })
})

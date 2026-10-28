import { request } from 'node:http'
import { fileURLToPath } from 'node:url'
import { fetch, setup, url } from '@nuxt/test-utils/e2e'
import sharp from 'sharp'
import { afterAll, describe, expect, it } from 'vitest'
import type { DataSource } from 'typeorm'
import { AVATAR_MAX_BYTES, AVATAR_MULTIPART_OVERHEAD_BYTES } from '../../src/consts/avatar.const'
import { API_ERROR_CODE } from '../../src/enums/api-error-code.enum'
import { USER_ROLE } from '../../src/enums/user.enum'
import { EDITION_ORIGIN, EDITION_STATUS } from '../../src/enums/edition.enum'
import type { IEditionParticipant } from '../../src/interfaces/edition.interface'
import { EditionEntity } from '../../src/server/db/typeorm/entities/edition.entity'
import { ParticipationEntity } from '../../src/server/db/typeorm/entities/participation.entity'
import { buildMultipart, fileUpload, makeGif, makeJpegWithGps, makePng, makeWebp } from '../helpers/avatar-fixtures'
import { cookieHeaderOf, getWith, login, resetTestDatabase, seedUser } from './helpers/auth-fixtures'
import { API_TEST_SETUP_TIMEOUT_MS } from './helpers/nuxt-setup'
import { requireTestDatabaseEnv } from './helpers/test-database'

const PASSWORD = 'a-long-enough-password'
const AVATAR_URL_PATTERN = /^\/api\/v1\/competiteurs\/[0-9a-f-]{36}\/avatar\?v=[0-9a-f]{16}$/
const NOT_FOUND_UUID = '00000000-0000-4000-8000-000000000000'

describe('avatar upload (B-16)', async () => {
  const env = requireTestDatabaseEnv()
  const dataSource: DataSource = await resetTestDatabase()
  const alice = await seedUser(dataSource, { email: 'alice@ccc.test', password: PASSWORD, role: USER_ROLE.PARTICIPANT, withCompetitor: true })
  const bob = await seedUser(dataSource, { email: 'bob@ccc.test', password: PASSWORD, role: USER_ROLE.PARTICIPANT, withCompetitor: true })
  const admin = await seedUser(dataSource, { email: 'admin@ccc.test', password: PASSWORD, role: USER_ROLE.ADMIN })

  await setup({
    rootDir: fileURLToPath(new URL('../..', import.meta.url)),
    setupTimeout: API_TEST_SETUP_TIMEOUT_MS,
    server: true,
    env: { ...env, NUXT_AUTH_LOGIN_RATE_LIMIT_MAX_IP_ATTEMPTS: '1000', NUXT_RATE_LIMIT_AVATAR_UPLOAD_MAX_REQUESTS: '1000' }
  })

  afterAll(async () => {
    if (dataSource.isInitialized) {
      await dataSource.destroy()
    }
  })

  const cookieOf = async (user: { email: string }): Promise<string> => cookieHeaderOf(await login(user.email, PASSWORD))

  const put = (path: string, upload: { body: Buffer, contentType: string }, cookie?: string): Promise<Response> =>
    fetch(path, {
      method: 'PUT',
      headers: { 'Content-Type': upload.contentType, ...(cookie ? { Cookie: cookie } : {}) },
      body: upload.body
    })

  const del = (path: string, cookie?: string): Promise<Response> =>
    fetch(path, { method: 'DELETE', headers: cookie ? { Cookie: cookie } : {} })

  const errorCode = async (response: Response): Promise<string> => (await response.json() as { code: string }).code

  const uploadMine = async (cookie: string, image: Buffer, filename = 'a.jpg', type = 'image/jpeg'): Promise<string> => {
    const response = await put('/api/v1/moi/avatar', fileUpload(image, filename, type), cookie)
    expect(response.status).toBe(200)
    return ((await response.json()) as { avatarUrl: string }).avatarUrl
  }

  describe('PUT /moi/avatar and GET /competiteurs/{id}/avatar', () => {
    it('strips EXIF and GPS, applies the orientation, and serves with the security headers', async () => {
      const cookie = await cookieOf(alice)
      const original = await makeJpegWithGps(200, 100, 6)
      const avatarUrl = await uploadMine(cookie, original)
      expect(avatarUrl).toMatch(AVATAR_URL_PATTERN)
      expect(avatarUrl).toContain(alice.competitorId!)

      const served = await getWith(avatarUrl)
      expect(served.status).toBe(200)
      expect(served.headers.get('content-type')).toBe('image/jpeg')
      expect(served.headers.get('x-content-type-options')).toBe('nosniff')
      expect(served.headers.get('content-security-policy')).toBe("default-src 'none'")
      expect(served.headers.get('content-disposition')).toBe('inline')
      expect(served.headers.get('etag')).toMatch(/^"[0-9a-f]{64}"$/)

      const bytes = Buffer.from(await served.arrayBuffer())
      const metadata = await sharp(bytes).metadata()
      expect(metadata.exif).toBeUndefined()
      expect(metadata.orientation).toBeUndefined()
      expect([metadata.width, metadata.height]).toEqual([100, 200])
      expect(bytes.includes(Buffer.from('Exif'))).toBe(false)
      expect(bytes.includes(Buffer.from('FixtureCam'))).toBe(false)
    })

    it('accepts JPEG, PNG and WebP and serves each with its detected type', async () => {
      const cookie = await cookieOf(alice)
      const cases: Array<[Buffer, string]> = [[await makePng(), 'image/png'], [await makeWebp(), 'image/webp'], [await makeJpegWithGps(), 'image/jpeg']]
      for (const [image, type] of cases) {
        // Le nom et le type déclarés sont faux à dessein : seule la signature compte.
        const avatarUrl = await uploadMine(cookie, image, 'photo.bin', 'application/octet-stream')
        const served = await getWith(avatarUrl)
        expect(served.headers.get('content-type')).toBe(type)
      }
    })

    it('caches: 304 on the ETag, immutable with the right ?v=, revalidation otherwise, new URL after a new upload', async () => {
      const cookie = await cookieOf(alice)
      const first = await uploadMine(cookie, await makePng(64, 64))
      const path = first.split('?')[0]!

      const versioned = await getWith(first)
      expect(versioned.status).toBe(200)
      expect(versioned.headers.get('cache-control')).toBe('public, max-age=31536000, immutable')
      const etag = versioned.headers.get('etag')!

      const plain = await getWith(path)
      expect(plain.status).toBe(200)
      expect(plain.headers.get('cache-control')).toBe('no-cache')
      expect(plain.headers.get('etag')).toBe(etag)

      const revalidated = await fetch(path, { headers: { 'If-None-Match': etag } })
      expect(revalidated.status).toBe(304)
      expect(await revalidated.text()).toBe('')

      const second = await uploadMine(cookie, await makePng(80, 80))
      expect(second).not.toBe(first)
      expect((await getWith(first)).headers.get('cache-control')).toBe('no-cache')
      expect((await getWith(second)).headers.get('cache-control')).toBe('public, max-age=31536000, immutable')
    })

    it('exposes the URL (and nothing about the stored bytes) in public DTOs and in /moi', async () => {
      const cookie = await cookieOf(bob)
      const avatarUrl = await uploadMine(cookie, await makePng())

      const detail = await (await getWith(`/api/v1/competiteurs/${bob.competitorId}`)).json() as Record<string, unknown>
      expect(detail.avatarUrl).toBe(avatarUrl)
      const serialized = JSON.stringify(detail)
      expect(serialized).not.toMatch(/"content"|"sha256"|"byteSize"|"mimeType"/)

      const me = await (await getWith('/api/v1/moi', cookie)).json() as { competitor: { avatarUrl: string } }
      expect(me.competitor.avatarUrl).toBe(avatarUrl)
    })
  })

  describe('refusals', () => {
    it('413 AVATAR_TOO_LARGE for a file of 2 MiB + 1 byte', async () => {
      const cookie = await cookieOf(alice)
      const oversized = Buffer.concat([await makePng(), Buffer.alloc(AVATAR_MAX_BYTES + 1)]).subarray(0, AVATAR_MAX_BYTES + 1)
      const response = await put('/api/v1/moi/avatar', fileUpload(oversized, 'a.png', 'image/png'), cookie)
      expect(response.status).toBe(413)
      expect(await errorCode(response)).toBe(API_ERROR_CODE.AVATAR_TOO_LARGE)
    })

    it('413 immediately when Content-Length exceeds the cap, without reading the body', async () => {
      const cookie = await cookieOf(alice)
      const declared = AVATAR_MAX_BYTES + AVATAR_MULTIPART_OVERHEAD_BYTES + 1
      const outcome = await new Promise<{ status: number, written: number }>((resolve, reject) => {
        let written = 0
        const req = request(url('/api/v1/moi/avatar'), {
          method: 'PUT',
          headers: { 'Content-Type': 'multipart/form-data; boundary=x', 'Content-Length': String(declared), Cookie: cookie }
        }, (res) => {
          res.resume()
          resolve({ status: res.statusCode ?? 0, written })
          req.destroy()
        })
        req.on('error', () => undefined)
        req.write(Buffer.alloc(1024))
        written += 1024
        setTimeout(() => reject(new Error('no response before the body was complete')), 10000).unref()
      })
      expect(outcome.status).toBe(413)
    })

    it('stops reading a long stream at the cap (the client cannot push 64 MiB)', async () => {
      const cookie = await cookieOf(alice)
      const outcome = await new Promise<{ status: number, written: number }>((resolve, reject) => {
        let written = 0
        let answered = false
        const chunk = Buffer.alloc(64 * 1024, 1)
        const req = request(url('/api/v1/moi/avatar'), {
          method: 'PUT',
          headers: { 'Content-Type': 'multipart/form-data; boundary=x', 'Transfer-Encoding': 'chunked', Cookie: cookie }
        }, (res) => {
          answered = true
          res.resume()
          res.on('end', () => resolve({ status: res.statusCode ?? 0, written }))
        })
        req.on('error', () => (answered ? undefined : reject(new Error('connection error before the response'))))
        const push = (): void => {
          while (!answered && written < 64 * 1024 * 1024) {
            written += chunk.length
            if (!req.write(chunk)) {
              req.once('drain', push)
              return
            }
          }
          req.end()
        }
        push()
      })
      expect(outcome.status).toBe(413)
      expect(outcome.written).toBeLessThan(16 * 1024 * 1024)
    })

    it('415 AVATAR_UNSUPPORTED_TYPE for a text file named .jpg declared image/jpeg, and for a GIF', async () => {
      const cookie = await cookieOf(alice)
      const text = await put('/api/v1/moi/avatar', fileUpload(Buffer.from('this is not an image'), 'a.jpg', 'image/jpeg'), cookie)
      expect(text.status).toBe(415)
      expect(await errorCode(text)).toBe(API_ERROR_CODE.AVATAR_UNSUPPORTED_TYPE)
      const gif = await put('/api/v1/moi/avatar', fileUpload(makeGif(), 'a.gif', 'image/gif'), cookie)
      expect(gif.status).toBe(415)
    })

    it('422 AVATAR_UNREADABLE for a truncated JPEG', async () => {
      const cookie = await cookieOf(alice)
      const jpeg = await makeJpegWithGps(400, 400, 1)
      const response = await put('/api/v1/moi/avatar', fileUpload(jpeg.subarray(0, Math.floor(jpeg.length / 2))), cookie)
      expect(response.status).toBe(422)
      expect(await errorCode(response)).toBe(API_ERROR_CODE.AVATAR_UNREADABLE)
    })

    it('400 VALIDATION_FAILED when the file field is missing, misnamed, duplicated, or the body is not multipart', async () => {
      const cookie = await cookieOf(alice)
      const png = await makePng()
      const bodies = [
        buildMultipart([]),
        buildMultipart([{ name: 'avatar', filename: 'a.png', content: png, contentType: 'image/png' }]),
        buildMultipart([{ name: 'file', filename: 'a.png', content: png }, { name: 'file', filename: 'b.png', content: png }]),
        buildMultipart([{ name: 'file', filename: 'a.png', content: png }, { name: 'note', content: 'hello' }]),
        buildMultipart([{ name: 'file', content: 'a text field, not a file' }])
      ]
      for (const upload of bodies) {
        const response = await put('/api/v1/moi/avatar', upload, cookie)
        expect(response.status).toBe(400)
        expect(await errorCode(response)).toBe(API_ERROR_CODE.VALIDATION_FAILED)
      }
      const json = await fetch('/api/v1/moi/avatar', { method: 'PUT', headers: { 'Content-Type': 'application/json', Cookie: cookie }, body: '{}' })
      expect(json.status).toBe(400)
      expect(await errorCode(json)).toBe(API_ERROR_CODE.VALIDATION_FAILED)
    })

    it('a refused upload leaves the previous avatar untouched', async () => {
      const cookie = await cookieOf(alice)
      const kept = await uploadMine(cookie, await makePng())
      expect((await put('/api/v1/moi/avatar', fileUpload(Buffer.from('nope')), cookie)).status).toBe(415)
      const me = await (await getWith('/api/v1/moi', cookie)).json() as { competitor: { avatarUrl: string } }
      expect(me.competitor.avatarUrl).toBe(kept)
    })
  })

  describe('access control', () => {
    it('401 for an anonymous caller on every write route', async () => {
      const upload = fileUpload(await makePng())
      expect((await put('/api/v1/moi/avatar', upload)).status).toBe(401)
      expect((await put(`/api/v1/competiteurs/${alice.competitorId}/avatar`, upload)).status).toBe(401)
      expect((await del('/api/v1/moi/avatar')).status).toBe(401)
      expect((await del(`/api/v1/competiteurs/${alice.competitorId}/avatar`)).status).toBe(401)
    })

    it('403 for a participant on the admin routes, and the other competitor is untouched', async () => {
      const cookie = await cookieOf(alice)
      const before = (await (await getWith(`/api/v1/competiteurs/${bob.competitorId}`)).json() as { avatarUrl: string | null }).avatarUrl
      const upload = fileUpload(await makePng(10, 10))
      expect((await put(`/api/v1/competiteurs/${bob.competitorId}/avatar`, upload, cookie)).status).toBe(403)
      expect((await del(`/api/v1/competiteurs/${bob.competitorId}/avatar`, cookie)).status).toBe(403)
      const after = (await (await getWith(`/api/v1/competiteurs/${bob.competitorId}`)).json() as { avatarUrl: string | null }).avatarUrl
      expect(after).toBe(before)
    })

    it('GET is public', async () => {
      const cookie = await cookieOf(alice)
      const avatarUrl = await uploadMine(cookie, await makePng())
      expect((await fetch(avatarUrl)).status).toBe(200)
    })

    it('GET answers 404 without avatar and 400 for a malformed id', async () => {
      expect((await getWith(`/api/v1/competiteurs/${NOT_FOUND_UUID}/avatar`)).status).toBe(404)
      expect((await getWith('/api/v1/competiteurs/not-a-uuid/avatar')).status).toBe(400)
    })

    it('an account without competitor cannot use /moi/avatar (422)', async () => {
      const cookie = await cookieOf(admin)
      expect((await put('/api/v1/moi/avatar', fileUpload(await makePng()), cookie)).status).toBe(422)
      expect((await del('/api/v1/moi/avatar', cookie)).status).toBe(422)
    })
  })

  describe('admin routes', () => {
    it('PUT sets the avatar of any competitor, 404 COMPETITOR_NOT_FOUND for an unknown one', async () => {
      const cookie = await cookieOf(admin)
      const response = await put(`/api/v1/competiteurs/${bob.competitorId}/avatar`, fileUpload(await makeJpegWithGps()), cookie)
      expect(response.status).toBe(200)
      expect(((await response.json()) as { avatarUrl: string }).avatarUrl).toContain(`/competiteurs/${bob.competitorId}/avatar?v=`)

      const unknown = await put(`/api/v1/competiteurs/${NOT_FOUND_UUID}/avatar`, fileUpload(await makePng()), cookie)
      expect(unknown.status).toBe(404)
      expect(await errorCode(unknown)).toBe(API_ERROR_CODE.COMPETITOR_NOT_FOUND)
      expect((await put('/api/v1/competiteurs/not-a-uuid/avatar', fileUpload(await makePng()), cookie)).status).toBe(400)
    })

    it('DELETE removes the avatar (204), then 404; 404 COMPETITOR_NOT_FOUND for an unknown competitor', async () => {
      const cookie = await cookieOf(admin)
      await put(`/api/v1/competiteurs/${bob.competitorId}/avatar`, fileUpload(await makePng()), cookie)
      expect((await del(`/api/v1/competiteurs/${bob.competitorId}/avatar`, cookie)).status).toBe(204)
      expect((await del(`/api/v1/competiteurs/${bob.competitorId}/avatar`, cookie)).status).toBe(404)
      expect((await getWith(`/api/v1/competiteurs/${bob.competitorId}/avatar`)).status).toBe(404)
      const unknown = await del(`/api/v1/competiteurs/${NOT_FOUND_UUID}/avatar`, cookie)
      expect(unknown.status).toBe(404)
      expect(await errorCode(unknown)).toBe(API_ERROR_CODE.COMPETITOR_NOT_FOUND)
    })
  })

  describe('DELETE /moi/avatar', () => {
    it('204 then the avatar is null (initials on the front); 404 when there is none', async () => {
      const cookie = await cookieOf(alice)
      await uploadMine(cookie, await makePng())
      expect((await del('/api/v1/moi/avatar', cookie)).status).toBe(204)
      expect((await del('/api/v1/moi/avatar', cookie)).status).toBe(404)
      const me = await (await getWith('/api/v1/moi', cookie)).json() as { competitor: { avatarUrl: string | null } }
      expect(me.competitor.avatarUrl).toBeNull()
      expect((await getWith(`/api/v1/competiteurs/${alice.competitorId}/avatar`)).status).toBe(404)
    })
  })
  describe('edition ETag after an avatar change (wave 3a review, M1)', () => {
    it('changes the participants ETag after a PUT and after a DELETE, so no 304 serves a stale avatarUrl', async () => {
      const carol = await seedUser(dataSource, { email: 'carol@ccc.test', password: PASSWORD, role: USER_ROLE.PARTICIPANT, withCompetitor: true })
      const edition = await dataSource.getRepository(EditionEntity).save({
        code: '2041', year: 2041, chronologicalRank: 2041, origin: EDITION_ORIGIN.APP, status: EDITION_STATUS.CLOSED, name: 'Édition 2041'
      })
      await dataSource.getRepository(ParticipationEntity).save({ editionId: edition.id, competitorId: carol.competitorId!, finalStage: null, points: null })
      const path = `/api/v1/editions/${edition.id}/participants`
      const avatarOf = async (response: Response): Promise<string | null> =>
        ((await response.json()) as IEditionParticipant[]).find((item) => item.competitor.id === carol.competitorId)!.competitor.avatarUrl

      const before = await fetch(path)
      expect(before.status).toBe(200)
      const etagBefore = before.headers.get('etag')!
      expect(await avatarOf(before)).toBeNull()

      const cookie = await cookieOf(admin)
      expect((await put(`/api/v1/competiteurs/${carol.competitorId}/avatar`, fileUpload(await makePng()), cookie)).status).toBe(200)
      const afterUpload = await fetch(path, { headers: { 'If-None-Match': etagBefore } })
      expect(afterUpload.status).toBe(200)
      const etagAfterUpload = afterUpload.headers.get('etag')!
      expect(etagAfterUpload).not.toBe(etagBefore)
      expect(await avatarOf(afterUpload)).toMatch(AVATAR_URL_PATTERN)

      expect((await del(`/api/v1/competiteurs/${carol.competitorId}/avatar`, cookie)).status).toBe(204)
      const afterDelete = await fetch(path, { headers: { 'If-None-Match': etagAfterUpload } })
      expect(afterDelete.status).toBe(200)
      expect(afterDelete.headers.get('etag')).not.toBe(etagAfterUpload)
      expect(await avatarOf(afterDelete)).toBeNull()
    })
  })
})

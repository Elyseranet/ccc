import sharp from 'sharp'
import { describe, expect, it } from 'vitest'
import { AVATAR_MAX_DIMENSION_PX } from '../../src/consts/avatar.const'
import { detectAvatarMimeType, processAvatarImage } from '../../src/utils/avatar-image.util'
import { buildAvatarUrl } from '../../src/utils/avatar-url.util'
import { API_ERROR_CODE } from '../../src/enums/api-error-code.enum'
import { AVATAR_MIME_TYPE } from '../../src/enums/avatar.enum'
import { makeGif, makeJpegWithGps, makePng, makeWebp } from '../helpers/avatar-fixtures'

describe('detectAvatarMimeType', () => {
  it('recognises JPEG, PNG and WebP by their magic bytes', async () => {
    expect(detectAvatarMimeType(await makeJpegWithGps())).toBe(AVATAR_MIME_TYPE.JPEG)
    expect(detectAvatarMimeType(await makePng())).toBe(AVATAR_MIME_TYPE.PNG)
    expect(detectAvatarMimeType(await makeWebp())).toBe(AVATAR_MIME_TYPE.WEBP)
  })

  it('refuses GIF, text, an empty buffer and a bare RIFF header', () => {
    expect(detectAvatarMimeType(makeGif())).toBeNull()
    expect(detectAvatarMimeType(Buffer.from('not an image, renamed .jpg'))).toBeNull()
    expect(detectAvatarMimeType(Buffer.alloc(0))).toBeNull()
    expect(detectAvatarMimeType(Buffer.from('RIFF0000WAVE'))).toBeNull()
  })
})

describe('processAvatarImage', () => {
  it('strips EXIF and GPS, and applies the orientation (Orientation 6 swaps width and height)', async () => {
    const input = await makeJpegWithGps(200, 100, 6)
    const before = await sharp(input).metadata()
    expect(before.exif).toBeDefined()
    expect(before.orientation).toBe(6)
    expect(before.exif!.includes(Buffer.from('FixtureCam'))).toBe(true)
    // Latitude 48/1 51/1 30/1 : trois rationnels, petit-boutiste, dans le bloc GPS de l'EXIF d'entrée.
    const latitude = Buffer.from([48, 0, 0, 0, 1, 0, 0, 0, 51, 0, 0, 0, 1, 0, 0, 0, 30, 0, 0, 0, 1, 0, 0, 0])
    expect(before.exif!.includes(latitude)).toBe(true)
    expect(input.includes(Buffer.from('Exif'))).toBe(true)

    const { content, mimeType, byteSize, sha256 } = await processAvatarImage(input, AVATAR_MIME_TYPE.JPEG)
    const metadata = await sharp(content).metadata()
    expect(metadata.exif).toBeUndefined()
    expect(metadata.xmp).toBeUndefined()
    expect(metadata.iptc).toBeUndefined()
    expect(metadata.orientation).toBeUndefined()
    expect([metadata.width, metadata.height]).toEqual([100, 200])
    expect(content.includes(Buffer.from('Exif'))).toBe(false)
    expect(content.includes(Buffer.from('FixtureCam'))).toBe(false)
    expect(mimeType).toBe(AVATAR_MIME_TYPE.JPEG)
    expect(byteSize).toBe(content.length)
    expect(sha256).toMatch(/^[0-9a-f]{64}$/)
  })

  it('downsizes to 512 px at most, and never enlarges', async () => {
    const big = await processAvatarImage(await makePng(1200, 600), AVATAR_MIME_TYPE.PNG)
    expect(await sharp(big.content).metadata()).toMatchObject({ width: AVATAR_MAX_DIMENSION_PX, height: 256, format: 'png' })
    const small = await processAvatarImage(await makePng(64, 64), AVATAR_MIME_TYPE.PNG)
    expect(await sharp(small.content).metadata()).toMatchObject({ width: 64, height: 64 })
  })

  it('keeps the detected format', async () => {
    const webp = await processAvatarImage(await makeWebp(), AVATAR_MIME_TYPE.WEBP)
    expect((await sharp(webp.content).metadata()).format).toBe('webp')
  })

  it('answers AVATAR_UNREADABLE (422) for a truncated JPEG and for a valid signature on garbage', async () => {
    const jpeg = await makeJpegWithGps(400, 400, 1)
    const garbage = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff]), Buffer.alloc(64, 7)])
    for (const broken of [jpeg.subarray(0, Math.floor(jpeg.length / 2)), garbage]) {
      await expect(processAvatarImage(broken, AVATAR_MIME_TYPE.JPEG)).rejects.toMatchObject({
        statusCode: 422,
        data: { code: API_ERROR_CODE.AVATAR_UNREADABLE }
      })
    }
  })
})

describe('buildAvatarUrl', () => {
  it('is null without avatar and carries the fingerprint otherwise', () => {
    expect(buildAvatarUrl('abc', null)).toBeNull()
    expect(buildAvatarUrl('abc', '0123456789abcdef')).toBe('/api/v1/competiteurs/abc/avatar?v=0123456789abcdef')
  })
})

import sharp from 'sharp'

export const FIXTURE_GPS = { latitude: '48/1 51/1 30/1', longitude: '2/1 21/1 7/1' }

const solidImage = (width: number, height: number) =>
  sharp({ create: { width, height, channels: 3, background: { r: 200, g: 40, b: 40 } } })

/** JPEG synthétique portant des balises EXIF GPS et une orientation (aucune photo réelle). */
export const makeJpegWithGps = (width = 200, height = 100, orientation = 6): Promise<Buffer> =>
  solidImage(width, height)
    .withExif({
      IFD0: { Make: 'FixtureCam' },
      IFD3: {
        GPSLatitudeRef: 'N',
        GPSLatitude: FIXTURE_GPS.latitude,
        GPSLongitudeRef: 'E',
        GPSLongitude: FIXTURE_GPS.longitude
      }
    })
    // `withExif` n'écrit pas l'orientation : elle se pose par `withMetadata`.
    .withMetadata({ orientation })
    .jpeg()
    .toBuffer()

export const makePng = (width = 64, height = 64): Promise<Buffer> => solidImage(width, height).png().toBuffer()

export const makeWebp = (width = 64, height = 64): Promise<Buffer> => solidImage(width, height).webp().toBuffer()

export const makeGif = (): Buffer => Buffer.from('47494638396101000100800000000000ffffff21f90401000000002c00000000010001000002024401003b', 'hex')

/** Corps `multipart/form-data` à la main (frontière fixe), pour pouvoir fabriquer des cas hors norme. */
export const buildMultipart = (
  parts: Array<{ name: string, filename?: string, content: Buffer | string, contentType?: string }>
): { body: Buffer, contentType: string } => {
  const boundary = '----cccAvatarFixtureBoundary'
  const chunks: Buffer[] = []
  for (const part of parts) {
    const disposition = `Content-Disposition: form-data; name="${part.name}"${part.filename ? `; filename="${part.filename}"` : ''}`
    const type = part.contentType ? `\r\nContent-Type: ${part.contentType}` : ''
    chunks.push(Buffer.from(`--${boundary}\r\n${disposition}${type}\r\n\r\n`), Buffer.from(part.content), Buffer.from('\r\n'))
  }
  chunks.push(Buffer.from(`--${boundary}--\r\n`))
  return { body: Buffer.concat(chunks), contentType: `multipart/form-data; boundary=${boundary}` }
}

export const fileUpload = (content: Buffer, filename = 'avatar.jpg', contentType = 'image/jpeg') =>
  buildMultipart([{ name: 'file', filename, content, contentType }])

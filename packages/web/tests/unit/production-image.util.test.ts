import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { PRODUCTION_IMAGE_MARKER_PATH } from '../../src/consts/runtime-config.const'
import { isProductionImage } from '../../src/utils/production-image.util'

describe('isProductionImage (T-SEC-06)', () => {
  it('is false when the marker file is absent and true when it exists', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'ccc-marker-'))
    try {
      const marker = join(directory, '.ccc-production-image')
      expect(isProductionImage(marker)).toBe(false)
      await writeFile(marker, '')
      expect(isProductionImage(marker)).toBe(true)
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  })

  it('looks for the marker where the Dockerfile puts it', () => {
    expect(PRODUCTION_IMAGE_MARKER_PATH).toBe('/app/.ccc-production-image')
  })
})

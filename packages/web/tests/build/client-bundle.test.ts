import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { SERVER_ONLY_BUNDLE_MARKERS } from '../../src/consts/client-bundle-guard.const'

/*********************************************************
 * Aucun code serveur dans le bundle navigateur (T-ARCH-01, ARCH-1 et ARCH-2)
 *
 * @description
 * Lancé par `npm run test:bundle`, juste après `nuxt build`. Inspecte chaque chunk JavaScript livré au navigateur
 * (`.output/public/_nuxt`) et y cherche les empreintes du code serveur : TypeORM, reflect-metadata, pilote pg,
 * crypto Node, noms de tables. Le plugin `clientBundleGuard` fait déjà échouer le build sur les modules ; ce test
 * vérifie le résultat final, octet par octet.
 ********************************************************/
const CLIENT_DIRECTORY = join('.output', 'public', '_nuxt')

describe('bundle navigateur', () => {
  it('le build de production a produit des chunks client', () => {
    expect(existsSync(CLIENT_DIRECTORY), 'lancer `nuxt build` avant ce test (npm run test:bundle)').toBe(true)
    expect(readdirSync(CLIENT_DIRECTORY).filter((file) => file.endsWith('.js')).length).toBeGreaterThan(0)
  })

  it('aucun chunk client ne contient de code serveur', () => {
    const chunks = readdirSync(CLIENT_DIRECTORY).filter((file) => file.endsWith('.js'))
    const offenders = chunks.flatMap((file) => {
      const code = readFileSync(join(CLIENT_DIRECTORY, file), 'utf8')
      return SERVER_ONLY_BUNDLE_MARKERS.filter((marker) => code.includes(marker)).map((marker) => `${file}: ${marker}`)
    })
    expect(offenders).toEqual([])
  })
})

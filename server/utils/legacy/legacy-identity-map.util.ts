import { z } from 'zod'
import { LEGACY_IMPORT_ERROR_CODE } from '../../enums/legacy-import.enum.js'
import type { TLegacyIdentityMapEntry } from '../../types/legacy-import.type.js'
import { LegacyImportError } from './legacy-import-error.util.js'

const mergeEntry = z.strictObject({ alias: z.string().min(1), competitor: z.string().min(1) })
const createEntry = z.strictObject({ alias: z.string().min(1), create: z.literal(true) })
const identityMapSchema = z.array(z.union([mergeEntry, createEntry]))

/** Valide la forme du fichier de correspondance avant tout usage : objets stricts, aucune clé inattendue. */
export function parseIdentityMap(raw: unknown): TLegacyIdentityMapEntry[] {
  const result = identityMapSchema.safeParse(raw)
  if (!result.success) {
    throw new LegacyImportError(
      LEGACY_IMPORT_ERROR_CODE.IDENTITY_MAP_INVALID,
      'Fichier de correspondance invalide',
      result.error.issues.map((issue) => `${issue.path.join('.') || '(racine)'} : ${issue.message}`),
    )
  }
  return result.data
}

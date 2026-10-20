import type {
  ILegacyIdentityCreateEntry,
  ILegacyIdentityMergeEntry,
} from '../interfaces/legacy-import.interface.js'

export type TLegacyIdentityMapEntry = ILegacyIdentityMergeEntry | ILegacyIdentityCreateEntry

export type TLegacyCell = string | number | boolean | null | undefined

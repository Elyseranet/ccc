import type { ALIGN } from 'origam/enums'
import type { EDITION_FORM_MODE,EDITION_READONLY_FIELD } from '../enums/admin-editions.enum.js'
import type { EDITION_CHIP_FAMILY } from '../enums/edition-tab.enum.js'
import type { IAdminFailure } from './admin-failure.interface.js'
import type { ITranslatableText } from './common-components.interface.js'
import type { IEditionDetail, IEditionSummary } from './edition.interface.js'

/** Valeurs saisies du formulaire d'édition ; l'année est du texte (champ au clavier numérique, décision 87eea8e). */
export interface IEditionFormValues {
  year: string
  name: string
  /** Date `YYYY-MM-DD`, ou `null` quand le champ est vide. */
  heldOn: string | null
  location: string
  description: string
}

export interface IAdminEditionColumn {
  /** Propriété de l'édition affichée (clé de colonne d'origam-data-table). */
  field: string
  title: ITranslatableText
  sortable: boolean
  align?: ALIGN.START | ALIGN.END
}

export interface IEditionFormProps {
  mode: EDITION_FORM_MODE
  values: IEditionFormValues
  pending?: boolean
  failure?: IAdminFailure | null
  /** Édition modifiée (mode EDIT) : son code, son année et son statut s'affichent en lecture seule. */
  edition?: IEditionSummary | null
  /** Dernier enregistrement réussi (mode EDIT) : affiche la confirmation. */
  saved?: boolean
}

export interface IEditionFormEmits {
  (event: 'submit', values: IEditionFormValues): void
}

export interface IEditionsTableProps {
  editions: IEditionSummary[]
}

export interface IEditionsToolbarProps {
  query: string
}

export interface IEditionsToolbarEmits {
  (event: 'update:query', value: string): void
}

export interface IEditionCreatedProps {
  edition: IEditionSummary
}

export interface IEditionReadonlyFieldsProps {
  edition: IEditionSummary
  fields: EDITION_READONLY_FIELD[]
}

export interface IEditionClosedProps {
  edition: IEditionDetail
  failure?: IAdminFailure | null
}

/** Ligne de la fiche en lecture seule : texte déjà traduit, précision et famille de pastille (statut). */
export interface IEditionReadonlyRow {
  id: EDITION_READONLY_FIELD
  label: string
  text: string
  hint: string | null
  chip: EDITION_CHIP_FAMILY | null
  /** Valeur absente : affichée atténuée. */
  missing: boolean
}

export interface IEditionReadonlyValueProps {
  row: IEditionReadonlyRow
}

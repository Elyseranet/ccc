import type { LEGAL_BLOCK } from '../enums/legal-block.enum.js'
import type { ITranslatableText } from './common-components.interface.js'

export interface ILegalCell {
  text?: ITranslatableText
  code?: string
}

export interface ILegalTable {
  caption: ITranslatableText
  columns: ITranslatableText[]
  rows: ILegalCell[][]
}

export interface ILegalDefinition {
  term: ITranslatableText
  description: ITranslatableText
}

export interface ILegalLink {
  text: ITranslatableText
  href?: string
  to?: string
}

export interface ILegalBlock {
  kind: LEGAL_BLOCK
  text?: ITranslatableText
  items?: ITranslatableText[]
  table?: ILegalTable
  definitions?: ILegalDefinition[]
  link?: ILegalLink
}

export interface ILegalSection {
  id: string
  title: ITranslatableText
  blocks: ILegalBlock[]
}

export interface ILegalRelatedLink {
  to: string
  label: ITranslatableText
}

export interface ILegalPageContent {
  path: string
  title: ITranslatableText
  updated: ITranslatableText
  sections: ILegalSection[]
  related: ILegalRelatedLink[]
}

export interface ILegalPageProps {
  content: ILegalPageContent
}

export interface ILegalTextProps {
  text: string
}

export interface ILegalTextPart {
  text: string
  marker: boolean
}

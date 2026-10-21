import type { ITranslatableText } from '~/interfaces/common-components.interface'

export interface IRulesFact {
  id: string
  label: ITranslatableText
  value: string
}

export interface IRulesStep {
  id: string
  title: ITranslatableText
  text: ITranslatableText
}

export interface IRulesTournamentCard {
  id: string
  eyebrow: ITranslatableText
  title?: ITranslatableText
  text: ITranslatableText
  bigValue?: string
  bigUnit?: ITranslatableText
  isAmber?: boolean
}

export interface IRulesBeer {
  x: number
  y: number
  radius: number
  capRadius: number
}

export interface IRulesPodiumBar {
  x: number
  y: number
  width: number
  height: number
}

export interface IRulesPodiumLabel {
  x: number
  y: number
  text: ITranslatableText
}

export interface IRulesVariant {
  id: string
  number: string
  name: ITranslatableText
  description: ITranslatableText
  figureLabel: ITranslatableText
  beers: IRulesBeer[]
  bars?: IRulesPodiumBar[]
  labels?: IRulesPodiumLabel[]
}

export interface IRulesVariantFigureProps {
  variant: IRulesVariant
}

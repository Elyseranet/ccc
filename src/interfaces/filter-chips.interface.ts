export interface IFilterChipItem {
  value: string
  /** Libellé déjà traduit. */
  label: string
  count: number
  dataCy: string
}

export interface IFilterChipsProps {
  items: IFilterChipItem[]
  modelValue: string
  /** Nom accessible du groupe (`aria-label`), chaîne déjà traduite : celui de la file de matchs porte la portée (tour, poule), donc des paramètres que le composant ne connaît pas. */
  label: string
}

export interface IFilterChipsEmits {
  (event: 'update:modelValue', value: string): void
}

export interface IFilterChipsSlots {}

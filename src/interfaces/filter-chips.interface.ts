export interface IFilterChipItem<T extends string = string> {
  value: T
  /** Libellé déjà traduit. */
  label: string
  count: number
  dataCy: string
}

export interface IFilterChipsProps<T extends string = string> {
  items: IFilterChipItem<T>[]
  modelValue: T
  /** Chaîne déjà traduite : celui de la file de matchs porte la portée (tour, poule), donc des paramètres que le composant ne connaît pas. */
  ariaLabel: string
}

export interface IFilterChipsEmits<T extends string = string> {
  (event: 'update:modelValue', value: T): void
}

export interface IFilterChipsSlots {}
